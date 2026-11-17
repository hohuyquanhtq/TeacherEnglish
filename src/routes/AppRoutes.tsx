import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/src/config/navigation';
import { AuthLayout } from '@/src/layouts/AuthLayout';
import { MainLayout } from '@/src/layouts/MainLayout';
import { AdminPage } from '@/src/pages/AdminPage';
import { AiCoachPage } from '@/src/pages/AiCoachPage';
import { AssessmentsPage } from '@/src/pages/AssessmentsPage';
import { BilingualLessonsPage } from '@/src/pages/BilingualLessonsPage';
import { DashboardPage } from '@/src/pages/DashboardPage';
import { EnglishClassroomPage } from '@/src/pages/EnglishClassroomPage';
import { LibraryPage } from '@/src/pages/LibraryPage';
import { LoginPage } from '@/src/pages/LoginPage';
import { NotFoundPage } from '@/src/pages/NotFoundPage';
import { PreferencesSetupPage } from '@/src/pages/PreferencesSetupPage';
import { ProfileSetupPage } from '@/src/pages/ProfileSetupPage';
import { RegisterPage } from '@/src/pages/RegisterPage';
import { ReportsPage } from '@/src/pages/ReportsPage';
import { RoadmapPage } from '@/src/pages/RoadmapPage';
import { SpeakingPracticePage } from '@/src/pages/SpeakingPracticePage';
import { SubjectEnglishPage } from '@/src/pages/SubjectEnglishPage';
import { TeachingPracticePage } from '@/src/pages/TeachingPracticePage';
import { ProtectedRoute } from '@/src/routes/protectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth standalone layout */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      </Route>

      {/* Protected main application workspace */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ROADMAP} element={<RoadmapPage />} />
          <Route path={ROUTES.ENGLISH_CLASSROOM} element={<EnglishClassroomPage />} />
          <Route path={ROUTES.SUBJECT_ENGLISH} element={<SubjectEnglishPage />} />
          <Route path={ROUTES.BILINGUAL_LESSONS} element={<BilingualLessonsPage />} />
          <Route path={ROUTES.AI_COACH} element={<AiCoachPage />} />
          <Route path={ROUTES.SPEAKING} element={<SpeakingPracticePage />} />
          <Route path={ROUTES.TEACHING_PRACTICE} element={<TeachingPracticePage />} />
          <Route path={ROUTES.ASSESSMENTS} element={<AssessmentsPage />} />
          <Route path={ROUTES.LIBRARY} element={<LibraryPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.PROFILE_SETUP} element={<ProfileSetupPage />} />
          <Route path={ROUTES.PREFERENCES} element={<PreferencesSetupPage />} />

          {/* Admin-only route */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path={ROUTES.ADMIN} element={<AdminPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
};
