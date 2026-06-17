import { useState } from 'react';
import { Button, Tag } from 'antd';
import { BusinessTeamFormDrawer } from './BusinessTeamFormDrawer';
import { SectionHeader } from './SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import type { Startup } from '@/types/startup';

/**
 * 비즈니스 & 팀 역량 표시 블록 (성장 지표 위, 발주자 요청).
 * 정성 정보를 비즈니스 / 팀 역량 두 영역으로 나눠 보여주고, '수정'으로 편집한다.
 */
/** 카테고리(라벨)는 작고 굵게(기업 브랜드 컬러), 본문은 일반 굵기 — 위계를 명확히. */
function Field({ label, value, color }: { label: string; value: string; color: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold" style={{ color }}>
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-yna-main">{value}</p>
    </div>
  );
}

export function BusinessTeamBlock({ startup, onSaved }: { startup: Startup; onSaved?: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const b = startup.businessProfile;
  const t = startup.teamProfile;

  const isEmpty =
    !b.oneLiner &&
    !b.businessModel &&
    !b.targetMarket &&
    !b.competitiveEdge &&
    !t.founderStrength &&
    t.members.length === 0 &&
    t.capabilities.length === 0;

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <SectionHeader
        title="비즈니스 & 팀 역량"
        updatedAt={startup.businessProfileUpdatedAt}
        action={
          <Button size="small" onClick={() => setEditOpen(true)}>
            수정
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState message="등록된 비즈니스 · 팀 역량 정보가 없습니다. “수정”에서 입력하세요." />
      ) : (
        <div className="space-y-6">
          {/* 비즈니스 */}
          <div className="space-y-3">
            <h3 className="border-b border-yna-border pb-1 text-sm font-semibold text-yna-main">
              비즈니스
            </h3>
            <Field label="한 줄 소개" value={b.oneLiner} color={startup.brandColor} />
            <Field label="비즈니스 모델" value={b.businessModel} color={startup.brandColor} />
            <Field label="타겟 시장 & 고객" value={b.targetMarket} color={startup.brandColor} />
            <Field label="경쟁 우위 / 차별점" value={b.competitiveEdge} color={startup.brandColor} />
          </div>

          {/* 팀 역량 */}
          <div className="space-y-3">
            <h3 className="border-b border-yna-border pb-1 text-sm font-semibold text-yna-main">
              팀 역량
            </h3>
            <Field label="대표 / 창업자 역량" value={t.founderStrength} color={startup.brandColor} />
            {t.members.length > 0 ? (
              <div>
                <p className="mb-0.5 text-xs font-semibold" style={{ color: startup.brandColor }}>
                  핵심 팀원
                </p>
                <ul className="mt-1 space-y-1">
                  {t.members.map((m, i) => (
                    <li key={i} className="text-sm text-yna-main">
                      <span className="font-medium">{m.name}</span>
                      {m.role ? <span className="text-yna-sub"> · {m.role}</span> : null}
                      {m.background ? <span className="text-yna-sub"> — {m.background}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {t.capabilities.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-semibold" style={{ color: startup.brandColor }}>
                  핵심 역량
                </p>
                <div className="flex flex-wrap gap-1">
                  {t.capabilities.map((c) => (
                    <Tag
                      key={c}
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: startup.brandColor,
                        borderColor: startup.brandColor,
                      }}
                    >
                      {c}
                    </Tag>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <BusinessTeamFormDrawer
        open={editOpen}
        startup={startup}
        onClose={() => setEditOpen(false)}
        onSaved={onSaved}
      />
    </div>
  );
}
