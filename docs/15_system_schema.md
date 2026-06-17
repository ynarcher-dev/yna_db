# 💾 15. 시스템·운영 테이블 스키마 (15_system_schema.md)

본 문서는 [0_db_schema.md](0_db_schema.md)의 업무 마스터 테이블을 보완하는 **시스템/운영 테이블**(알림, 감사 로그, AI 대화 세션, 업로드 파일 메타데이터, 파일 다운로드 로그, 문서 임베딩)의 DDL 및 RLS를 정의합니다. 이 테이블들은 [2_policies.md](2_policies.md) 2.3의 "제한 데이터"(소유자 또는 Admin만 접근)와 [3_smart_features.md](3_smart_features.md)의 AI 기능을 구현하기 위해 필요합니다.

---

## 1. 알림 테이블 (notifications)

[0_ui_ux.md](0_ui_ux.md) 1.4의 인앱 배지(미확인 알림 숫자)의 데이터 소스입니다.

```sql
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES public.managers(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(40) NOT NULL, -- followup_due, report_overdue, project_stage_changed, mentoring_added, account_notice 등
    title VARCHAR(150) NOT NULL,
    message TEXT,
    link_url TEXT, -- 클릭 시 이동할 앱 내부 경로 (예: /startups/{id})
    source_type VARCHAR(30), -- startup, project, program, fund, system
    source_id UUID,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (
        (is_read = false AND read_at IS NULL)
        OR (is_read = true AND read_at IS NOT NULL)
    )
);

CREATE INDEX idx_notifications_recipient_unread
ON public.notifications (recipient_id) WHERE is_read = false;
```

* **배지 카운트**: `SELECT count(*) FROM notifications WHERE recipient_id = auth.uid() AND is_read = false`.
* **생성 주체**: 알림 행은 Edge Function 또는 DB Trigger(예: 후속 보고 기한 임박, 프로젝트 단계 변경)에서 생성합니다. 클라이언트는 `is_read` 갱신만 수행합니다.

---

## 2. 감사 로그 테이블 (audit_logs)

[2_policies.md](2_policies.md) 2.4 및 [14_auth.md](14_auth.md)의 역할 변경·계정 발급·하드 딜리트 추적용 불변 로그입니다.

```sql
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES public.managers(id) ON DELETE SET NULL, -- 작업 수행자
    action VARCHAR(50) NOT NULL, -- create_account, change_role, hard_delete, soft_delete 등
    target_table VARCHAR(50) NOT NULL,
    target_id UUID,
    before_value JSONB, -- 변경 전 스냅샷
    after_value JSONB,  -- 변경 후 스냅샷
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_audit_logs_target ON public.audit_logs (target_table, target_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
```

* **불변성**: `UPDATE`/`DELETE` 정책을 만들지 않아 사실상 append-only입니다. 기록은 Edge Function(`service_role`)에서만 INSERT합니다.

---

## 3. AI 대화 세션·메시지 테이블 (ai_chat_sessions, ai_chat_messages)

[3_smart_features.md](3_smart_features.md) 2번 AI Agent의 대화 보존용입니다.

```sql
CREATE TABLE public.ai_chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.managers(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200) DEFAULT '새 대화' NOT NULL,
    context_startup_id UUID REFERENCES public.startups(id) ON DELETE SET NULL, -- 특정 기업 컨텍스트 고정 시
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.ai_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    cited_sources JSONB DEFAULT '[]'::JSONB NOT NULL, -- RAG/DB 인용 출처 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX idx_ai_chat_messages_session ON public.ai_chat_messages (session_id, created_at);
```

---

## 4. 업로드 파일 메타데이터 테이블 (uploaded_files)

S3에 저장된 모든 파일(후속 보고서, AI 분석 원본, 프로필 이미지 등)의 메타데이터·접근 권한 기준입니다.

```sql
CREATE TABLE public.uploaded_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    purpose VARCHAR(30) NOT NULL, -- followup_report, ai_source, profile_image, startup_logo, partner_doc
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE, -- AI 업로드 시 세션 연계
    file_name VARCHAR(255) NOT NULL,
    s3_key TEXT NOT NULL UNIQUE, -- 사용자/세션별 prefix 포함
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE, -- AI 임시파일 보존 만료 (NULL=영구)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (purpose IN ('followup_report', 'ai_source', 'profile_image', 'startup_logo', 'partner_doc')),
    CHECK (file_size >= 0)
);

CREATE INDEX idx_uploaded_files_owner ON public.uploaded_files (owner_id);
CREATE INDEX idx_uploaded_files_expiry ON public.uploaded_files (expires_at) WHERE expires_at IS NOT NULL;
```

* **만료 정리**: `expires_at`이 지난 `ai_source` 파일과 연계 임베딩은 S3 Lifecycle Rule + 서버측 정리 작업이 함께 파기합니다([3_smart_features.md](3_smart_features.md) 2번).

---

## 5. 파일 다운로드 로그 테이블 (file_download_logs)

업로드한 파일을 다운로드할 수 있는 모든 카드 섹션의 공통 감사 로그입니다. 후속관리 보고서, 협력사 문서, 펀드/프로젝트 첨부 등 사용자가 파일을 내려받는 UI는 이 테이블을 통해 **누가, 언제, 어떤 목적으로** 다운로드했는지 카드 안에 표시해야 합니다([17_conventions.md](17_conventions.md) 4장).

