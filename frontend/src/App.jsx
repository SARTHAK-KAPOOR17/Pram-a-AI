import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './layouts/AppLayout.jsx';
import { ProjectLayout } from './layouts/ProjectLayout.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProjectsListPage } from './pages/ProjectsListPage.jsx';
import { CreateProjectPage } from './pages/CreateProjectPage.jsx';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage.jsx';
import { EnvironmentsPage } from './pages/EnvironmentsPage.jsx';
import { TestSuitesPage } from './pages/TestSuitesPage.jsx';
import { TestCasesListPage } from './pages/TestCasesListPage.jsx';
import { TestCaseBuilderPage } from './pages/TestCaseBuilderPage.jsx';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage.jsx';
import { ProjectRunsPage } from './pages/ProjectRunsPage.jsx';
import { RunDetailsPage } from './pages/RunDetailsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30s
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Main App Navigation Shell */}
          <Route element={<AppLayout showSidebar={true} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsListPage />} />
          </Route>

          {/* Dedicated Project Workspace Shell with Project-Specific Sidebar */}
          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<ProjectOverviewPage />} />
            <Route path="environments" element={<EnvironmentsPage />} />
            <Route path="suites" element={<TestSuitesPage />} />
            <Route path="tests" element={<TestCasesListPage />} />
            <Route path="tests/new" element={<TestCaseBuilderPage />} />
            <Route path="tests/:testId/edit" element={<TestCaseBuilderPage />} />
            <Route path="runs" element={<ProjectRunsPage />} />
            <Route path="runs/:runId" element={<RunDetailsPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>

          {/* Full-width standalone pages */}
          <Route element={<AppLayout showSidebar={false} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects/new" element={<CreateProjectPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
