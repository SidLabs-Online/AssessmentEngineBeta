import mongoose from 'mongoose'
import { getAccessLogOverview } from './accessLogService.js'
import { AssessmentSubmissionModel } from '../models/assessmentSubmissionModel.js'

const EMPTY_DASHBOARD = {
  accessOverview: {
    recentAccess: [],
    uniqueIpCount: 0,
  },
  activity: [],
  latestSubmissions: [],
  overview: {
    completedAssessments: 0,
    completionRate: 0,
    expiredAssessments: 0,
    securityViolations: 0,
    partialSaves: 0,
    totalCandidates: 0,
    totalSubmissions: 0,
  },
  statusBreakdown: [
    { count: 0, label: 'Completed manually', tone: 'success' },
    { count: 0, label: 'Expired on timer', tone: 'warning' },
    { count: 0, label: 'Security violations', tone: 'danger' },
    { count: 0, label: 'Partial / Auto-saves', tone: 'neutral' },
  ],
}

// Helper to map reasons to UI labels and colors
function getStatusMapping(reason) {
  switch (reason) {
    case 'manual_submit':
      return { label: 'Completed manually', tone: 'success' };
    case 'timer_expired':
      return { label: 'Expired on timer', tone: 'warning' };
    case 'integrity_violation_limit':
      return { label: 'Security violation', tone: 'danger' };
    case 'user_signout':
      return { label: 'Partial: Signed out', tone: 'neutral' };
    case 'user_left_tab_or_window':
      return { label: 'Partial: Tab switched', tone: 'neutral' };
    case 'user_closed_tab_or_browser':
      return { label: 'Partial: Browser closed', tone: 'neutral' };
    case 'auto_save':
      return { label: 'Auto-saved progress', tone: 'neutral' };
    default:
      if (reason && reason.startsWith('violation_')) {
        return { label: 'Partial: Security warning', tone: 'warning' };
      }
      return { label: 'Unknown status', tone: 'neutral' };
  }
}

const defaultRepository = {
  async getDashboardSnapshot() {
    const [result] = await AssessmentSubmissionModel.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                completedAssessments: {
                  $sum: { $cond: [{ $eq: ['$reason', 'manual_submit'] }, 1, 0] },
                },
                expiredAssessments: {
                  $sum: { $cond: [{ $eq: ['$reason', 'timer_expired'] }, 1, 0] },
                },
                securityViolations: {
                  $sum: { $cond: [{ $eq: ['$reason', 'integrity_violation_limit'] }, 1, 0] },
                },
                partialSaves: {
                  $sum: { 
                    $cond: [
                      { $in: ['$reason', ['user_signout', 'user_left_tab_or_window', 'user_closed_tab_or_browser', 'auto_save']] }, 
                      1, 0
                    ] 
                  },
                },
                totalSubmissions: { $sum: 1 },
              },
            },
          ],
          totalCandidates: [
            { $group: { _id: '$candidateDetails.email' } },
            { $count: 'totalCandidates' },
          ],
          latestSubmissions: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                candidateEmail: '$candidateDetails.email',
                candidateName: '$candidateDetails.fullName',
                location: '$candidateDetails.location',
                reason: 1,
                roleApplied: '$candidateDetails.roleApplied',
                submittedAt: 1,
              },
            },
          ],
        },
      },
    ])

    return result || { latestSubmissions: [], overview: [], totalCandidates: [] }
  },
}

let adminDashboardRepository = defaultRepository

export async function getAdminDashboardData() {
  const isUsingDefaultRepository = adminDashboardRepository === defaultRepository

  if (isUsingDefaultRepository && mongoose.connection.readyState !== 1) {
    throw new Error('database_unavailable')
  }

  const snapshot = await adminDashboardRepository.getDashboardSnapshot()
  const accessOverview = await getAccessLogOverview()
  
  const overviewData = snapshot.overview?.[0] || {}
  const totalCandidates = snapshot.totalCandidates?.[0]?.totalCandidates || 0
  const totalSubmissions = overviewData.totalSubmissions || 0
  const completedAssessments = overviewData.completedAssessments || 0
  const expiredAssessments = overviewData.expiredAssessments || 0
  const securityViolations = overviewData.securityViolations || 0
  const partialSaves = overviewData.partialSaves || 0

  if (totalSubmissions === 0) {
    return { ...EMPTY_DASHBOARD, accessOverview }
  }

  const latestSubmissions = (snapshot.latestSubmissions || []).map((submission) => {
    const mapping = getStatusMapping(submission.reason);
    return {
      candidateEmail: submission.candidateEmail,
      candidateName: submission.candidateName,
      location: submission.location,
      reason: submission.reason,
      roleApplied: submission.roleApplied,
      statusLabel: mapping.label,
      tone: mapping.tone,
      submittedAt: submission.submittedAt,
    };
  });

  return {
    accessOverview,
    activity: latestSubmissions.map((submission) => ({
      detail: `${submission.roleApplied || 'Assessment candidate'} from ${submission.location || 'Unknown'}`,
      submittedAt: submission.submittedAt,
      title: `${submission.candidateName || submission.candidateEmail} - ${submission.statusLabel}`,
      tone: submission.tone,
    })),
    latestSubmissions,
    overview: {
      completedAssessments,
      completionRate: Math.round((completedAssessments / totalSubmissions) * 100),
      expiredAssessments,
      securityViolations,
      partialSaves,
      totalCandidates,
      totalSubmissions,
    },
    statusBreakdown: [
      {
        count: completedAssessments,
        label: 'Completed manually',
        tone: 'success',
      },
      {
        count: expiredAssessments,
        label: 'Expired on timer',
        tone: 'warning',
      },
      {
        count: securityViolations,
        label: 'Security violations',
        tone: 'danger',
      },
      {
        count: partialSaves,
        label: 'Partial / Auto-saves',
        tone: 'neutral',
      },
    ],
  }
}

export function setAdminDashboardRepository(repository) {
  adminDashboardRepository = repository
}

export function resetAdminDashboardRepository() {
  adminDashboardRepository = defaultRepository
}