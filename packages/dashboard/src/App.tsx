import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { ScopeProvider } from '@/contexts/ScopeContext';
import { DateRangeProvider } from '@/contexts/DateRangeContext';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { VerifyPage } from '@/pages/VerifyPage';
import BaselinePage from '@/pages/BaselinePage';
import CredentialPage from '@/pages/CredentialPage';
import CredentialVerifyPage from '@/pages/CredentialVerifyPage';
import AssessmentLandingPage from '@/pages/AssessmentLandingPage';
import LiveChatAssessmentPage from '@/pages/LiveChatAssessmentPage';
import { HomePage } from '@/pages/HomePage';
import { PerformancePage } from '@/pages/PerformancePage';
import { BehaviorsPage } from '@/pages/BehaviorsPage';
import { AdoptionPage } from '@/pages/AdoptionPage';
import { CoachingInsightsPage } from '@/pages/CoachingInsightsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route path="/baseline" element={<BaselinePage />} />
        <Route path="/assessment" element={<AssessmentLandingPage />} />
        <Route path="/quick-assessment" element={<CredentialPage />} />
        <Route path="/live-chat-assessment/*" element={<LiveChatAssessmentPage />} />
        <Route path="/credential" element={<Navigate to="/quick-assessment" replace />} />
        <Route path="/verify/:credentialId" element={<CredentialVerifyPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ScopeProvider>
                <DateRangeProvider>
                  <Layout />
                </DateRangeProvider>
              </ScopeProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="behaviors" element={<BehaviorsPage />} />
          <Route path="adoption" element={<AdoptionPage />} />
          <Route path="coaching" element={<CoachingInsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
