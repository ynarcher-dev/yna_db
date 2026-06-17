import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, InputNumber, Button } from 'antd';
import { fundSchema, type FundInput } from '@/schemas/fund';
import { FUND_SECTIONS, DEFAULT_FUND_SECTIONS } from '@/lib/fundSections';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';

/**
 * 펀드 등록/수정 폼 (8_funds.md 8.3, 17_conventions.md 3장). Admin 전용.
 * 기본 재무 정보(펀드명·결성 총액·투자 기간·잔액)만 다룬다. LP 구성은 상세의 LP 카드에서 편집한다.
 */
const EMPTY: FundInput = {
  name: '',
  totalAmount: 0,
  investingPeriod: '',
  balance: 0,
  sections: DEFAULT_FUND_SECTIONS,
};

interface FundFormProps {
  defaultValues?: FundInput;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: FundInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

/** 원화 천단위 콤마 포맷터/파서 (InputNumber 용) */
const wonFormatter = (v: number | string | undefined) =>
  `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const wonParser = (v: string | undefined) => {
  const n = Number((v ?? '').replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

export function FundForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: FundFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FundInput>({
    resolver: zodResolver(fundSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">펀드/투자조합명 *</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} placeholder="예: 와이앤아처 신성장 1호 투자조합" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">결성 총액 *</label>
        <Controller
          name="totalAmount"
          control={control}
          render={({ field }) => (
            <InputNumber
              className="w-full"
              min={0}
              value={field.value}
              onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
              onBlur={field.onBlur}
              formatter={wonFormatter}
              parser={wonParser}
              addonAfter="원"
            />
          )}
        />
        <FieldError message={errors.totalAmount?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">미소진 잔액 *</label>
        <Controller
          name="balance"
          control={control}
          render={({ field }) => (
            <InputNumber
              className="w-full"
              min={0}
              value={field.value}
              onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
              onBlur={field.onBlur}
              formatter={wonFormatter}
              parser={wonParser}
              addonAfter="원"
            />
          )}
        />
        <FieldError message={errors.balance?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">투자 대상 기간 *</label>
        <Controller
          name="investingPeriod"
          control={control}
          render={({ field }) => <Input {...field} placeholder="예: 2026-01 ~ 2030-12" />}
        />
        <FieldError message={errors.investingPeriod?.message} />
      </div>

      <Controller
        name="sections"
        control={control}
        render={({ field }) => (
          <SectionVisibilityField
            config={FUND_SECTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel}>취소</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
