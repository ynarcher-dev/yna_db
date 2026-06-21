import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { REPORTS_BUCKET, uploadEntityFile } from '@/lib/fileDownload';
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
const COLUMNS = 'id, file_name, s3_key, file_size, content_type, owner_id, event_id, created_at';

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

/**
 * 특정 테스크(일정)에 종속된 첨부파일 — 간트 일정 드로어 전용.
 * uploaded_files(purpose='attachment', entity_type/entity_id, event_id)로 조회한다.
 * 업로드/삭제 시 상위 '첨부파일' 카드(useEntityFiles) 캐시도 함께 무효화해 동일하게 반영된다.
 */
export function useEventFiles(
  entityType: AttachmentEntityType,
  entityId: string | undefined,
  eventId: string | undefined,
) {
  return useQuery({
    queryKey: [KEY, entityType, entityId, 'event', eventId],
    enabled: Boolean(entityId) && Boolean(eventId),
    queryFn: async (): Promise<EntityFile[]> => {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select(COLUMNS)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId as string)
        .eq('purpose', 'attachment')
        .eq('event_id', eventId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as EntityFileRow[]).map(mapEntityFileRow);
    },
  });
}

export function useEventFileMutations(entityType: AttachmentEntityType, entityId: string) {
  const qc = useQueryClient();
  // 테스크 단위 목록 + 상위 첨부 카드 둘 다 갱신.
  const invalidate = (eventId?: string) => {
    void qc.invalidateQueries({ queryKey: [KEY, entityType, entityId] });
    if (eventId) void qc.invalidateQueries({ queryKey: [KEY, entityType, entityId, 'event', eventId] });
  };

  const upload = useMutation({
    mutationFn: async ({ file, eventId }: { file: File; eventId: string }) => {
      await uploadEntityFile(file, entityType, entityId, eventId);
    },
    onSuccess: (_data, { eventId }) => invalidate(eventId),
  });

  const remove = useMutation({
    mutationFn: async ({ file }: { file: EntityFile; eventId: string }) => {
      const { error } = await supabase.from('uploaded_files').delete().eq('id', file.fileId);
      if (error) throw error;
      await supabase.storage.from(REPORTS_BUCKET).remove([file.path]);
    },
    onSuccess: (_data, { eventId }) => invalidate(eventId),
  });

  return { upload, remove };
}
