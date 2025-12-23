import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { ScopeProvider } from '@/contexts/ScopeContext';
import { DateRangeProvider } from '@/contexts/DateRangeContext';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { BehaviorsPage } from '@/pages/BehaviorsPage';
import { AdoptionPage } from '@/pages/AdoptionPage';
import { TemporalIndicatorsPage } from '@/pages/TemporalIndicatorsPage';
import { BehaviorDeepDivePage } from '@/pages/BehaviorDeepDivePage';
import { SkillDevelopmentPage } from '@/pages/SkillDevelopmentPage';
import { BenchmarksPage } from '@/pages/BenchmarksPage';
import { CoachingInsightsPage } from '@/pages/CoachingInsightsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="behaviors" element={<BehaviorsPage />} />
          <Route path="behaviors/deep-dive" element={<BehaviorDeepDivePage />} />
          <Route path="temporal" element={<TemporalIndicatorsPage />} />
          <Route path="skills" element={<SkillDevelopmentPage />} />
          <Route path="benchmarks" element={<BenchmarksPage />} />
          <Route path="adoption" element={<AdoptionPage />} />
          <Route path="coaching" element={<CoachingInsightsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
