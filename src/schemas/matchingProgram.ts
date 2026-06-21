import { z } from 'zod';
import { MATCHING_PROGRAM_SECTIONS } from '@/lib/matchingProgramSections';
import { MATCHING_PROGRAM_STATUS_VALUES } from '@/lib/labels';

/**
 * 매칭 프로그램 등록/수정 검증 (21_matching_programs.md 21.2, 17_conventions.md 3장).
 * 등록·수정 공용. 매칭 신청/연계는 상세의 매핑 패널에서 다룬다.
 */
export const matchingProgramSchema = z.object({
  name: z.string().min(1, '프로그램명을 입력해 주세요.').max(150),
  agency: z.string().min(1, '주관 기관을 입력해 주세요.').max(100),
  year: z
    .number({ invalid_type_error: '숫자로 입력해 주세요.' })
    .int('정수로 입력해 주세요.')
    .min(2000, '연도를 확인해 주세요.')
    .max(2100, '연도를 확인해 주세요.'),
  budget: z.number({ invalid_type_error: '숫자로 입력해 주세요.' }).min(0, '0 이상이어야 합니다.'),
  status: z.enum(MATCHING_PROGRAM_STATUS_VALUES),
  description: z.string().max(2000, '설명은 2000자 이내로 입력해 주세요.'),
  sections: MATCHING_PROGRAM_SECTIONS.schema,
});

export type MatchingProgramInput = z.infer<typeof matchingProgramSchema>;
