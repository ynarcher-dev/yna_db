import { z } from 'zod';
import { EVENT_TYPE_VALUES } from '@/lib/labels';

/**
 * 사업 세부 일정 등록/수정 검증 (business_events, 7_businesses.md).
 * event_type 은 system_events 동기화 제약과 동일 집합으로 제한된다(0001/0003).
 */
export const businessEventSchema = z.object({
  title: z.string().min(1, '일정 제목을 입력해 주세요.').max(150),
  eventType: z.enum(EVENT_TYPE_VALUES, {
    errorMap: () => ({ message: '일정 유형을 선택해 주세요.' }),
  }),
  eventDate: z.string().min(1, '일정 일자를 선택해 주세요.'),
  description: z.string().max(1000, '설명은 1000자 이내로 입력해 주세요.'),
});

export type BusinessEventInput = z.infer<typeof businessEventSchema>;
