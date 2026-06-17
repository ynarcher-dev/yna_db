import { useState } from 'react';
import { Button, Tag, Progress, Switch } from 'antd';
import { HiOutlineDocumentDownload, HiOutlineDocument } from 'react-icons/hi';
import JSZip from 'jszip';
import { useStartupFollowups, useStartupFollowupMutations } from '@/hooks/useStartupFollowups';
import type { StartupFollowupInput } from '@/schemas/startupFollowup';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { DownloadPurposeModal } from '@/components/common/DownloadPurposeModal';
import { FollowupFormModal } from './FollowupFormModal';
import { SectionHeader } from './SectionHeader';
import { REPORT_TYPE_COLOR, REPORT_TYPE_LABEL } from '@/lib/labels';
import { formatDate } from '@/lib/formatters';
import { getReportSignedUrl, logFileDownload, triggerBrowserDownload } from '@/lib/fileDownload';
import type { StartupFollowup, FollowupFile } from '@/types/startupFollowup';

/**
 * 후속관리 (6_startups.md 6.3 Detail Tab 2).
 * 보고별 첨부파일 제출 현황 — 파일 업로드=제출 대기, 토글 ON=제출 완료.
 * 복수 첨부 + 일괄 다운로드 + 코멘트 + 등록/수정/삭제.
 * 다운로드는 목적 입력 → 서명 URL 발급 + 감사 로그(file_download_logs) 적재 (17_conventions.md 4장).
 * 로그는 DB 에만 기록하고 화면에는 노출하지 않는다. 비공개 'reports' 버킷(0026)이라 공개 URL 직접 링크는 쓰지 않는다.
 */
const SOURCE_TYPE = 'startup_followup';
const SECTION_KEY = 'startup_followups';

// 작성되면 기본 '제출 대기', 토글 ON 시 '제출 완료' (파일 유무와 무관).
function statusOf(f: StartupFollowup): { label: string; color: string } {
  return f.isSubmitted ? { label: '제출 완료', color: 'green' } : { label: '제출 대기', color: 'gold' };
}

/** 다운로드 목적 입력 대기 상태 (단일 파일 또는 묶음). */
type PendingDownload =
  | { mode: 'single'; followup: StartupFollowup; file: FollowupFile }
  | { mode: 'batch'; followup: StartupFollowup };

