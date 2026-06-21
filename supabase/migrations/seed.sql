-- =============================================================================
-- seed.sql — 개발·데모용 최소 시드 (19_bootstrap.md 6장)
-- 외래키 의존 순서: departments → managers → startups → metrics/followups →
--   funds → businesses → experts → projects → partners → 매핑/이력
-- 주의: 운영 DB 에는 투입하지 않는다. 최초 1회 실행 (ON CONFLICT 로 재실행 안전).
--   최초 Admin 계정(콘솔에서 생성한 dev@ynarcher.com)은 이미 managers 에 있으므로
--   여기서는 Manager 2명만 추가한다.
-- =============================================================================

-- 1. 소속 본부 2개
INSERT INTO public.departments (id, name, established_at, description) VALUES
  ('11111111-1111-1111-1111-000000000001', '투자본부', '2020-01-01', '직접 투자 및 포트폴리오 관리'),
  ('11111111-1111-1111-1111-000000000002', '오픈이노베이션본부', '2021-03-01', 'M&A 및 대외 협력 프로젝트')
ON CONFLICT (id) DO NOTHING;

-- 2. 심사역 (Manager 2명; Admin 은 콘솔 부트스트랩 계정 사용)
INSERT INTO public.managers (id, name, position, role, specialties, phone, email, department_id) VALUES
  ('22222222-2222-2222-2222-000000000001', '김투자', '수석심사역', 'manager', ARRAY['ICT','핀테크'], '010-1111-2222', 'manager1@ynarcher.com', '11111111-1111-1111-1111-000000000001'),
  ('22222222-2222-2222-2222-000000000002', '이파트너', '파트너', 'manager', ARRAY['바이오','딥테크'], '010-3333-4444', 'manager2@ynarcher.com', '11111111-1111-1111-1111-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 부서장 임명 (순환참조 FK 보강용 UPDATE)
UPDATE public.departments SET leader_id = '22222222-2222-2222-2222-000000000001'
  WHERE id = '11111111-1111-1111-1111-000000000001';
UPDATE public.departments SET leader_id = '22222222-2222-2222-2222-000000000002'
  WHERE id = '11111111-1111-1111-1111-000000000002';

-- 3. 스타트업 5개
INSERT INTO public.startups (id, name, ceo_name, brand_color, description, investment_stage, manager_id) VALUES
  ('33333333-3333-3333-3333-000000000001', '뉴럴웨이브', '박성호', '#2563eb', 'AI 음성 합성 플랫폼', 'series_a', '22222222-2222-2222-2222-000000000001'),
  ('33333333-3333-3333-3333-000000000002', '그린셀', '정유진', '#16a34a', '차세대 배터리 소재', 'series_b', '22222222-2222-2222-2222-000000000002'),
  ('33333333-3333-3333-3333-000000000003', '페이루프', '최동현', '#e22213', '소상공인 결제 솔루션', 'pre_a', '22222222-2222-2222-2222-000000000001'),
  ('33333333-3333-3333-3333-000000000004', '메디센스', '한지아', '#7c3aed', '웨어러블 헬스케어', 'seed', '22222222-2222-2222-2222-000000000002'),
  ('33333333-3333-3333-3333-000000000005', '로지스나우', '오세훈', '#515151', '라스트마일 물류 최적화', 'series_a', '22222222-2222-2222-2222-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 4. 스타트업 시계열 지표 (각 3 스냅샷: 2025-12, 2026-03, 2026-06)
INSERT INTO public.startup_metrics (startup_id, record_date, valuation, revenue, employee_count) VALUES
  ('33333333-3333-3333-3333-000000000001', '2025-12-01', 12000000000, 1500000000, 24),
  ('33333333-3333-3333-3333-000000000001', '2026-03-01', 15000000000, 1900000000, 31),
  ('33333333-3333-3333-3333-000000000001', '2026-06-01', 18000000000, 2400000000, 38),
  ('33333333-3333-3333-3333-000000000002', '2025-12-01', 22000000000, 3000000000, 40),
  ('33333333-3333-3333-3333-000000000002', '2026-03-01', 25000000000, 3600000000, 47),
  ('33333333-3333-3333-3333-000000000002', '2026-06-01', 30000000000, 4200000000, 55),
  ('33333333-3333-3333-3333-000000000003', '2025-12-01', 4000000000, 500000000, 11),
  ('33333333-3333-3333-3333-000000000003', '2026-03-01', 5000000000, 700000000, 14),
  ('33333333-3333-3333-3333-000000000003', '2026-06-01', 6500000000, 950000000, 18),
  ('33333333-3333-3333-3333-000000000004', '2025-12-01', 2000000000, 120000000, 7),
  ('33333333-3333-3333-3333-000000000004', '2026-03-01', 2800000000, 200000000, 9),
  ('33333333-3333-3333-3333-000000000004', '2026-06-01', 3500000000, 320000000, 12),
  ('33333333-3333-3333-3333-000000000005', '2025-12-01', 9000000000, 1100000000, 20),
  ('33333333-3333-3333-3333-000000000005', '2026-03-01', 11000000000, 1400000000, 26),
  ('33333333-3333-3333-3333-000000000005', '2026-06-01', 13500000000, 1800000000, 33)
ON CONFLICT (startup_id, record_date) DO NOTHING;

-- 5. 후속 보고 (2026-Q2 제출율: 3/4 = 75%)
INSERT INTO public.startup_followups (startup_id, title, report_type, reporting_period, due_date, is_submitted, submitted_at) VALUES
  ('33333333-3333-3333-3333-000000000001', '2026 2분기 정기보고', 'regular_quarterly', '2026-Q2', '2026-07-15', true,  '2026-07-10T09:00:00+09:00'),
  ('33333333-3333-3333-3333-000000000002', '2026 2분기 정기보고', 'regular_quarterly', '2026-Q2', '2026-07-15', true,  '2026-07-12T09:00:00+09:00'),
  ('33333333-3333-3333-3333-000000000003', '2026 2분기 정기보고', 'regular_quarterly', '2026-Q2', '2026-07-15', true,  '2026-07-14T09:00:00+09:00'),
  ('33333333-3333-3333-3333-000000000004', '2026 2분기 정기보고', 'regular_quarterly', '2026-Q2', '2026-07-15', false, NULL)
ON CONFLICT (startup_id, report_type, reporting_period) DO NOTHING;

-- 6. 펀드 1개 + 캐피탈 콜 + 투자 집행 (소진율 40%)
INSERT INTO public.funds (id, name, total_amount, investing_period, balance, lp_composition) VALUES
  ('44444444-4444-4444-4444-000000000001', '와이앤아처 성장 1호 펀드', 30000000000, '2024-2030', 18000000000,
   '[{"name":"모태펀드","ratio":40},{"name":"산업은행","ratio":30},{"name":"민간LP","ratio":30}]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.capital_calls (fund_id, call_round, requested_amount, requested_date, is_completed, completed_date) VALUES
  ('44444444-4444-4444-4444-000000000001', 1, 9000000000, '2024-06-01', true, '2024-06-20'),
  ('44444444-4444-4444-4444-000000000001', 2, 6000000000, '2025-06-01', false, NULL)
ON CONFLICT (fund_id, call_round) DO NOTHING;

INSERT INTO public.fund_investments (fund_id, startup_id, investment_amount, share_percentage, investment_date) VALUES
  ('44444444-4444-4444-4444-000000000001', '33333333-3333-3333-3333-000000000001', 2000000000, 10.00, '2025-02-10'),
  ('44444444-4444-4444-4444-000000000001', '33333333-3333-3333-3333-000000000002', 1500000000, 8.00, '2025-09-05')
ON CONFLICT (fund_id, startup_id) DO NOTHING;

-- 7. 사업 1개 (현재 진행 중) + 운영진/참여사/일정
INSERT INTO public.businesses (id, name, generation, budget, start_date, end_date, recruitment_deadline, description) VALUES
  ('55555555-5555-5555-5555-000000000001', '와이앤아처 액셀러레이팅 5기', 5, 500000000, '2026-04-01', '2026-12-31', '2026-03-15', '초기 스타트업 보육 사업')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.business_managers (business_id, manager_id, role) VALUES
  ('55555555-5555-5555-5555-000000000001', '22222222-2222-2222-2222-000000000001', 'lead'),
  ('55555555-5555-5555-5555-000000000001', '22222222-2222-2222-2222-000000000002', 'operator')
ON CONFLICT (business_id, manager_id) DO NOTHING;

INSERT INTO public.business_startups (business_id, startup_id, status) VALUES
  ('55555555-5555-5555-5555-000000000001', '33333333-3333-3333-3333-000000000003', 'selected'),
  ('55555555-5555-5555-5555-000000000001', '33333333-3333-3333-3333-000000000004', 'selected'),
  ('55555555-5555-5555-5555-000000000001', '33333333-3333-3333-3333-000000000005', 'screening')
ON CONFLICT (business_id, startup_id) DO NOTHING;

-- business_events 는 트리거로 system_events 에 자동 동기화된다 (미래 일정)
INSERT INTO public.business_events (id, business_id, title, event_type, event_date, description) VALUES
  ('99999999-9999-9999-9999-000000000001', '55555555-5555-5555-5555-000000000001', '5기 추가 모집 마감', 'recruitment', '2026-06-20', NULL),
  ('99999999-9999-9999-9999-000000000002', '55555555-5555-5555-5555-000000000001', '5기 데모데이', 'demoday', '2026-07-10', NULL),
  ('99999999-9999-9999-9999-000000000003', '55555555-5555-5555-5555-000000000001', '파트너 네트워킹 나이트', 'networking', '2026-08-15', NULL)
ON CONFLICT (id) DO NOTHING;

-- 수동 일정 (사업 외) — 대시보드 타임라인 보강
INSERT INTO public.system_events (title, event_type, event_date, source_type, source_id, description) VALUES
  ('LP 정기 IR', 'ir', '2026-06-25', 'manual', NULL, '반기 운용 현황 보고')
ON CONFLICT (source_type, source_id) DO NOTHING;

-- 8. 외부 전문가 3명 + 멘토링 이력(별점)
INSERT INTO public.experts (id, name, company, position, phone, email, expert_type, specialties, is_available) VALUES
  ('66666666-6666-6666-6666-000000000001', '강멘토', '테크어드바이저', '대표', '010-5555-0001', 'expert1@example.com', 'mentor', ARRAY['그로스','마케팅'], true),
  ('66666666-6666-6666-6666-000000000002', '윤회계', '윤앤파트너스 회계법인', '회계사', '010-5555-0002', 'expert2@example.com', 'auditor', ARRAY['재무','세무'], true),
  ('66666666-6666-6666-6666-000000000003', '서변호', '리걸테크 법률사무소', '변호사', '010-5555-0003', 'expert3@example.com', 'advisor', ARRAY['법률','IP'], false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.expert_mentorings (expert_id, startup_id, manager_id, mentoring_date, subject, feedback, rating) VALUES
  ('66666666-6666-6666-6666-000000000001', '33333333-3333-3333-3333-000000000001', '22222222-2222-2222-2222-000000000001', '2026-05-10', '그로스 전략 컨설팅', '리텐션 지표 개선 권고', 4.5),
  ('66666666-6666-6666-6666-000000000002', '33333333-3333-3333-3333-000000000002', '22222222-2222-2222-2222-000000000002', '2026-05-18', '재무 실사 대비', '원가 구조 정리 필요', 5.0),
  ('66666666-6666-6666-6666-000000000001', '33333333-3333-3333-3333-000000000003', '22222222-2222-2222-2222-000000000001', '2026-06-02', '마케팅 채널 진단', '퍼포먼스 마케팅 비중 조정', 4.0)
ON CONFLICT DO NOTHING;

-- 9. 프로젝트 2개
INSERT INTO public.projects (id, name, project_type, stage, priority, start_date, manager_id, description) VALUES
  ('77777777-7777-7777-7777-000000000001', '뉴럴웨이브 후속 투자 검토', 'm_and_a', 'review', 'high', '2026-05-01', '22222222-2222-2222-2222-000000000001', 'Series B 라운드 참여 검토'),
  ('77777777-7777-7777-7777-000000000002', '대기업 OI 매칭 - 그린셀', 'open_innovation', 'meeting', 'medium', '2026-05-20', '22222222-2222-2222-2222-000000000002', '소재 분야 오픈이노베이션 매칭')
ON CONFLICT (id) DO NOTHING;

-- 10. 협력사 2개
INSERT INTO public.partners (id, name, partner_type, contact_person, phone, email) VALUES
  ('88888888-8888-8888-8888-000000000001', '중소벤처기업부', 'government', '담당사무관', '044-000-0000', 'gov@example.com'),
  ('88888888-8888-8888-8888-000000000002', '대한산업', 'corporation', '오픈이노베이션팀', '02-000-0000', 'corp@example.com')
ON CONFLICT (id) DO NOTHING;
