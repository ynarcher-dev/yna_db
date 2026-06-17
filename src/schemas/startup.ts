import { z } from 'zod';
import { INVESTMENT_STAGE_VALUES, MANAGEMENT_STATUS_VALUES } from '@/lib/labels';
import { STARTUP_SECTIONS } from '@/lib/startupSections';

/** 주주 1인 (startups.shareholders 항목). */
export const shareholderSchema = z.object({
  name: z.string().min(1, '주주명을 입력해 주세요.').max(50),
  shares: z.number({ invalid_type_error: '숫자로 입력해 주세요.' }).min(0, '0 이상이어야 합니다.'),
  percentage: z
    .number({ invalid_type_error: '숫자로 입력해 주세요.' })
    .min(0, '0 이상이어야 합니다.')
    .max(100, '100 이하여야 합니다.'),
});

/**
 * 스타트업 등록/수정 검증 스키마 (6_startups.md 6.2, 17_conventions.md 3장).
 * 등록·수정 폼에서 동일 스키마를 재사용한다. 주주 구성(shareholders)·시계열 지표·
 * 후속 보고는 Phase 4 후속 단계에서 별도 에디터로 추가한다(여기선 기본 프로필만).
 */
export const startupSchema = z
  .object({
    name: z.string().min(1, '기업명을 입력해 주세요.').max(100),
    ceoName: z.string().min(1, '대표자명을 입력해 주세요.').max(50),
    investmentStage: z.enum(INVESTMENT_STAGE_VALUES, {
      errorMap: () => ({ message: '투자 단계를 선택해 주세요.' }),
    }),
    managementStatus: z.enum(MANAGEMENT_STATUS_VALUES, {
      errorMap: () => ({ message: '관리 현황을 선택해 주세요.' }),
    }),
    /** '기타' 선택 시에만 사용. 그 외 상태에선 무시(저장 시 비움). */
    managementStatusEtc: z.string().max(50, '50자 이내로 입력해 주세요.'),
    brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '#RRGGBB 형식의 색상이어야 합니다.'),
    logoUrl: z.string().url('올바른 URL 형식이 아닙니다.').or(z.literal('')),
    description: z.string().max(2000, '기업 설명은 2000자 이내로 입력해 주세요.'),
    sections: STARTUP_SECTIONS.schema,
  })
  .superRefine((val, ctx) => {
    // 관리 현황이 '기타'면 내용 필수
    if (val.managementStatus === 'other' && !val.managementStatusEtc.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['managementStatusEtc'],
        message: '기타 내용을 입력해 주세요.',
      });
    }
  });

export type StartupInput = z.infer<typeof startupSchema>;

/** 주주 구성 편집(주주 카드 전용 드로어). 주주는 기본 정보와 분리해 관리한다. */
export const shareholdersFormSchema = z.object({
  shareholders: z
    .array(shareholderSchema)
    .max(30, '주주는 최대 30명까지 등록할 수 있습니다.')
    .superRefine((rows, ctx) => {
      // 지분율 합계는 100%를 초과할 수 없다.
      const total = rows.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0);
      if (total > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `지분율 합계가 ${total}%로 100%를 초과했습니다.`,
        });
      }
    }),
});

export type ShareholdersFormInput = z.infer<typeof shareholdersFormSchema>;

/** 시계열 메모/회의록 1건. */
export const startupMemoSchema = z.object({
  date: z.string().min(1, '일자를 선택해 주세요.'),
  content: z.string().min(1, '내용을 입력해 주세요.').max(2000, '2000자 이내로 입력해 주세요.'),
});

/** 메모 편집(메모 카드 전용 드로어). */
export const memosFormSchema = z.object({
  memos: z.array(startupMemoSchema).max(200, '메모는 최대 200건까지 등록할 수 있습니다.'),
});

export type MemosFormInput = z.infer<typeof memosFormSchema>;

/** 비즈니스 현황 편집(성장 지표 영역, 시계열 텍스트). */
export const businessStatusFormSchema = z.object({
  businessStatus: z
    .array(startupMemoSchema)
    .max(200, '비즈니스 현황은 최대 200건까지 등록할 수 있습니다.'),
});

export type BusinessStatusFormInput = z.infer<typeof businessStatusFormSchema>;

/** 기업진단 편집(임시 수동 입력). */
export const diagnosisFormSchema = z.object({
  diagnosis: z.string().max(5000, '5000자 이내로 입력해 주세요.'),
});

export type DiagnosisFormInput = z.infer<typeof diagnosisFormSchema>;
