import { useState } from 'react';
import { Upload, Button } from 'antd';
import { HiOutlineUpload, HiOutlineTrash, HiOutlineDocument } from 'react-icons/hi';
import { useAppToast } from '@/components/common/useAppToast';
import { uploadReportFile } from '@/lib/fileDownload';
import type { FollowupFile } from '@/types/startupFollowup';

/**
 * 후속관리 첨부파일 업로더 (드래그앤드롭 + 복수 업로드).
 * 비공개 'reports' 버킷에 {folder}/{uuid}-{name} 으로 올리고 uploaded_files 메타 행을 생성한다.
 * 값은 {name, path, fileId} 목록으로 관리한다(공개 URL 미보관 — 다운로드 시 서명 URL 재발급).
 * (정책: 0025/0026 마이그레이션, 17_conventions.md 4장)
 */
const MAX_MB = 20;

export function FollowupFileUploader({
  value,
  folder,
  onChange,
}: {
  value: FollowupFile[];
  folder: string;
  onChange: (files: FollowupFile[]) => void;
}) {
  const toast = useAppToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`파일은 ${MAX_MB}MB 이하만 업로드할 수 있습니다.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadReportFile(file, folder);
      onChange([...value, uploaded]);
    } catch (err) {
      toast.error('파일 업로드에 실패했습니다.', err);
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
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
          <HiOutlineUpload /> 파일을 끌어다 놓거나 클릭하여 업로드 (복수 가능, {MAX_MB}MB 이하)
        </p>
      </Upload.Dragger>

      {value.length > 0 ? (
        <ul className="space-y-1">
          {value.map((f, i) => (
            <li
              key={`${f.path}-${i}`}
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
                onClick={() => removeAt(i)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
