import { z } from 'zod';
import { EVENT_STATUS_VALUES } from '@/lib/labels';

/**
 * 프로젝트 세부 일정(테스크) 등록/수정 검증 (project_events, 23_gantt_milestone.md).
 * 사업 일정과 동일 — 유형 입력 폐지, 진행은 상태(대기/진행중/완료/지연)로 관리한다.
 */
export const projectEventSchema = z
  .object({
    title: z.string().min(1, '일정 제목을 입력해 주세요.').max(150),
    startDate: z.string().min(1, '시작일을 선택해 주세요.').max(10),
    endDate: z.string().min(1, '종료일을 선택해 주세요.').max(10),
    /** 담당자(선수) id 배열 — 다중 지정 가능(미지정 허용) */
    managerIds: z.array(z.string()),
    status: z.enum(EVENT_STATUS_VALUES, {
      errorMap: () => ({ message: '진행 상태를 선택해 주세요.' }),
    }),
    /** 선행 테스크 id 배열(선후관계 자율 메타) */
    dependencies: z.array(z.string()),
    /** 관련 링크(URL) 배열 — 빈 행은 검증 전에 제거하고, 남은 값만 형식 검증 */
    urls: z.preprocess(
      (v) => (Array.isArray(v) ? v.map((s) => (typeof s === 'string' ? s.trim() : s)).filter(Boolean) : v),
      z.array(z.string().url('올바른 URL 형식이 아닙니다.')),
    ),
    description: z.string().max(1000, '설명은 1000자 이내로 입력해 주세요.'),
  })
  .superRefine((val, ctx) => {
    if (val.endDate && val.startDate && val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '종료일은 시작일 이후여야 합니다.',
      });
    }
  });

export type ProjectEventInput = z.infer<typeof projectEventSchema>;

export function emptyProjectEventInput(startDate = '', endDate = ''): ProjectEventInput {
  return {
    title: '',
    startDate,
    endDate: endDate || startDate,
    managerIds: [],
    status: 'pending',
    dependencies: [],
    urls: [],
    description: '',
  };
}
