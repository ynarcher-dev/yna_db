import { z } from 'zod';
import { PARTNER_SECTIONS } from '@/lib/partnerSections';

/**
 * 협력사 등록/수정 검증 스키마 (17_conventions.md 3장, 12_partners.md).
 * 등록·수정 폼에서 동일 스키마를 재사용한다.
 */
const phoneSchema = z
  .string()
  .regex(/^[0-9-]{9,13}$/, '숫자와 하이픈만, 9~13자로 입력해 주세요.')
  .or(z.literal(''));

const emailSchema = z.string().email('올바른 이메일 형식이 아닙니다.').or(z.literal(''));

export const interactionLogEntrySchema = z.object({
  date: z.string().min(1, '일자를 선택해 주세요.'),
  content: z.string().min(1, '내용을 입력해 주세요.').max(500),
});

export const partnerSchema = z.object({
  name: z.string().min(1, '기업/기관명을 입력해 주세요.').max(150),
  department: z.string().max(100, '부서명은 100자 이내로 입력해 주세요.'),
  partnerType: z.enum(['government', 'university', 'vc', 'corporation', 'partner'], {
    errorMap: () => ({ message: '협력사 유형을 선택해 주세요.' }),
  }),
  contactPerson: z.string().min(1, '담당자 이름을 입력해 주세요.').max(50),
  phone: phoneSchema,
  email: emailSchema,
  interactionLog: z.array(interactionLogEntrySchema),
  sections: PARTNER_SECTIONS.schema,
});

export type PartnerInput = z.infer<typeof partnerSchema>;
