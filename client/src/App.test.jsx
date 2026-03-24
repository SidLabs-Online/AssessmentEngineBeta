import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from './AppRoutes'
import { AssessmentContext } from './context/assessmentContextObject'
import { assessmentDefinition } from './data/assessmentDefinition'
import { AuthContext } from './context/authContextObject'
import {
  createAssessmentSession,
  formatRemainingTime,
  getSecondsRemaining,
} from './utils/assessmentEngine'
import { validateCandidateDetails } from './utils/candidateDetailsValidation'
import { validateLoginForm } from './utils/loginValidation'

function renderWithProviders(route, authValue, assessmentValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <AssessmentContext.Provider value={assessmentValue}>
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
        </MemoryRouter>
      </AssessmentContext.Provider>
    </AuthContext.Provider>,
  )
}

describe('login validation', () => {
  it('returns field errors for invalid input', () => {
    expect(validateLoginForm({ email: 'bad-email', password: '123' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Password must be at least 8 characters.',
    })
  })

  it('passes valid login input', () => {
    expect(
      validateLoginForm({
        email: 'candidate@sidlabs.com',
        password: 'SidLabs@2026',
      }),
    ).toEqual({})
  })
})

describe('candidate details validation', () => {
  it('returns strict email validation errors', () => {
    expect(
      validateCandidateDetails({
        age: '23',
        email: 'candidate..bad@sidlabs',
        fullName: 'Sid Demo',
        location: 'Bengaluru',
        roleApplied: 'Product Analyst',
      }),
    ).toEqual({
      email: 'Enter a valid email address.',
    })
  })
})

describe('assessment timer utilities', () => {
  it('initializes the timer from assessment metadata', () => {
    const session = createAssessmentSession(assessmentDefinition.metadata, 1000)

    expect(session.durationInMinutes).toBe(25)
    expect(session.expiresAt).toBe(1501000)
  })

  it('formats remaining time and clamps at zero', () => {
    const session = createAssessmentSession(assessmentDefinition.metadata, 0)

    expect(getSecondsRemaining(session, 2000)).toBe(1498)
    expect(getSecondsRemaining(session, 2000000)).toBe(0)
    expect(formatRemainingTime(65)).toBe('01:05')
  })
})

describe('assessment flow', () => {
  const authState = {
    isAuthenticated: true,
    isAuthLoading: false,
    login: async () => {},
    logout: async () => {},
    user: {
      email: 'candidate@sidlabs.com',
      name: 'SidLabs Demo Candidate',
    },
  }

  const baseAssessmentState = {
    assessmentDefinition,
    answers: {
      1: null,
      2: 'C',
      3: null,
    },
    assessmentSession: createAssessmentSession(assessmentDefinition.metadata, Date.now()),
    candidateDetails: {
      age: '23',
      email: 'candidate@sidlabs.com',
      fullName: 'Sid Demo',
      location: 'Bengaluru',
      roleApplied: 'Product Analyst',
    },
    currentQuestionIndex: 0,
    completionState: {
      message: '',
      status: 'idle',
    },
    goToQuestion: vi.fn(),
    saveCandidateDetails: vi.fn(),
    setAnswer: vi.fn(),
    startAssessment: vi.fn(),
    submissionSnapshot: null,
    submissionResult: null,
    submitAssessment: vi.fn(),
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-24T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders metadata on the explainer page', () => {
    renderWithProviders('/assessment-instructions', authState, baseAssessmentState)

    expect(
      screen.getByText('Platoputer Research Assistant Pre-Assessment'),
    ).toBeInTheDocument()
    expect(screen.getByText('25 minutes')).toBeInTheDocument()
  })

  it('opens a consent modal before continuing from candidate details', () => {
    renderWithProviders('/candidate-details', authState, baseAssessmentState)

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Instructions' }))

    expect(screen.getByText('Data collection consent')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Disagree' }))

    expect(screen.queryByText('Data collection consent')).not.toBeInTheDocument()
    expect(screen.getByText('Candidate Details')).toBeInTheDocument()
  })

  it('preserves selected answers while navigating between questions', () => {
    renderWithProviders('/assessment', authState, baseAssessmentState)

    fireEvent.click(screen.getByRole('radio', { name: /5/i }))
    expect(baseAssessmentState.setAnswer).toHaveBeenCalledWith(1, 'C')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(baseAssessmentState.goToQuestion).toHaveBeenCalledWith(1)
  })

  it('shows current progress and disables broken navigation states', () => {
    renderWithProviders('/assessment', authState, baseAssessmentState)

    expect(screen.getByText('Question 1 of 25')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('auto-submits when the timer expires', () => {
    const expiryState = {
      ...baseAssessmentState,
      assessmentSession: {
        assessmentId: assessmentDefinition.metadata.assessmentId,
        durationInMinutes: assessmentDefinition.metadata.durationInMinutes,
        expiresAt: Date.now() + 1000,
        startedAt: Date.now() - 1499000,
        status: 'in_progress',
      },
    }

    renderWithProviders('/assessment', authState, expiryState)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(expiryState.submitAssessment).toHaveBeenCalledWith('timer_expired')
  })

  it('redirects completed attempts to the thank-you page', () => {
    const completedState = {
      ...baseAssessmentState,
      assessmentSession: {
        ...baseAssessmentState.assessmentSession,
        status: 'submitted',
      },
      completionState: {
        message: 'Assessment submitted successfully.',
        status: 'success',
      },
      submissionSnapshot: {
        reason: 'manual_submit',
        submittedAt: '2026-03-24T12:20:00.000Z',
      },
    }

    renderWithProviders('/assessment', authState, completedState)

    expect(screen.getByText('Thank You')).toBeInTheDocument()
    expect(screen.getByText('Response received')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exit' })).toBeInTheDocument()
  })

  it('shows submission failure feedback without redirecting away', () => {
    const failureState = {
      ...baseAssessmentState,
      completionState: {
        message: 'Assessment submission could not be processed.',
        status: 'error',
      },
    }

    renderWithProviders('/assessment', authState, failureState)

    expect(
      screen.getByText('Assessment submission could not be processed.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 25')).toBeInTheDocument()
  })

  it('keeps unauthenticated users out of protected assessment routes', () => {
    renderWithProviders(
      '/assessment',
      {
        isAuthenticated: false,
        isAuthLoading: false,
        login: async () => {},
        logout: async () => {},
        user: null,
      },
      baseAssessmentState,
    )

    expect(screen.getByText('Candidate login')).toBeInTheDocument()
  })
})
