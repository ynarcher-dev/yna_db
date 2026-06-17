import { z } from 'zod';
import { DEPARTMENT_SECTIONS } from '@/lib/departmentSections';

/**
 * 소속(부서) 등록/수정 검증 스키마 (11_departments.md 11.2, 17_conventions.md 3장).
 * 등록·수정 폼에서 동일 스키마를 재사용한다. 작성/수정은 Admin 전용.
 */
export const departmentSchema = z.object({
  name: z.string().min(1, '본부/부서명을 입력해 주세요.').max(100),
  /** 설립일은 선택값(YYYY-MM-DD 또는 빈 문자열) */
  establishedAt: z.string().max(10),
  description: z.string().max(1000, '설명은 1000자 이내로 입력해 주세요.'),
  sections: DEPARTMENT_SECTIONS.schema,
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