export function FollowupsBlock({ startupId }: { startupId: string }) {
  const toast = useAppToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StartupFollowup | null>(null);
  const [pending, setPending] = useState<PendingDownload | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { data: followups = [], isLoading } = useStartupFollowups(startupId);
  const { create, update, setSubmitted, remove } = useStartupFollowupMutations(startupId);

  const submittedCount = followups.filter((f) => f.isSubmitted).length;
  const rate = followups.length ? Math.round((submittedCount / followups.length) * 100) : 0;
  const lastUpdated = followups.reduce((acc, f) => (f.updatedAt > acc ? f.updatedAt : acc), '');

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (f: StartupFollowup) => {
    setEditing(f);
    setOpen(true);
  };

  const handleSubmit = (values: StartupFollowupInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(editing ? '수정되었습니다.' : '추가되었습니다.');
        setOpen(false);
      },
      onError: (e: unknown) =>
        toast.error('저장에 실패했습니다. (같은 유형·기간이 이미 있는지 확인하세요)', e),
    };
    if (editing) update.mutate({ id: editing.id, input: values }, opts);
    else create.mutate(values, opts);
  };

  const handleDelete = (f: StartupFollowup) => {
    toast.confirm('후속관리 삭제', `'${f.title}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(f.id);
        toast.success('삭제되었습니다.');
      } catch (e) {
        toast.error('삭제에 실패했습니다.', e);
      }
    });
  };

  // 단일 파일 다운로드: 로그 기록 후 서명 URL 로 내려받는다.
  const downloadSingle = async (file: FollowupFile, purpose: string) => {
    if (file.fileId) {
      await logFileDownload({
        fileId: file.fileId,
        sourceType: SOURCE_TYPE,
        sourceId: startupId,
        sectionKey: SECTION_KEY,
        purpose,
      });
    }
    const url = await getReportSignedUrl(file.path);
    triggerBrowserDownload(url, file.name);
  };

  // 일괄 다운로드(zip): 파일별 로그를 같은 batch_id 로 남기고 묶어 내려받는다.
  const downloadBatch = async (f: StartupFollowup, purpose: string) => {
    const batchId = crypto.randomUUID();
    const zip = new JSZip();
    const used = new Map<string, number>();
    for (const file of f.files) {
      if (file.fileId) {
        await logFileDownload({
          fileId: file.fileId,
          sourceType: SOURCE_TYPE,
          sourceId: startupId,
          sectionKey: SECTION_KEY,
          purpose,
          batchId,
        });
      }
      const url = await getReportSignedUrl(file.path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`다운로드 실패: ${file.name}`);
      // 동일 파일명 충돌 방지
      let name = file.name;
      if (used.has(name)) {
        const n = (used.get(name) ?? 0) + 1;
        used.set(name, n);
        const dot = name.lastIndexOf('.');
        name = dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
      } else {
        used.set(name, 0);
      }
      zip.file(name, await res.blob());
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const objUrl = URL.createObjectURL(content);
    triggerBrowserDownload(objUrl, `${f.title || 'report'}.zip`);
    URL.revokeObjectURL(objUrl);
  };

  // 목적 입력 모달 확정 → 실제 다운로드 수행.
  const handleConfirmDownload = async (purpose: string) => {
    if (!pending) return;
    setDownloading(true);
    try {
      if (pending.mode === 'single') await downloadSingle(pending.file, purpose);
      else await downloadBatch(pending.followup, purpose);
      setPending(null);
    } catch (e) {
      toast.error('다운로드에 실패했습니다.', e);
    } finally {
      setDownloading(false);
    }
  };

  const pendingLabel = !pending
    ? undefined
    : pending.mode === 'single'
      ? pending.file.name
      : `${pending.followup.files.length}개 파일`;

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <SectionHeader
        title="후속관리"
        updatedAt={lastUpdated}
        action={
          <Button size="small" onClick={openAdd}>
            추가
          </Button>
        }
      />

      {isLoading ? null : followups.length === 0 ? (
        <EmptyState message="등록된 후속관리가 없습니다. “추가”로 보고·제출 자료를 등록하세요." />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-yna-sub">제출 완료율</span>
            <Progress percent={rate} className="max-w-xs" />
            <span className="text-sm text-yna-sub">
              {submittedCount}/{followups.length}건
            </span>
          </div>

          {followups.map((f) => {
            const status = statusOf(f);
            return (
              <div key={f.id} className="rounded-md border border-yna-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-yna-main">{f.title}</span>
                  <Tag color={REPORT_TYPE_COLOR[f.reportType]}>
                    {REPORT_TYPE_LABEL[f.reportType] ?? f.reportType}
                  </Tag>
                  <span className="text-xs text-yna-sub">{f.reportingPeriod}</span>
                  <Tag color={status.color}>{status.label}</Tag>
                </div>

                {f.comment ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-yna-main">{f.comment}</p>
                ) : null}

                {f.files.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {f.files.map((file, i) => (
                      <div key={`${file.path}-${i}`} className="flex items-center gap-2 text-sm">
                        <HiOutlineDocument className="shrink-0 text-yna-sub" />
                        <button
                          type="button"
                          className="truncate text-left text-yna-main hover:text-yna-point"
                          onClick={() => setPending({ mode: 'single', followup: f, file })}
                        >
                          {file.name}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-2">
                    <Switch
                      size="small"
                      checked={f.isSubmitted}
                      onChange={(c) => setSubmitted.mutate({ id: f.id, submitted: c })}
                    />
                    <span className="text-xs text-yna-sub">제출 완료</span>
                  </span>
                  <Button
                    size="small"
                    danger
                    icon={<HiOutlineDocumentDownload />}
                    disabled={f.files.length === 0}
                    onClick={() => setPending({ mode: 'batch', followup: f })}
                  >
                    전체 다운로드
                  </Button>
                  <Button size="small" onClick={() => openEdit(f)}>
                    수정
                  </Button>
                  <Button size="small" danger onClick={() => handleDelete(f)}>
                    삭제
                  </Button>
                  {f.isSubmitted && f.submittedAt ? (
                    <span className="text-xs text-yna-sub">제출일 {formatDate(f.submittedAt)}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DownloadPurposeModal
        open={Boolean(pending)}
        fileName={pendingLabel}
        confirming={downloading}
        onConfirm={(purpose) => void handleConfirmDownload(purpose)}
        onCancel={() => setPending(null)}
      />

      <FollowupFormModal
        key={editing?.id ?? 'new'}
        open={open}
        startupId={startupId}
        followup={editing ?? undefined}
        submitting={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
