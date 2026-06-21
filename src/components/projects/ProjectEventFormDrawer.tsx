import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Button, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import {
  projectEventSchema,
  emptyProjectEventInput,
  type ProjectEventInput,
} from '@/schemas/projectEvent';
import { useProjectEventMutations } from '@/hooks/useProjectEvents';
import { useEventFileMutations } from '@/hooks/useEntityFiles';
import { useAppToast } from '@/components/common/useAppToast';
import { UrlListField } from '@/components/common/UrlListField';
import { EventFilesField } from '@/components/common/EventFilesField';
import { EVENT_STATUS_OPTIONS } from '@/lib/labels';
import type { ProjectEvent } from '@/types/projectEvent';

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

/**
 * 프로젝트 일정(테스크) 등록/수정 Drawer (23_gantt_milestone.md). 저장/삭제 시 system_events 동기화.
 * 사업 일정 Drawer 와 동일 구조 — 담당자 후보는 프로젝트에 배정된 담당자 목록에서만 선택하고,
 * 날짜는 프로젝트 진행 기간(rangeStart~rangeEnd)을 벗어나지 않도록 제한한다.
 */
export function ProjectEventFormDrawer({
  open,
  projectId,
  event,
  managerOptions,
  rangeStart,
  rangeEnd,
  onClose,
}: {
  open: boolean;
  projectId: string;
  event?: ProjectEvent;
  managerOptions: { value: string; label: string }[];
  rangeStart?: string;
  rangeEnd?: string;
  onClose: () => void;
}) {
  const isEdit = Boolean(event);
  const { create, update, remove } = useProjectEventMutations(projectId);
  const { upload } = useEventFileMutations('project', projectId);
  const toast = useAppToast();
  // 새로 고른(아직 업로드 전) 파일 — 저장 시 생성/수정된 테스크 id 로 일괄 업로드.
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const submitting = create.isPending || update.isPending || upload.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectEventInput>({
    resolver: zodResolver(projectEventSchema),
    mode: 'onBlur',
    defaultValues: emptyProjectEventInput(),
  });

  const disabledDate = (d: dayjs.Dayjs) => {
    if (rangeStart && d.isBefore(dayjs(rangeStart), 'day')) return true;
    if (rangeEnd && d.isAfter(dayjs(rangeEnd), 'day')) return true;
    return false;
  };

  useEffect(() => {
    if (!open) return;
    setPendingFiles([]);
    reset(
      event
        ? {
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate,
            managerIds: event.managerIds,
            status: event.status,
            dependencies: event.dependencies,
            urls: event.urls,
            description: event.description,
          }
        : emptyProjectEventInput(rangeStart, rangeStart),
    );
  }, [open, event, rangeStart, reset]);

  const onSubmit = async (values: ProjectEventInput) => {
    try {
      const eventId =
        isEdit && event
          ? (await update.mutateAsync({ id: event.id, input: values }), event.id)
          : await create.mutateAsync(values);
      // 스테이징된 파일을 생성/수정된 테스크에 연결해 업로드(첨부파일 카드에도 반영).
      for (const file of pendingFiles) {
        await upload.mutateAsync({ file, eventId });
      }
      toast.success(isEdit ? '일정이 수정되었습니다.' : '일정이 등록되었습니다.');
      onClose();
    } catch (err) {
      toast.error('저장에 실패했습니다.', err);
    }
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
            <label className="mb-1 block text-sm text-yna-main">테스크 제목 *</label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input {...field} placeholder="예: 실사 미팅" />}
            />
            <FieldError message={errors.title?.message} />
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
                    disabledDate={disabledDate}
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
                    disabledDate={disabledDate}
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
            <label className="mb-1 block text-sm text-yna-main">담당자(선수)</label>
            <Controller
              name="managerIds"
              control={control}
              render={({ field }) => (
                <Select
                  mode="multiple"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  className="w-full"
                  placeholder="배정된 담당자 중 선택 (복수 가능)"
                  options={managerOptions}
                  value={field.value}
                  onChange={(v: string[]) => field.onChange(v)}
                  notFoundContent={managerOptions.length ? undefined : '배정된 담당자가 없습니다.'}
                />
              )}
            />
            <FieldError message={errors.managerIds?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">진행 상태 *</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} className="w-full" options={EVENT_STATUS_OPTIONS} />
              )}
            />
            <FieldError message={errors.status?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">설명</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea {...field} rows={3} placeholder="테스크 상세 설명" />
              )}
            />
            <FieldError message={errors.description?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">관련 링크(URL)</label>
            <Controller
              name="urls"
              control={control}
              render={({ field }) => (
                <UrlListField value={field.value} onChange={field.onChange} />
              )}
            />
            <FieldError message={errors.urls?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">파일 첨부</label>
            <EventFilesField
              entityType="project"
              entityId={projectId}
              eventId={event?.id}
              pendingFiles={pendingFiles}
              onPendingChange={setPendingFiles}
            />
            <p className="mt-1 text-xs text-yna-sub">
              첨부한 파일은 아래 ‘첨부파일’ 카드에도 함께 표시됩니다.
            </p>
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
