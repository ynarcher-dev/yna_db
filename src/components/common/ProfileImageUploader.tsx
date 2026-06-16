import { useState, type ReactNode } from 'react';
import { Upload, Avatar, Button, Space } from 'antd';
import { HiOutlineUser, HiOutlineUpload, HiOutlineTrash } from 'react-icons/hi';
import { supabase } from '@/lib/supabaseClient';
import { useAppToast } from '@/components/common/useAppToast';

/**
 * 이미지 업로더 (심사역·전문가 프로필 / 스타트업 로고 공용).
 * Supabase Storage {bucket} 버킷에 {folder}/{ts}.{ext} 로 업로드 후 공개 URL 을
 * 폼 값으로 반영한다. (정책: 0011/0012=avatars, 0015=logos 마이그레이션)
 * folder: 사람=managerId/expertId(수정) 또는 임시 uuid(신규) / 스타트업=startupId·임시 uuid.
 * bucket/shape/icon 기본값은 사람 프로필용이며, 스타트업 로고는 square·logos 버킷으로 호출한다.
 */
const MAX_MB = 2;

interface ProfileImageUploaderProps {
  value: string;
  folder: string;
  onChange: (url: string) => void;
  /** Storage 버킷 (기본 'avatars'). 스타트업 로고는 'logos'. */
  bucket?: string;
  /** 미리보기 모양 (기본 'circle'). 로고는 'square'. */
  shape?: 'circle' | 'square';
  /** 빈 값일 때 표시할 아이콘 (기본 사람 아이콘). */
  icon?: ReactNode;
  /** 미리보기 배경색 (기본 와이앤아처 포인트). */
  accentColor?: string;
  /** 업로드 버튼 라벨 (기본 '이미지 업로드'). */
  buttonLabel?: string;
}

export function ProfileImageUploader({
  value,
  folder,
  onChange,
  bucket = 'avatars',
  shape = 'circle',
  icon = <HiOutlineUser />,
  accentColor = '#e22213',
  buttonLabel = '이미지 업로드',
}: ProfileImageUploaderProps) {
  const toast = useAppToast();
  const [uploading, setUploading] = useState(false);

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`이미지는 ${MAX_MB}MB 이하만 업로드할 수 있습니다.`);
      return Upload.LIST_IGNORE;
    }
    void handleUpload(file);
    return false; // antd 기본 업로드 비활성화 (직접 Storage 업로드)
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success('이미지가 업로드되었습니다.');
    } catch (err) {
      toast.error('이미지 업로드에 실패했습니다.', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar
        size={72}
        shape={shape}
        src={value || undefined}
        icon={icon}
        style={{ backgroundColor: accentColor }}
      />
      <Space>
        <Upload accept="image/*" showUploadList={false} beforeUpload={beforeUpload}>
          <Button icon={<HiOutlineUpload />} loading={uploading}>
            {buttonLabel}
          </Button>
        </Upload>
        {value ? (
          <Button
            type="text"
            danger
            icon={<HiOutlineTrash />}
            onClick={() => onChange('')}
            aria-label="이미지 제거"
          />
        ) : null}
      </Space>
    </div>
  );
}
