import { Tag } from 'antd';

/** 관심 분야 키워드 태그 묶음 (9_experts.md 9.3 — 관심 분야 태그). */
export function SpecialtyTags({ specialties }: { specialties: string[] }) {
  if (specialties.length === 0) return <span className="text-yna-sub">-</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {specialties.map((s) => (
        <Tag key={s} color="blue" className="m-0">
          {s}
        </Tag>
      ))}
    </span>
  );
}
