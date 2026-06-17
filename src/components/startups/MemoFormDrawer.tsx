import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Input, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { memosFormSchema, type MemosFormInput } from '@/schemas/startup';
import { useStartupMutations } from '@/hooks/useStartups';
import { useAppToast } from '@/components/common/useAppToast';
import type { Startup } from '@/types/startup';

/**
 * 시계열 메모/회의록 편집 Drawer (메모 카드 전용).
 * 협력사 교류 이력과 동일 패턴(useFieldArray, 일자 + 내용). 통째로 저장(jsonb).
 */
interface Props {
  open: boolean;
  startup: Startup;
  onClose: () => void;
  onSaved?: () => void;
}

export function MemoFormDrawer({ open, startup, onClose, onSaved }: Props) {
  const { updateMemos } = useStartupMutations();
  const toast = useAppToast();
  const { control, handleSubmit } = useForm<MemosFormInput>({
    resolver: zodResolver(memosFormSchema),
    mode: 'onBlur',
    defaultValues: { memos: startup.memos },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'memos' });

  const handleSave = (values: MemosFormInput) => {
    updateMemos.mutate(
      { id: startup.id, input: values },
      {
        onSuccess: () => {
          toast.success('메모가 저장되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (e) => toast.error('저장에 실패했습니다.', e),
      },
    );
  };

  return (
    <Drawer title="메모 · 회의록 수정" width={520} open={open} onClose={onClose} destroyOnClose>
      {open ? (
        <form onSubmit={handleSubmit(handleSave)} className="space-y-3" noValidate>
          <div className="flex items-center justify-between">
            <span className="text-sm text-yna-main">메모 · 회의록</span>
            <Button
              size="small"
              icon={<HiOutlinePlus />}
              onClick={() => append({ date: dayjs().format('YYYY-MM-DD'), content: '' })}
            >
              메모 추가
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="rounded-md bg-yna-bg px-3 py-2 text-xs text-yna-sub">
              등록된 메모가 없습니다. “메모 추가”로 회의록·메모를 일자별로 기록하세요.
            </p>
          ) : null}

          {fields.map((f, index) => (
            <div key={f.id} className="space-y-1 rounded-md border border-yna-border p-2">
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`memos.${index}.date`}
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
                  aria-label="메모 삭제"
                  icon={<HiOutlineTrash />}
                  onClick={() => remove(index)}
                />
              </div>
              <Controller
                control={control}
                name={`memos.${index}.content`}
                render={({ field }) => (
                  <Input.TextArea {...field} rows={3} placeholder="회의록 / 메모 내용" />
                )}
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={updateMemos.isPending}>
              저장
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}
