import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/common/AppShell';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RequireRole } from '@/components/auth/RequireRole';
import { PlaceholderPage } from '@/views/PlaceholderPage';
import { DashboardView } from '@/views/DashboardView';
import { PartnersListView } from '@/views/partners/PartnersListView';
import { PartnerDetailView } from '@/views/partners/PartnerDetailView';
import { ExpertsListView } from '@/views/experts/ExpertsListView';
import { ExpertDetailView } from '@/views/experts/ExpertDetailView';
import { TeamsListView } from '@/views/teams/TeamsListView';
import { TeamDetailView } from '@/views/teams/TeamDetailView';
import { ManagersListView } from '@/views/managers/ManagersListView';
import { ManagerDetailView } from '@/views/managers/ManagerDetailView';
import { StartupsListView } from '@/views/startups/StartupsListView';
import { StartupDetailView } from '@/views/startups/StartupDetailView';
import { ProjectsListView } from '@/views/projects/ProjectsListView';
import { ProjectDetailView } from '@/views/projects/ProjectDetailView';
import { FundsListView } from '@/views/funds/FundsListView';
import { FundDetailView } from '@/views/funds/FundDetailView';
import { ProgramsListView } from '@/views/programs/ProgramsListView';
import { ProgramDetailView } from '@/views/programs/ProgramDetailView';
import { NotFound } from '@/views/NotFound';
import { LoginView } from '@/views/auth/LoginView';
import { OnboardingPasswordView } from '@/views/auth/OnboardingPasswordView';
import { ResetPasswordView } from '@/views/auth/ResetPasswordView';
import { AdminAccountsView } from '@/views/admin/AdminAccountsView';
import { NAV_ITEMS } from '@/lib/navigation';

/**
 * 라우트 정의 (17_conventions.md 1장 IA).
 * - 미인증/온보딩 라우트는 셸 없이 단독 렌더.
 * - 인증 라우트는 <RequireAuth> → AppShell(사이드바+헤더) 안에 중첩.
 * - Admin 전용(/admin/*)은 <RequireRole role="admin"> 으로 감싸 403 처리.
 * 각 도메인 목록/상세 화면은 4~12 문서에서 PlaceholderPage 를 대체한다.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 공개 라우트 (셸 없음) */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/reset-password" element={<ResetPasswordView />} />
      <Route path="/onboarding/password" element={<OnboardingPasswordView />} />

      {/* 인증 필요 라우트 */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          {/* 구현 완료된 도메인은 실제 화면 */}
          <Route path="/" element={<DashboardView />} />
          <Route path="/partners" element={<PartnersListView />} />
          <Route path="/partners/:id" element={<PartnerDetailView />} />
          <Route path="/experts" element={<ExpertsListView />} />
          <Route path="/experts/:id" element={<ExpertDetailView />} />
          {/* 소속 관리 = 팀(단위) 목록·상세. 경로(/departments)는 유지하되 화면은 팀. */}
          <Route path="/departments" element={<TeamsListView />} />
          <Route path="/departments/:id" element={<TeamDetailView />} />
          <Route path="/managers" element={<ManagersListView />} />
          <Route path="/managers/:id" element={<ManagerDetailView />} />
          <Route path="/startups" element={<StartupsListView />} />
          <Route path="/startups/:id" element={<StartupDetailView />} />
          <Route path="/projects" element={<ProjectsListView />} />
          <Route path="/projects/:id" element={<ProjectDetailView />} />
          <Route path="/funds" element={<FundsListView />} />
          <Route path="/funds/:id" element={<FundDetailView />} />
          <Route path="/programs" element={<ProgramsListView />} />
          <Route path="/programs/:id" element={<ProgramDetailView />} />

          {/* 나머지 도메인은 아직 플레이스홀더 (Phase 3·4 에서 대체) */}
          {NAV_ITEMS.filter(
            (item) =>
              ![
                '/',
                '/partners',
                '/experts',
                '/departments',
                '/managers',
                '/startups',
                '/projects',
                '/funds',
                '/programs',
              ].includes(item.path),
          ).map(
            (item) => (
              <Route
                key={item.key}
                path={item.path}
                element={<PlaceholderPage title={item.label} />}
              />
            ),
          )}

          {/* Admin 전용 */}
          <Route element={<RequireRole role="admin" />}>
            <Route path="/admin/accounts" element={<AdminAccountsView />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
