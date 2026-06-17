import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, InputNumber, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import { programSchema, type ProgramInput } from '@/schemas/program';
import { PROGRAM_SECTIONS, DEFAULT_PROGRAM_SECTIONS } from '@/lib/programSections';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';

/**
 * 프로그램 등록/수정 폼 (7_programs.md 7.3, 17_conventions.md 3장). 등록·수정 공용.
 * 기본 정보(프로그램명·기수·예산·기간·모집마감·설명)만 다룬다. 매핑·일정은 상세에서 관리.
 */
const EMPTY: ProgramInput = {
  name: '',
  generation: 1,
  budget: 0,
  startDate: '',
  endDate: '',
  recruitmentDeadline: '',
  description: '',
  sections: DEFAULT_PROGRAM_SECTIONS,
};

interface ProgramFormProps {
  defaultValues?: ProgramInput;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: ProgramInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function ProgramForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: ProgramFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgramInput>({
    resolver: zodResolver(programSchema),
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
          render={({ field }) => <Input {...field} placeholder="예: 와이앤아처 액셀러레이팅 배치" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">기수 *</label>
          <Controller
            name="generation"
            control={control}
            render={({ field }) => (
              <InputNumber
                className="w-full"
                min={1}
                value={field.value}
                onChange={(v) => field.onChange(typeof v === 'number' ? v : 1)}
                onBlur={field.onBlur}
                addonAfter="기"
              />
            )}
          />
          <FieldError message={errors.generation?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">운영 예산 *</label>
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">시작일 *</label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError message={errors.startDate?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">종료일 *</label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError message={errors.endDate?.message} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">모집 마감일</label>
        <Controller
          name="recruitmentDeadline"
          control={control}
          render={({ field }) => (
            <DatePicker
              className="w-full"
              placeholder="모집 마감일 (시작일 이전)"
              value={field.value ? dayjs(field.value) : null}
              onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
              onBlur={field.onBlur}
            />
          )}
        />
        <FieldError message={errors.recruitmentDeadline?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">설명</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} rows={4} placeholder="프로그램 공고 소개 및 상세 설명" />
          )}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <Controller
        name="sections"
        control={control}
        render={({ field }) => (
          <SectionVisibilityField
            config={PROGRAM_SECTIONS}
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
