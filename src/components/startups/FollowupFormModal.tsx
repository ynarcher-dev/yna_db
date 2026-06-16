import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Select, DatePicker, Switch, Button, Checkbox } from 'antd';
import dayjs from 'dayjs';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { startupFollowupSchema, type StartupFollowupInput } from '@/schemas/startupFollowup';
import { REPORT_TYPE_OPTIONS } from '@/lib/labels';

/**
 * 후속 보고 등록 모달 (6_startups.md Detail Tab 2). 마일스톤 체크리스트 에디터 포함.
 */
const EMPTY: StartupFollowupInput = {
  title: '',
  reportType: 'regular_quarterly',
  reportingPeriod: '',
  dueDate: dayjs().format('YYYY-MM-DD'),
  fileUrl: '',
  isSubmitted: false,
  milestones: [],
};

function err(message?: string) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

interface FollowupFormModalProps {
  open: boolean;
  submitting: boolean;
  onSubmit: (values: StartupFollowupInput) => void;
  onClose: () => void;
}

export function FollowupFormModal({ open, submitting, onSubmit, onClose }: FollowupFormModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StartupFollowupInput>({
    resolver: zodResolver(startupFollowupSchema),
    mode: 'onBlur',
    defaultValues: EMPTY,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'milestones' });

  return (
    <Modal title="후속 보고 추가" open={open} onCancel={onClose} footer={null} destroyOnClose>
      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm text-yna-main">보고 제목 *</label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input {...field} placeholder="예: 2026 2분기 정기보고" />}
            />
            {err(errors.title?.message)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-yna-main">보고 유형 *</label>
              <Controller
                name="reportType"
                control={control}
                render={({ field }) => (
                  <Select {...field} className="w-full" options={REPORT_TYPE_OPTIONS} />
                )}
              />
              {err(errors.reportType?.message)}
            </div>
            <div>
              <label className="mb-1 block text-sm text-yna-main">보고 기간 *</label>
              <Controller
                name="reportingPeriod"
                control={control}
                render={({ field }) => <Input {...field} placeholder="예: 2026-Q2" />}
              />
              {err(errors.reportingPeriod?.message)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-yna-main">제출 기한 *</label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    className="w-full"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                  />
                )}
              />
              {err(errors.dueDate?.message)}
            </div>
            <div>
              <label className="mb-1 block text-sm text-yna-main">제출 완료</label>
              <div>
                <Controller
                  name="isSubmitted"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">제출 파일 URL</label>
            <Controller
              name="fileUrl"
              control={control}
              render={({ field }) => <Input {...field} placeholder="https://..." />}
            />
            {err(errors.fileUrl?.message)}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-yna-main">마일스톤</span>
              <Button
                size="small"
                icon={<HiOutlinePlus />}
                onClick={() => append({ title: '', done: false })}
              >
                추가
              </Button>
            </div>
            {fields.map((f, index) => (
              <div key={f.id} className="flex items-center gap-2">
                <Controller
                  name={`milestones.${index}.done`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                  )}
                />
                <Controller
                  name={`milestones.${index}.title`}
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="마일스톤 내용" />}
                />
                <Button
                  danger
                  type="text"
                  aria-label="마일스톤 삭제"
                  icon={<HiOutlineTrash />}
                  onClick={() => remove(index)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              추가
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
