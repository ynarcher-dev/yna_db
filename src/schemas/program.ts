import { z } from 'zod';
import { PROGRAM_SECTIONS } from '@/lib/programSections';

/**
 * 프로그램 등록/수정 검증 (7_programs.md 7.2, 17_conventions.md 3장).
 * 등록·수정 공용. 운영 심사역·참여 스타트업·일정은 상세의 매핑/캘린더에서 다룬다.
 * DB CHECK(start<=end, 모집마감<=시작일)와 동일 규칙을 superRefine 으로 강제한다.
 */
export const programSchema = z
  .object({
    name: z.string().min(1, '프로그램명을 입력해 주세요.').max(150),
    generation: z
      .number({ invalid_type_error: '숫자로 입력해 주세요.' })
      .int('정수로 입력해 주세요.')
      .min(1, '기수는 1 이상이어야 합니다.'),
    budget: z.number({ invalid_type_error: '숫자로 입력해 주세요.' }).min(0, '0 이상이어야 합니다.'),
    startDate: z.string().min(1, '시작일을 선택해 주세요.'),
    endDate: z.string().min(1, '종료일을 선택해 주세요.'),
    /** 모집 마감일은 선택값 */
    recruitmentDeadline: z.string().max(10),
    description: z.string().max(2000, '설명은 2000자 이내로 입력해 주세요.'),
    sections: PROGRAM_SECTIONS.schema,
  })
  .superRefine((val, ctx) => {
    if (val.startDate && val.endDate && val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '종료일은 시작일 이후여야 합니다.',
      });
    }
    if (val.recruitmentDeadline && val.startDate && val.recruitmentDeadline > val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recruitmentDeadline'],
        message: '모집 마감일은 시작일 이전이어야 합니다.',
      });
    }
  });

export type ProgramInput = z.infer<typeof programSchema>;