```sql
CREATE TABLE public.file_download_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES public.uploaded_files(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    source_type VARCHAR(40) NOT NULL, -- startup_followup, partner_doc, fund_doc, project_doc 등
    source_id UUID, -- 원천 업무 레코드 id
    section_key VARCHAR(80) NOT NULL, -- 화면 카드 섹션 식별자(예: startup_followups)
    download_purpose TEXT NOT NULL,
    batch_id UUID, -- zip/일괄 다운로드 시 같은 묶음 식별
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (length(trim(download_purpose)) > 0)
);

CREATE INDEX idx_file_download_logs_file
ON public.file_download_logs (file_id, created_at DESC);

CREATE INDEX idx_file_download_logs_source
ON public.file_download_logs (source_type, source_id, created_at DESC);

CREATE INDEX idx_file_download_logs_actor
ON public.file_download_logs (actor_id, created_at DESC);
```

* **기록 주체**: 클라이언트가 직접 INSERT하지 않습니다. 다운로드용 Edge Function이 권한을 검증하고 Presigned GET URL을 발급하는 같은 트랜잭션 흐름에서 로그를 INSERT합니다.
* **노출 정책(현행)**: 다운로드 이력은 **DB 적재 전용**이며 카드 화면에는 표시하지 않습니다([17_conventions.md](17_conventions.md) 4장). 조회는 Supabase/관리자 도구에서 `source_type`·`source_id`·`section_key` 기준으로 수행하며, RLS 상 Admin은 전체, Manager는 본인이 읽을 수 있는 업무 파일의 이력만 조회됩니다(향후 관리자 화면 확장 대비 SELECT 정책은 유지).
* **목적 보존**: `download_purpose`는 사용자가 선택하거나 입력한 업무 목적 원문을 저장합니다. 일괄 다운로드는 파일별 로그를 각각 남기되 같은 `batch_id`를 부여합니다.

---

## 6. 문서 임베딩 테이블 (document_embeddings)

[3_smart_features.md](3_smart_features.md)의 RAG 벡터 스토어입니다. `text-embedding-3-small`(1536차원)을 기준으로 합니다.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.document_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES public.uploaded_files(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.managers(id) ON DELETE CASCADE NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (file_id, chunk_index)
);

-- 코사인 유사도 기반 근사 최근접 탐색 인덱스
CREATE INDEX idx_document_embeddings_vector
ON public.document_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

* **시맨틱 검색 RPC**: 임베딩 검색은 `owner_id = auth.uid()`로 범위를 강제하는 `SECURITY DEFINER` RPC `match_document_chunks(query_embedding, session_id, match_count)`로만 제공합니다. 임베딩 생성과 검색 호출은 Edge Function에서 수행합니다.

---

## 7. Row Level Security (RLS) 정책

```sql
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
```

### 7.1 알림: 수신자 본인만 조회·읽음 처리
```sql
CREATE POLICY notifications_select_own
ON public.notifications FOR SELECT TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY notifications_update_own_read
ON public.notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());
-- INSERT는 서버측(service_role) 또는 Trigger만. 클라이언트 INSERT/DELETE 정책 없음.
```

### 7.2 감사 로그: Admin만 조회, 클라이언트 변경 불가
```sql
CREATE POLICY audit_logs_select_admin
ON public.audit_logs FOR SELECT TO authenticated
USING (public.current_user_role() = 'admin');
-- INSERT/UPDATE/DELETE 클라이언트 정책 없음 (append-only, 서버측 전용).
```

### 7.3 AI 세션·메시지·업로드·임베딩: 소유자 또는 Admin
```sql
-- 세션
CREATE POLICY ai_sessions_rw_own
ON public.ai_chat_sessions FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY ai_sessions_insert_own
ON public.ai_chat_sessions FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY ai_sessions_update_own
ON public.ai_chat_sessions FOR UPDATE TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- 메시지 (세션 소유 여부로 판단)
CREATE POLICY ai_messages_select_own
ON public.ai_chat_messages FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.ai_chat_sessions s
    WHERE s.id = session_id
      AND (s.owner_id = auth.uid() OR public.current_user_role() = 'admin')
));

CREATE POLICY ai_messages_insert_own
ON public.ai_chat_messages FOR INSERT TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_chat_sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
));

-- 업로드 파일
CREATE POLICY uploaded_files_select_own
ON public.uploaded_files FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY uploaded_files_insert_own
ON public.uploaded_files FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

-- 다운로드 로그: 조회 가능 업무 파일 기준으로 표시, 기록은 서버측 전용.
CREATE POLICY file_download_logs_select_visible
ON public.file_download_logs FOR SELECT TO authenticated
USING (
    public.current_user_role() = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.uploaded_files f
        WHERE f.id = file_id
          AND (f.owner_id = auth.uid() OR public.current_user_role() = 'manager')
    )
);
-- INSERT/UPDATE/DELETE 클라이언트 정책 없음. Edge Function(service_role)만 INSERT.

-- 임베딩: 직접 SELECT 금지, RPC만 사용. 소유자 INSERT만 허용.
CREATE POLICY embeddings_insert_own
ON public.document_embeddings FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());
```

> [!IMPORTANT]
> `followup_report`, `startup_logo`, `partner_doc` 등 공용 업무 파일은 위 소유자 한정 정책 대신 [2_policies.md](2_policies.md) RBAC에 맞춘 별도 정책이 필요할 수 있습니다. 운영 마이그레이션에서 `purpose`별로 조회 범위를 재검토합니다. AI 임시 파일(`ai_source`)만 엄격히 소유자 한정으로 유지합니다.
