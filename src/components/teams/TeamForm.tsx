import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, DatePicker, Select, AutoComplete, Button } from 'antd';
import dayjs from 'dayjs';
import { teamSchema, type TeamInput } from '@/schemas/team';
import { COMPANY_OPTIONS } from '@/lib/labels';
import { useGroupNameOptions } from '@/hooks/useTeams';

/**
 * 팀(소속 관리 단위) 등록/수정 폼. Admin 전용. 등록·수정 공용.
 * 회사 선택 → 그룹(기존 선택 또는 신규 입력, 자동 생성) → 팀명 → 운영 기간(선택).
 */
const EMPTY: TeamInput = {
  company: '와이앤아처',
  groupName: '',
  name: '',
  operatingStart: '',
  operatingEnd: '',
};

interface TeamFormProps {
  defaultValues?: TeamInput;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: TeamInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function TeamForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: TeamFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });

  // 선택한 회사에 속한 기존 그룹명을 콤보박스 후보로 제공한다.
  const company = useWatch({ control, name: 'company' });
  const { data: groupOptions = [] } = useGroupNameOptions(company);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">회사 *</label>
        <Controller
          name="company"
          control={control}
          render={({ field }) => (
            <Select {...field} className="w-full" placeholder="회사 선택" options={COMPANY_OPTIONS} />
          )}
        />
        <FieldError message={errors.company?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">그룹 *</label>
        <Controller
          name="groupName"
          control={control}
          render={({ field }) => (
            <AutoComplete
              value={field.value}
              onChange={(v) => field.onChange(v ?? '')}
              onBlur={field.onBlur}
              className="w-full"
              placeholder="기존 그룹 선택 또는 새 그룹 입력"
              options={groupOptions}
              filterOption={(input, option) =>
                String(option?.value ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              allowClear
            />
          )}
        />
        <FieldError message={errors.groupName?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">팀명</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} placeholder="예: 1팀, 2팀, 3팀 (없으면 비워 두세요)" />
          )}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">운영 시작일</label>
          <Controller
            name="operatingStart"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                placeholder="시작일 선택"
                value={field.value ? dayjs(field.value) : null}
                onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError message={errors.operatingStart?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">운영 종료일</label>
          <Controller
            name="operatingEnd"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                placeholder="비우면 운영중"
                value={field.value ? dayjs(field.value) : null}
                onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError message={errors.operatingEnd?.message} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel}>취소</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
