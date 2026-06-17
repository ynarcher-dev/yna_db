import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Input, DatePicker, Button, Timeline } from 'antd';
import dayjs from 'dayjs';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { businessStatusFormSchema, type BusinessStatusFormInput } from '@/schemas/startup';
import { useStartupMutations } from '@/hooks/useStartups';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/formatters';
import type { Startup } from '@/types/startup';

/**
 * 비즈니스 현황 (성장 지표 영역 상단, 재무·매출 위). 메모/회의록과 같은 시계열 텍스트.
 * MetricsBlock 카드 내부의 서브 섹션으로 렌더한다.
 */
function EditDrawer({
  open,
  startup,
  onClose,
  onSaved,
}: {
  open: boolean;
  startup: Startup;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { updateBusinessStatus } = useStartupMutations();
  const toast = useAppToast();
  const { control, handleSubmit } = useForm<BusinessStatusFormInput>({
    resolver: zodResolver(businessStatusFormSchema),
    mode: 'onBlur',
    defaultValues: { businessStatus: startup.businessStatus },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'businessStatus' });

  const handleSave = (values: BusinessStatusFormInput) => {
    updateBusinessStatus.mutate(
      { id: startup.id, input: values },
      {
        onSuccess: () => {
          toast.success('비즈니스 현황이 저장되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (e) => toast.error('저장에 실패했습니다.', e),
      },
    );
  };

  return (
    <Drawer title="비즈니스 현황 수정" width={520} open={open} onClose={onClose} destroyOnClose>
      {open ? (
        <form onSubmit={handleSubmit(handleSave)} className="space-y-3" noValidate>
          <div className="flex items-center justify-between">
            <span className="text-sm text-yna-main">비즈니스 현황 (시계열)</span>
            <Button
              size="small"
              icon={<HiOutlinePlus />}
              onClick={() => append({ date: dayjs().format('YYYY-MM-DD'), content: '' })}
            >
              항목 추가
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="rounded-md bg-yna-bg px-3 py-2 text-xs text-yna-sub">
              등록된 항목이 없습니다. “항목 추가”로 일자별 사업 현황을 기록하세요.
            </p>
          ) : null}

          {fields.map((f, index) => (
            <div key={f.id} className="space-y-1 rounded-md border border-yna-border p-2">
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`businessStatus.${index}.date`}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                      className="w-40 shrink-0"
                      placeholder="일자"
                    />
                  )}
                />
                <Button
                  danger
                  type="text"
                  aria-label="항목 삭제"
                  icon={<HiOutlineTrash />}
                  onClick={() => remove(index)}
                />
              </div>
              <Controller
                control={control}
                name={`businessStatus.${index}.content`}
                render={({ field }) => (
                  <Input.TextArea {...field} rows={3} placeholder="사업 현황 내용" />
                )}
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={updateBusinessStatus.isPending}>
              저장
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}

export function BusinessStatusSection({
  startup,
  onSaved,
}: {
  startup: Startup;
  onSaved?: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const sorted = [...startup.businessStatus].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="mb-4 rounded-md border border-yna-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-yna-main">비즈니스 현황</h3>
        <Button size="small" onClick={() => setEditOpen(true)}>
          수정
        </Button>
      </div>
      {sorted.length === 0 ? (
        <EmptyState message="등록된 비즈니스 현황이 없습니다. “수정”에서 일자별로 기록하세요." />
      ) : (
        <Timeline
          items={sorted.map((m, i) => ({
            key: i,
            children: (
              <div>
                <p className="text-xs text-gray-500">{formatDate(m.date)}</p>
                <p className="whitespace-pre-wrap text-sm text-yna-main">{m.content}</p>
              </div>
            ),
          }))}
        />
      )}

      <EditDrawer open={editOpen} startup={startup} onClose={() => setEditOpen(false)} onSaved={onSaved} />
    </section>
  );
}
