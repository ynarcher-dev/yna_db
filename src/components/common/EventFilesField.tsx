import { Button, Upload } from 'antd';
import { HiOutlineDocument, HiOutlineTrash, HiOutlineUpload } from 'react-icons/hi';
import { useEventFiles, useEventFileMutations } from '@/hooks/useEntityFiles';
import { useAppToast } from '@/components/common/useAppToast';
import type { AttachmentEntityType, EntityFile } from '@/types/uploadedFile';

/**
 * 테스크(일정) 첨부파일 필드 — 간트 일정 드로어 공용.
 * - 이미 올라간 파일(eventId 있을 때)은 즉시 삭제 가능.
 * - 새로 고른 파일은 staged 로 보관했다가 드로어 저장 시 업로드한다(취소하면 폐기).
 * 업로드된 파일은 entity_type/entity_id 기준이라 상세의 '첨부파일' 카드에도 동일하게 노출되며,
 * event_id 로 어느 테스크 소속인지 식별된다.
 */
export function EventFilesField({
  entityType,
  entityId,
  eventId,
  pendingFiles,
  onPendingChange,
}: {
  entityType: AttachmentEntityType;
  entityId: string;
  eventId?: string;
  pendingFiles: File[];
  onPendingChange: (files: File[]) => void;
}) {
  const toast = useAppToast();
  const { data: existing = [] } = useEventFiles(entityType, entityId, eventId);
  const { remove } = useEventFileMutations(entityType, entityId);

  const handleDeleteExisting = (file: EntityFile) => {
    if (!eventId) return;
    toast.confirm('파일 삭제', `'${file.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync({ file, eventId });
        toast.success('삭제되었습니다.');
      } catch (e) {
        toast.error('삭제에 실패했습니다.', e);
      }
    });
  };

  const removePendingAt = (i: number) => onPendingChange(pendingFiles.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <Upload
        multiple
        showUploadList={false}
        beforeUpload={(file) => {
          onPendingChange([...pendingFiles, file]);
          return false; // 저장 시 일괄 업로드
        }}
      >
        <Button size="small" icon={<HiOutlineUpload />}>
          파일 선택 (복수 가능)
        </Button>
      </Upload>

      {existing.length > 0 || pendingFiles.length > 0 ? (
        <ul className="space-y-1">
          {existing.map((f) => (
            <li
              key={f.fileId}
              className="flex items-center gap-2 rounded-md border border-yna-border px-2 py-1"
            >
              <HiOutlineDocument className="shrink-0 text-yna-sub" />
              <span className="flex-1 truncate text-sm text-yna-main">{f.name}</span>
              <Button
                size="small"
                type="text"
                danger
                aria-label="파일 삭제"
                icon={<HiOutlineTrash />}
                onClick={() => handleDeleteExisting(f)}
              />
            </li>
          ))}
          {pendingFiles.map((f, i) => (
            <li
              key={`pending-${i}`}
              className="flex items-center gap-2 rounded-md border border-dashed border-yna-border px-2 py-1"
            >
              <HiOutlineDocument className="shrink-0 text-yna-sub" />
              <span className="flex-1 truncate text-sm text-yna-main">{f.name}</span>
              <span className="shrink-0 text-xs text-yna-sub">저장 시 업로드</span>
              <Button
                size="small"
                type="text"
                danger
                aria-label="첨부 취소"
                icon={<HiOutlineTrash />}
                onClick={() => removePendingAt(i)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
