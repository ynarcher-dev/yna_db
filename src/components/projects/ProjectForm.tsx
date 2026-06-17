import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import { projectSchema, type ProjectInput } from '@/schemas/project';
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STAGE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
} from '@/lib/labels';
import { PROJECT_SECTIONS, DEFAULT_PROJECT_SECTIONS } from '@/lib/projectSections';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';

/**
 * 프로젝트 등록/수정 폼 (10_projects.md 10.3, 17_conventions.md 3장).
 * 등록·수정 공용. 기본 딜 정보(프로젝트명·유형·단계·우선순위·기간·설명)만 다룬다.
 * 담당자(다대다)·매칭 스타트업/협력사는 상세의 매핑 패널에서 별도로 관리한다.
 */
const EMPTY: ProjectInput = {
  name: '',
  projectType: 'm_and_a',
  projectTypeEtc: '',
  stage: 'pending',
  priority: 'medium',
  startDate: '',
  endDate: '',
  description: '',
  sections: DEFAULT_PROJECT_SECTIONS,
};

interface ProjectFormProps {
  defaultValues?: ProjectInput;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: ProjectInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function ProjectForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });
  const isEtcType = watch('projectType') === 'other';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">프로젝트명 *</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} placeholder="예: A사 지분 인수 중개" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">유형 *</label>
          <Controller
            name="projectType"
            control={control}
            render={({ field }) => (
              <Select {...field} className="w-full" options={PROJECT_TYPE_OPTIONS} />
            )}
          />
          <FieldError message={errors.projectType?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">우선순위 *</label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select {...field} className="w-full" options={PROJECT_PRIORITY_OPTIONS} />
            )}
          />
          <FieldError message={errors.priority?.message} />
        </div>
      </div>

      {isEtcType ? (
        <div>
          <label className="mb-1 block text-sm text-yna-main">기타 유형 *</label>
          <Controller
            name="projectTypeEtc"
            control={control}
            render={({ field }) => <Input {...field} placeholder="기타 유형을 입력해 주세요" />}
          />
          <FieldError message={errors.projectTypeEtc?.message} />
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm text-yna-main">진행 상태 *</label>
        <Controller
          name="stage"
          control={control}
          render={({ field }) => (
            <Select {...field} className="w-full" options={PROJECT_STAGE_OPTIONS} />
          )}
        />
        <FieldError message={errors.stage?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">개시일 *</label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                placeholder="개시일 선택"
                value={field.value ? dayjs(field.value) : null}
                onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError message={errors.startDate?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">예상 종료일</label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                placeholder="종료일 선택"
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
        <label className="mb-1 block text-sm text-yna-main">설명</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} rows={4} placeholder="딜 개요 및 상세 설명" />
          )}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <Controller
        name="sections"
        control={control}
        render={({ field }) => (
          <SectionVisibilityField
            config={PROJECT_SECTIONS}
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
