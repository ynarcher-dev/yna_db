import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, InputNumber, Select, Button } from 'antd';
import { matchingProgramSchema, type MatchingProgramInput } from '@/schemas/matchingProgram';
import {
  MATCHING_PROGRAM_SECTIONS,
  DEFAULT_MATCHING_PROGRAM_SECTIONS,
} from '@/lib/matchingProgramSections';
import { MATCHING_PROGRAM_STATUS_OPTIONS } from '@/lib/labels';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';

/**
 * 매칭 프로그램 등록/수정 폼 (21_matching_programs.md 21.3). 등록·수정 공용.
 * 프로그램명·주관 기관·시행 연도·매칭 예산·상태·요건만 다룬다. 매칭 연계는 상세에서 관리.
 */
const CURRENT_YEAR = 2026;

const EMPTY: MatchingProgramInput = {
  name: '',
  agency: '',
  year: CURRENT_YEAR,
  budget: 0,
  status: 'active',
  description: '',
  sections: DEFAULT_MATCHING_PROGRAM_SECTIONS,
};

interface MatchingProgramFormProps {
  defaultValues?: MatchingProgramInput;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: MatchingProgramInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function MatchingProgramForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: MatchingProgramFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MatchingProgramInput>({
    resolver: zodResolver(matchingProgramSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">프로그램명 *</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} placeholder="예: 2026 TIPS" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">주관 기관 *</label>
        <Controller
          name="agency"
          control={control}
          render={({ field }) => <Input {...field} placeholder="예: 중소벤처기업부" />}
        />
        <FieldError message={errors.agency?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">시행 연도 *</label>
          <Controller
            name="year"
            control={control}
            render={({ field }) => (
              <InputNumber
                className="w-full"
                min={2000}
                max={2100}
                value={field.value}
                onChange={(v) => field.onChange(typeof v === 'number' ? v : CURRENT_YEAR)}
                onBlur={field.onBlur}
                addonAfter="년"
              />
            )}
          />
          <FieldError message={errors.year?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">상태 *</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select {...field} className="w-full" options={MATCHING_PROGRAM_STATUS_OPTIONS} />
            )}
          />
          <FieldError message={errors.status?.message} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">매칭 예산 규모</label>
        <Controller
          name="budget"
          control={control}
          render={({ field }) => (
            <InputNumber
              className="w-full"
              min={0}
              value={field.value}
              onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
              onBlur={field.onBlur}
              formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => Number((v ?? '').replace(/,/g, '')) || 0}
              addonAfter="원"
            />
          )}
        />
        <FieldError message={errors.budget?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">상세 요건 및 소개</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} rows={4} placeholder="지원 요건·대상·일정 등 상세 설명" />
          )}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <Controller
        name="sections"
        control={control}
        render={({ field }) => (
          <SectionVisibilityField
            config={MATCHING_PROGRAM_SECTIONS}
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
