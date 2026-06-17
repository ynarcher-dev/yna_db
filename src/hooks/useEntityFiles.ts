import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { REPORTS_BUCKET } from '@/lib/fileDownload';
import {
  mapEntityFileRow,
  type AttachmentEntityType,
  type EntityFile,
  type EntityFileRow,
} from '@/types/uploadedFile';

/**
 * 전 도메인 공통 '첨부파일' 카드 데이터 훅.
 * uploaded_files(purpose='attachment')를 entity_type/entity_id 로 조회/삭제한다.
 * 업로드는 컴포넌트가 lib/fileDownload.uploadEntityFile 로 처리한 뒤 invalidate 한다.
 */
const KEY = 'entity_files';
const COLUMNS = 'id, file_name, s3_key, file_size, content_type, owner_id, created_at';

export function useEntityFiles(entityType: AttachmentEntityType, entityId: string | undefined) {
  return useQuery({
    queryKey: [KEY, entityType, entityId],
    enabled: Boolean(entityId),
    queryFn: async (): Promise<EntityFile[]> => {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select(COLUMNS)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId as string)
        .eq('purpose', 'attachment')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as EntityFileRow[]).map(mapEntityFileRow);
    },
  });
}

export function useEntityFileMutations(
  entityType: AttachmentEntityType,
  entityId: string | undefined,
) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [KEY, entityType, entityId] });

  // 메타 행 삭제(RLS: 직원만, purpose='attachment' 한정) + Storage 객체 정리(베스트에포트).
  const remove = useMutation({
    mutationFn: async (file: EntityFile) => {
      const { error } = await supabase.from('uploaded_files').delete().eq('id', file.fileId);
      if (error) throw error;
      await supabase.storage.from(REPORTS_BUCKET).remove([file.path]);
    },
    onSuccess: invalidate,
  });

  return { remove, invalidate };
}
