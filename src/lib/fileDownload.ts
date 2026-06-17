import JSZip from 'jszip';
import { supabase } from '@/lib/supabaseClient';
import type { DownloadSourceType, FilePurpose } from '@/types/database';
import type { FollowupFile } from '@/types/startupFollowup';
import type { AttachmentEntityType } from '@/types/uploadedFile';

/**
 * 비공개 버킷 파일 업로드/다운로드 공통 헬퍼 (17_conventions.md 4장, 15_system_schema.md 4·5장).
 * - 업로드: Storage 적재 + uploaded_files 메타 행 생성(다운로드 로그 연계용 fileId 반환).
 * - 다운로드: createSignedUrl 로 단기 GET URL 발급 + log_file_download RPC 로 감사 로그 기록.
 * 다운로드 로그 INSERT 는 RPC(정의자 권한) 전용이므로 클라이언트는 RPC 만 호출한다.
 */
export const REPORTS_BUCKET = 'reports';

/** 서명 URL 기본 만료(초). 다운로드 직후 만료되도록 짧게 둔다. */
const SIGNED_URL_TTL = 60;

/** Storage 경로/파일명에 안전한 문자만 남긴다(ASCII만 허용). */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]/g, '_');
}

/**
 * 비공개 reports 버킷에 업로드하고 uploaded_files 메타 행을 생성한다.
 * 메타 행 생성 실패 시 업로드된 객체를 정리(고아 방지)한 뒤 에러를 던진다.
 */
export async function uploadReportFile(file: File, folder: string): Promise<FollowupFile> {
  const { data: auth } = await supabase.auth.getUser();
  const ownerId = auth.user?.id ?? null;

  const path = `${folder}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: upErr } = await supabase.storage
    .from(REPORTS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (upErr) throw upErr;

  const { data, error: metaErr } = await supabase
    .from('uploaded_files')
    .insert({
      owner_id: ownerId,
      purpose: 'followup_report' satisfies FilePurpose,
      file_name: file.name,
      s3_key: path,
      content_type: file.type || 'application/octet-stream',
      file_size: file.size,
    })
    .select('id')
    .single();
  if (metaErr) {
    await supabase.storage.from(REPORTS_BUCKET).remove([path]);
    throw metaErr;
  }

  return { name: file.name, path, fileId: data.id as string };
}

/** 단기 서명 GET URL 발급 (비공개 버킷). */
export async function getReportSignedUrl(path: string, ttl = SIGNED_URL_TTL): Promise<string> {
  const { data, error } = await supabase.storage.from(REPORTS_BUCKET).createSignedUrl(path, ttl);
  if (error) throw error;
  return data.signedUrl;
}

export interface LogDownloadParams {
  /** uploaded_files.id */
  fileId: string;
  sourceType: DownloadSourceType;
  sourceId: string | null;
  /** 카드 섹션 식별자(예: startup_followups) */
  sectionKey: string;
  /** 선택/입력한 다운로드 목적 원문 */
  purpose: string;
  /** zip/일괄 다운로드 묶음 식별자 */
  batchId?: string | null;
}

/**
 * 다운로드 로그 기록(RPC). 권한 검증 후 file_download_logs 에 INSERT 하고 로그 id 를 반환한다.
 * fileId 가 없는 레거시 파일은 로그를 남길 수 없으므로 호출부에서 분기한다.
 */
export async function logFileDownload(params: LogDownloadParams): Promise<string> {
  const { data, error } = await supabase.rpc('log_file_download', {
    p_file_id: params.fileId,
    p_source_type: params.sourceType,
    p_source_id: params.sourceId,
    p_section_key: params.sectionKey,
    p_purpose: params.purpose,
    p_batch_id: params.batchId ?? null,
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });
  if (error) throw error;
  return data as string;
}

/** URL 을 받아 브라우저 다운로드를 트리거한다(a[download]). */
export function triggerBrowserDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * 전 도메인 공통 '첨부파일' 카드 업로드. 비공개 reports 버킷에 올리고
 * uploaded_files(purpose='attachment', entity_type/entity_id)에 메타 행을 만든다.
 * 용량 제한은 두지 않는다(추후 S3 연동). 메타 INSERT 실패 시 업로드 객체를 정리한다.
 */
export async function uploadEntityFile(
  file: File,
  entityType: AttachmentEntityType,
  entityId: string,
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const ownerId = auth.user?.id ?? null;

  const path = `attachment/${entityType}/${entityId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: upErr } = await supabase.storage
    .from(REPORTS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (upErr) throw upErr;

  const { error: metaErr } = await supabase.from('uploaded_files').insert({
    owner_id: ownerId,
    purpose: 'attachment' satisfies FilePurpose,
    entity_type: entityType,
    entity_id: entityId,
    file_name: file.name,
    s3_key: path,
    content_type: file.type || 'application/octet-stream',
    file_size: file.size,
  });
  if (metaErr) {
    await supabase.storage.from(REPORTS_BUCKET).remove([path]);
    throw metaErr;
  }
}

/** 다운로드 대상 파일의 최소 형태(첨부파일·후속관리 파일 공용). */
export interface DownloadableFile {
  fileId?: string | null;
  name: string;
  path: string;
}

/** 다운로드 로그 컨텍스트(원천 구분·레코드 id·카드 섹션 식별자). */
export interface DownloadLogContext {
  sourceType: DownloadSourceType;
  sourceId: string | null;
  sectionKey: string;
}

/** 단일 파일: 로그 기록 후 서명 URL 로 내려받는다(레거시=fileId 없으면 로그 생략). */
export async function downloadFileWithLog(
  file: DownloadableFile,
  ctx: DownloadLogContext,
  purpose: string,
  batchId?: string,
): Promise<void> {
  if (file.fileId) {
    await logFileDownload({
      fileId: file.fileId,
      sourceType: ctx.sourceType,
      sourceId: ctx.sourceId,
      sectionKey: ctx.sectionKey,
      purpose,
      batchId,
    });
  }
  const url = await getReportSignedUrl(file.path);
  triggerBrowserDownload(url, file.name);
}

/** 일괄 다운로드(zip): 파일별 로그를 같은 batch_id 로 남기고 묶어 내려받는다. */
export async function downloadFilesAsZip(
  files: DownloadableFile[],
  zipName: string,
  ctx: DownloadLogContext,
  purpose: string,
): Promise<void> {
  const batchId = crypto.randomUUID();
  const zip = new JSZip();
  const used = new Map<string, number>();
  for (const file of files) {
    if (file.fileId) {
      await logFileDownload({
        fileId: file.fileId,
        sourceType: ctx.sourceType,
        sourceId: ctx.sourceId,
        sectionKey: ctx.sectionKey,
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
  triggerBrowserDownload(objUrl, `${zipName}.zip`);
  URL.revokeObjectURL(objUrl);
}
