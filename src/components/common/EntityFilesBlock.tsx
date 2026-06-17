import { useState } from 'react';
import { Button, Upload } from 'antd';
import {
  HiOutlineUpload,
  HiOutlineDocument,
  HiOutlineTrash,
  HiOutlineDocumentDownload,
} from 'react-icons/hi';
import { useEntityFiles, useEntityFileMutations } from '@/hooks/useEntityFiles';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { DownloadPurposeModal } from '@/components/common/DownloadPurposeModal';
import {
  uploadEntityFile,
  downloadFileWithLog,
  downloadFilesAsZip,
  type DownloadLogContext,
} from '@/lib/fileDownload';
import type { AttachmentEntityType, EntityFile } from '@/types/uploadedFile';

/**
 * 첨부파일 카드 — 전 도메인 상세 공통(발주자 요청). 모든 게시글 상세에 동일하게 들어간다.
 * - 업로드: 비공개 reports 버킷 + uploaded_files(purpose='attachment'). **용량 제한 없음**(추후 S3).
 * - 다운로드: 개별/전체(zip) 모두. 기존 다운로드 인프라(목적 입력 → 서명 URL + 감사 로그) 재사용.
 * - 로그는 DB(file_download_logs)에만 기록하고 화면에는 노출하지 않는다(17_conventions 4장).
 * 작성/수정 권한은 직원(Admin·Manager) 공통(RLS). 섹션 표시/숨김은 각 도메인 sections.attachments 로 제어.
 */
function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / Math.pow(1024, i);
  return `${i === 0 ? v : v.toFixed(1)} ${units[i]}`;
}

type Pending = { mode: 'single'; file: EntityFile } | { mode: 'batch' };

export function EntityFilesBlock({
  entityType,
  entityId,
  title = '첨부파일',
}: {
  entityType: AttachmentEntityType;
  entityId: string;
  title?: string;
}) {
  const toast = useAppToast();
  const { data: files = [], isLoading } = useEntityFiles(entityType, entityId);
  const { remove, invalidate } = useEntityFileMutations(entityType, entityId);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [downloading, setDownloading] = useState(false);

  const ctx: DownloadLogContext = {
    sourceType: 'attachment',
    sourceId: entityId,
    sectionKey: `${entityType}_attachments`,
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadEntityFile(file, entityType, entityId);
      invalidate();
    } catch (err) {
      toast.error('파일 업로드에 실패했습니다.', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (file: EntityFile) => {
    toast.confirm('파일 삭제', `'${file.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(file);
        toast.success('삭제되었습니다.');
      } catch (e) {
        toast.error('삭제에 실패했습니다.', e);
      }
    });
  };

  const handleConfirmDownload = async (purpose: string) => {
    if (!pending) return;
    setDownloading(true);
    try {
      if (pending.mode === 'single') await downloadFileWithLog(pending.file, ctx, purpose);
      else await downloadFilesAsZip(files, `${entityType}-files`, ctx, purpose);
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
      : `${files.length}개 파일`;

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-yna-main">{title}</h2>
        <Button
          size="small"
          danger
          icon={<HiOutlineDocumentDownload />}
          disabled={files.length === 0}
          onClick={() => setPending({ mode: 'batch' })}
        >
          전체 다운로드
        </Button>
      </div>

      <Upload.Dragger
        multiple
        showUploadList={false}
        disabled={uploading}
        beforeUpload={(file) => {
          void handleUpload(file);
          return false; // 직접 Storage 업로드
        }}
      >
        <p className="flex items-center justify-center gap-2 text-sm text-yna-sub">
          <HiOutlineUpload /> 파일을 끌어다 놓거나 클릭하여 업로드 (용량 제한 없음, 복수 가능)
        </p>
      </Upload.Dragger>

      <div className="mt-3">
        {isLoading ? null : files.length === 0 ? (
          <EmptyState message="등록된 파일이 없습니다." />
        ) : (
          <ul className="space-y-1">
            {files.map((f) => (
              <li
                key={f.fileId}
                className="flex items-center gap-2 rounded-md border border-yna-border px-2 py-1"
              >
                <HiOutlineDocument className="shrink-0 text-yna-sub" />
                <button
                  type="button"
                  className="flex-1 truncate text-left text-sm text-yna-main hover:text-yna-point"
                  onClick={() => setPending({ mode: 'single', file: f })}
                >
                  {f.name}
                </button>
                <span className="shrink-0 text-xs text-yna-sub">{formatBytes(f.size)}</span>
                <Button
                  size="small"
                  type="text"
                  danger
                  aria-label="파일 삭제"
                  icon={<HiOutlineTrash />}
                  onClick={() => handleDelete(f)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <DownloadPurposeModal
        open={Boolean(pending)}
        fileName={pendingLabel}
        confirming={downloading}
        onConfirm={(purpose) => void handleConfirmDownload(purpose)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
