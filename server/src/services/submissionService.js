import mongoose from 'mongoose'
import { assessmentDefinition } from '../config/assessmentDefinition.js'
import { AssessmentSubmissionModel } from '../models/assessmentSubmissionModel.js'
import { validateCandidateDetails } from './candidateDetailsService.js'

const submissionTracker = new Set()
const FINAL_REASONS = ['manual_submit', 'timer_expired', 'integrity_violation_limit']



export async function validateSubmissionPayload(payload) {
  const errors = {}
  const main={ payload, errors };
  if (!payload || typeof payload !== 'object') return { errors: { p: 'Invalid' }, isValid: false }

  const candidateResult = await validateCandidateDetails(payload.candidateDetails, false)
  if (!candidateResult.isValid) errors.candidateDetails = candidateResult.errors
  if (payload.assessmentId !== assessmentDefinition.metadata.assessmentId) errors.id = 'Invalid ID'

  const allValidReasons = [
    'auto_save', 'user_left_tab_or_window', 'user_signout', 'user_closed_tab_or_browser',
    'manual_submit', 'timer_expired', 'integrity_violation_limit'
  ]
  const isViolation = typeof payload.reason === 'string' && payload.reason.startsWith('violation_')
  if (!allValidReasons.includes(payload.reason) && !isViolation) errors.reason = 'Invalid reason'

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    normalizedPayload: {
      ...payload,
      candidateDetails: candidateResult.candidateDetails,
      session: { ...payload.session, status: 'submitted' },
      integrityReport: payload.integrityReport || { violationCount: 0, violationLog: [] },
      submissionKey: `${payload.assessmentId}::${candidateResult?.candidateDetails?.email}::${payload.session?.startedAt}`
    },
    submissionKey: `${payload.assessmentId}::${candidateResult?.candidateDetails?.email}::${payload.session?.startedAt}`
  }
}

export function ensureSubmissionNotDuplicate(submissionKey, reason) {
  if (submissionTracker.has(`${submissionKey}::FINAL`)) return false
  if (FINAL_REASONS.includes(reason)) submissionTracker.add(`${submissionKey}::FINAL`)
  return true
}

export function releaseSubmissionKey(submissionKey) {
  submissionTracker.delete(submissionKey)
  submissionTracker.delete(`${submissionKey}::FINAL`)
}

export async function mirrorSubmission(normalizedPayload) {
  if (mongoose.connection.readyState !== 1) return { stored: false }
  try {
    await AssessmentSubmissionModel.findOneAndUpdate(
      { submissionKey: normalizedPayload.submissionKey },
      normalizedPayload, { upsert: true, new: true }
    )
    return { stored: true }
  } catch (error) {
    if (error?.code === 11000) throw new Error('duplicate_submission')
    throw error
  }
}