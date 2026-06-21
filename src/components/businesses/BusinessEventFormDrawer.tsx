import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Button, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { businessEventSchema, type BusinessEventInput } from '@/schemas/businessEvent';
import { useBusinessEventMutations } from '@/hooks/useBusinessEvents';
import { useAppToast } from '@/components/common/useAppToast';
import { EVENT_TYPE_OPTIONS } from '@/lib/labels';
import type { BusinessEvent } from '@/types/businessEvent';

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

/**
 * 사업 일정 등록/수정 Drawer. 저장/삭제 시 system_events 동기화 트리거가 함께 동작한다.
 * 신규 등록 시 캘린더에서 클릭한 날짜(defaultDate)를 초기값으로 받을 수 있다.
 */
export function BusinessEventFormDrawer({
  open,
  businessId,
  event,
  defaultDate,
  onClose,
}: {
  open: boolean;
  businessId: string;
  event?: BusinessEvent;
  defaultDate?: string;
  onClose: () => void;
}) {
  const isEdit = Boolean(event);
  const { create, update, remove } = useBusinessEventMutations(businessId);
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessEventInput>({
    resolver: zodResolver(businessEventSchema),
    mode: 'onBlur',
    defaultValues: { title: '', eventType: 'event', eventDate: '', description: '' },
  });

  // 열릴 때 편집 대상/기본 날짜로 폼을 초기화한다.
  useEffect(() => {
    if (!open) return;
    reset(
      event
        ? {
            title: event.title,
            eventType: event.eventType,
            eventDate: event.eventDate,
            description: event.description,
          }
        : { title: '', eventType: 'event', eventDate: defaultDate ?? '', description: '' },
    );
  }, [open, event, defaultDate, reset]);

  const onSubmit = (values: BusinessEventInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(isEdit ? '일정이 수정되었습니다.' : '일정이 등록되었습니다.');
        onClose();
      },
      onError: (err: unknown) => toast.error('저장에 실패했습니다.', err),
    };
    if (isEdit && event) update.mutate({ id: event.id, input: values }, opts);
    else create.mutate(values, opts);
  };

  const handleDelete = () => {
    if (!event) return;
    toast.confirm('일정 삭제', `'${event.title}' 일정을 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(event.id);
        toast.success('삭제되었습니다.');
        onClose();
      } catch (err) {
        toast.error('삭제에 실패했습니다.', err);
      }
    });
  };

  return (
    <Drawer
      title={isEdit ? '일정 수정' : '일정 등록'}
      width={440}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm text-yna-main">일정 제목 *</label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input {...field} placeholder="예: 데모데이" />}
            />
            <FieldError message={errors.title?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">유형 *</label>
            <Controller
              name="eventType"
              control={control}
              render={({ field }) => (
                <Select {...field} className="w-full" options={EVENT_TYPE_OPTIONS} />
              )}
            />
            <FieldError message={errors.eventType?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">일자 *</label>
            <Controller
              name="eventDate"
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
            <FieldError message={errors.eventDate?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">설명</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea {...field} rows={3} placeholder="일정 상세 설명" />
              )}
            />
            <FieldError message={errors.description?.message} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {isEdit ? (
                <Button danger onClick={handleDelete}>
                  삭제
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose}>취소</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? '수정' : '등록'}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}
