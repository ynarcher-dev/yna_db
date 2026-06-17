import { z } from 'zod';
import { biographySchema } from './biography';
import { MANAGER_SECTIONS } from '@/lib/managerSections';

/**
 * 심사역 프로필 등록/수정 검증 스키마 (5_managers.md 5.2/5.3, 17_conventions.md 3장).
 * Admin 전체 수정과 본인 수정(SECURITY DEFINER RPC) 모두 동일 스키마를 재사용한다.
 * (본인 수정 시 직급/소속/역할 필드는 폼에 노출하지 않고 RPC 전송에서도 제외)
 */
const phoneSchema = z
  .string()
  .regex(/^[0-9-]{9,13}$/, '숫자와 하이픈만, 9~13자로 입력해 주세요.')
  .or(z.literal(''));

export const managerSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(50),
  position: z.string().min(1, '직급을 입력해 주세요.').max(50),
  /** 소속 본부 id (선택; Admin 만 변경) */
  departmentId: z.string(),
  phone: phoneSchema,
  specialties: z.array(z.string().min(1).max(30)).max(20, '관심 분야는 최대 20개까지 등록할 수 있습니다.'),
  profileImageUrl: z.string().url('올바른 URL 형식이 아닙니다.').or(z.literal('')),
  greeting: z.string().max(1000, '소개는 1000자 이내로 입력해 주세요.'),
  biography: biographySchema,
  /** 상세 카드 섹션 표시/숨김(Admin 전용 — self RPC 는 미전송). */
  sections: MANAGER_SECTIONS.schema,
});

export type ManagerInput = z.infer<typeof managerSchema>;
