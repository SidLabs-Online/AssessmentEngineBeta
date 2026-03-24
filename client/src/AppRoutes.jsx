import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AssessmentPage from './pages/AssessmentPage'
import AssessmentInstructionsPage from './pages/AssessmentInstructionsPage'
import CandidateDetailsPage from './pages/CandidateDetailsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ThankYouPage from './pages/ThankYouPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate-details"
        element={
          <ProtectedRoute>
            <CandidateDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment-instructions"
        element={
          <ProtectedRoute>
            <AssessmentInstructionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment"
        element={
          <ProtectedRoute>
            <AssessmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment-submitted"
        element={<Navigate replace to="/thank-you" />}
      />
      <Route
        path="/thank-you"
        element={
          <ProtectedRoute>
            <ThankYouPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRoutes
