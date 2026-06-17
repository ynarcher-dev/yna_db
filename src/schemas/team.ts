import { z } from 'zod';
import { COMPANY_VALUES } from '@/lib/labels';

/**
 * 팀(소속 관리 단위) 등록/수정 검증 스키마. Admin 전용.
 * 회사(고정 3종) + 그룹명(기존 선택 또는 신규 입력 → 자동 생성) + 팀명 + 운영 기간(선택).
 * 운영 기간은 둘 다 있으면 종료일이 시작일 이후여야 한다.
 */
export const teamSchema = z
  .object({
    /** 소속 회사 (고정 3종) */
    company: z.enum(COMPANY_VALUES, { required_error: '회사를 선택해 주세요.' }),
    /** 소속 그룹명 (기존 선택 또는 신규 입력) */
    groupName: z.string().min(1, '그룹을 선택하거나 입력해 주세요.').max(100),
    /** 팀명 (예: 1팀). 선택값 — 비우면 회사+그룹 단위 소속 */
    name: z.string().max(100),
    /** 운영 시작일 (선택) */
    operatingStart: z.string().max(10),
    /** 운영 종료일 (선택; 비면 운영중) */
    operatingEnd: z.string().max(10),
  })
  .refine(
    (v) => !v.operatingStart || !v.operatingEnd || v.operatingEnd >= v.operatingStart,
    { message: '운영 종료일은 시작일 이후여야 합니다.', path: ['operatingEnd'] },
  );

export type TeamInput = z.infer<typeof teamSchema>;
