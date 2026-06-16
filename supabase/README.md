# Supabase 마이그레이션

`docs/19_bootstrap.md` 5장의 DB 초기화 순서에 따라 Supabase SQL Editor에서 실행합니다.

| 순서 | 파일 | 출처 문서 | 범위 |
| :--- | :--- | :--- | :--- |
| 1 | `migrations/0001_schema.sql` | 0_db_schema.md 2장 | 마스터 테이블 DDL + 프로젝트 단계 Trigger |
| 2 | `migrations/0002_rls.sql` | 0_db_schema.md 3장 | RLS 활성화 + `current_user_role()` + CRUD 정책(대표 패턴) |

## 0번 범위 안내 (다음 단계에서 추가)

아래는 0번(공통·표준 규격) 범위 밖이라 별도 단계에서 작성합니다.

- **전 테이블 RLS 정책 전수**: `2_policies.md` 2.2 권한 매트릭스 기준 (0002 의 정책은 대표 패턴만 포함)
- **시스템 테이블**: `15_system_schema.md` (알림/감사로그/AI세션/업로드/임베딩)
- **집계 View·RPC + 동기화 Trigger**: `16_aggregations.md`
- **시드 데이터**: `seed.sql` (19_bootstrap.md 6장, 외래키 의존 순서 준수)
- **Edge Functions**: `14_auth.md` / `17_conventions.md`

> 최초 Admin 계정은 자가 가입이 막혀 있어, 1회는 Supabase 콘솔에서 `auth` 사용자 생성 후
> 해당 `managers` 행의 `role` 을 `admin` 으로 직접 지정해야 합니다 (19_bootstrap.md 5장).
