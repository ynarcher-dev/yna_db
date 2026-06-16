import { useState } from 'react';
import { Button, Tag, Progress, Checkbox } from 'antd';
import dayjs from 'dayjs';
import { HiOutlinePlus, HiOutlineExternalLink } from 'react-icons/hi';
import { useStartupFollowups, useStartupFollowupMutations } from '@/hooks/useStartupFollowups';
import type { StartupFollowupInput } from '@/schemas/startupFollowup';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { FollowupFormModal } from './FollowupFormModal';
import { REPORT_TYPE_COLOR, REPORT_TYPE_LABEL } from '@/lib/labels';
import { formatDate } from '@/lib/formatters';
import type { StartupFollowup } from '@/types/startupFollowup';

/**
 * 후속 보고/마일스톤 트래커 (6_startups.md 6.3 Detail Tab 2).
 * 제출률(제출 완료/전체) + 보고별 제출 현황·기한·파일·마일스톤 체크리스트 + 추가/삭제.
 */
export function FollowupsBlock({ startupId }: { startupId: string }) {
  const toast = useAppToast();
  const [open, setOpen] = useState(false);
  const { data: followups = [], isLoading } = useStartupFollowups(startupId);
  const { create, setSubmitted, setMilestones, remove } = useStartupFollowupMutations(startupId);

  const submittedCount = followups.filter((f) => f.isSubmitted).length;
  const rate = followups.length ? Math.round((submittedCount / followups.length) * 100) : 0;

  const handleSubmit = (values: StartupFollowupInput) => {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('후속 보고가 추가되었습니다.');
        setOpen(false);
      },
      onError: (err) =>
        toast.error('추가에 실패했습니다. (같은 유형·기간이 이미 있는지 확인하세요)', err),
    });
  };

  const toggleMilestone = (f: StartupFollowup, index: number) => {
    const next = f.milestones.map((m, i) => (i === index ? { ...m, done: !m.done } : m));
    setMilestones.mutate({ id: f.id, milestones: next });
  };

  const handleDelete = (f: StartupFollowup) => {
    toast.confirm('후속 보고 삭제', `'${f.title}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(f.id);
        toast.success('삭제되었습니다.');
      } catch (err) {
        toast.error('삭제에 실패했습니다.', err);
      }
    });
  };

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-yna-main">후속 보고 · 마일스톤</h2>
        <Button size="small" icon={<HiOutlinePlus />} onClick={() => setOpen(true)}>
          보고 추가
        </Button>
      </div>

      {isLoading ? null : followups.length === 0 ? (
        <EmptyState message="등록된 후속 보고가 없습니다. “보고 추가”로 정기 보고·제출 기한을 기록하세요." />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-yna-sub">제출률</span>
            <Progress percent={rate} className="max-w-xs" />
            <span className="text-sm text-yna-sub">
              {submittedCount}/{followups.length}건
            </span>
          </div>

          {followups.map((f) => {
            const overdue = !f.isSubmitted && dayjs(f.dueDate).isBefore(dayjs(), 'day');
            return (
              <div key={f.id} className="rounded-md border border-yna-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-yna-main">{f.title}</span>
                  <Tag color={REPORT_TYPE_COLOR[f.reportType]}>{REPORT_TYPE_LABEL[f.reportType]}</Tag>
                  <span className="text-xs text-yna-sub">{f.reportingPeriod}</span>
                  {f.isSubmitted ? (
                    <Tag color="green">제출완료</Tag>
                  ) : (
                    <Tag color={overdue ? 'red' : 'default'}>{overdue ? '기한 초과' : '미제출'}</Tag>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-yna-sub">
                  <span>제출 기한: {formatDate(f.dueDate)}</span>
                  {f.isSubmitted && f.submittedAt ? (
                    <span>제출일: {formatDate(f.submittedAt)}</span>
                  ) : null}
                  {f.fileUrl ? (
                    <a
                      href={f.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-yna-point"
                    >
                      <HiOutlineExternalLink /> 제출 파일
                    </a>
                  ) : null}
                </div>

                {f.milestones.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {f.milestones.map((m, i) => (
                      <li key={i}>
                        <Checkbox checked={m.done} onChange={() => toggleMilestone(f, i)}>
                          <span className={m.done ? 'text-yna-sub line-through' : 'text-yna-main'}>
                            {m.title}
                          </span>
                        </Checkbox>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <Button
                    size="small"
                    onClick={() => setSubmitted.mutate({ id: f.id, submitted: !f.isSubmitted })}
                  >
                    {f.isSubmitted ? '제출 취소' : '제출 처리'}
                  </Button>
                  <Button size="small" danger onClick={() => handleDelete(f)}>
                    삭제
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FollowupFormModal
        open={open}
        submitting={create.isPending}
        onSubmit={handleSubmit}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
