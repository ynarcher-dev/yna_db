import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Drawer, Upload, Button } from 'antd';
import { HiOutlineUpload, HiOutlineDocument, HiOutlineTrash } from 'react-icons/hi';
import { InvestArchiveForm } from './InvestArchiveForm';
import { useInvestArchiveMutations } from '@/hooks/useInvestArchives';
import { useAppToast } from '@/components/common/useAppToast';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { uploadEntityFile } from '@/lib/fileDownload';
import type { InvestArchiveInput } from '@/schemas/investArchive';
import type { InvestArchive } from '@/types/investArchive';

/**
 * 투자 자료실 글쓰기/수정 Drawer (목록·상세 공용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리한다.
 * 첨부파일은 이 Drawer 안에서 직접 다중 드래그앤드롭으로 올린다(발주자 요청).
 *  - 수정: 이미 id 가 있으므로 공통 EntityFilesBlock(즉시 업로드/삭제/다운로드)을 끼운다.
 *  - 등록: id 가 없어 파일을 잠시 스테이징했다가 글 생성 직후 일괄 업로드한다.
 */
interface InvestArchiveFormDrawerProps {
  open: boolean;
  archive?: InvestArchive;
  onClose: () => void;
  onSaved?: (archiveId: string) => void;
}

function toInput(a: InvestArchive): InvestArchiveInput {
  return {
    title: a.title,
    isPinned: a.isPinned,
    content: a.content,
    sections: a.sections,
  };
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / Math.pow(1024, i);
  return `${i === 0 ? v : v.toFixed(1)} ${units[i]}`;
}

/** 등록 모드 — 글 생성 전까지 파일을 모아두는 스테이징 드롭존. */
function StagedFilesField({
  files,
  onAdd,
  onRemove,
}: {
  files: File[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-yna-main">첨부파일</label>
      <Upload.Dragger
        multiple
        showUploadList={false}
        beforeUpload={(file) => {
          onAdd(file);
          return false; // 직접 업로드(글 생성 후)
        }}
      >
        <p className="flex items-center justify-center gap-2 text-sm text-yna-sub">
          <HiOutlineUpload /> 파일을 끌어다 놓거나 클릭하여 첨부 (용량 제한 없음, 복수 가능)
        </p>
      </Upload.Dragger>
      {files.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-md border border-yna-border px-2 py-1"
            >
              <HiOutlineDocument className="shrink-0 text-yna-sub" />
              <span className="flex-1 truncate text-sm text-yna-main">{f.name}</span>
              <span className="shrink-0 text-xs text-yna-sub">{formatBytes(f.size)}</span>
              <Button
                size="small"
                type="text"
                danger
                aria-label="첨부 제거"
                icon={<HiOutlineTrash />}
                onClick={() => onRemove(i)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function InvestArchiveFormDrawer({
  open,
  archive,
  onClose,
  onSaved,
}: InvestArchiveFormDrawerProps) {
  const isEdit = Boolean(archive);
  const { create, update } = useInvestArchiveMutations();
  const qc = useQueryClient();
  const toast = useAppToast();

  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const submitting = create.isPending || update.isPending || uploading;

  // Drawer 가 닫히면 스테이징 파일을 비운다(다음 등록과 섞이지 않도록).
  useEffect(() => {
    if (!open) setStagedFiles([]);
  }, [open]);

  const handleSubmit = (values: InvestArchiveInput) => {
    if (isEdit && archive) {
      // 수정: 첨부는 EntityFilesBlock 에서 즉시 처리되므로 본문만 저장한다.
      update.mutate(
        { id: archive.id, input: values },
        {
          onSuccess: () => {
            toast.success('게시글이 수정되었습니다.');
            onSaved?.(archive.id);
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
      return;
    }

    create.mutate(values, {
      onSuccess: async (created) => {
        if (stagedFiles.length > 0) {
          setUploading(true);
          try {
            for (const file of stagedFiles) {
              await uploadEntityFile(file, 'invest_archive', created.id);
            }
            void qc.invalidateQueries({ queryKey: ['entity_files', 'invest_archive', created.id] });
          } catch (err) {
            // 글은 생성됐으나 일부 첨부 실패 — 상세에서 다시 올릴 수 있도록 안내.
            toast.error('일부 첨부파일 업로드에 실패했습니다. 상세에서 다시 시도해 주세요.', err);
          } finally {
            setUploading(false);
          }
        }
        toast.success('게시글이 등록되었습니다.');
        onSaved?.(created.id);
        onClose();
      },
      onError: (err) => toast.error('등록에 실패했습니다.', err),
    });
  };

  return (
    <Drawer
      title={isEdit ? '자료 수정' : '자료 등록'}
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <InvestArchiveForm
          defaultValues={archive ? toInput(archive) : undefined}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          attachmentSlot={
            isEdit && archive ? (
              <EntityFilesBlock
                entityType="invest_archive"
                entityId={archive.id}
                title="첨부 자료"
              />
            ) : (
              <StagedFilesField
                files={stagedFiles}
                onAdd={(file) => setStagedFiles((prev) => [...prev, file])}
                onRemove={(index) =>
                  setStagedFiles((prev) => prev.filter((_, i) => i !== index))
                }
              />
            )
          }
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
