import type { Biography } from '@/types/biography';

/**
 * 약력 표시 카드 (심사역·전문가 상세 공용). 표시는 세로형:
 * 학력 → 경력 → 자격증 → 수상 순으로 위에서 아래로, 각 항목을 한 줄로 나열한다. (입력은 BiographyEditor)
 * 입력값이 없는 섹션은 노출하지 않으며, 전 항목이 비어 있으면 카드 자체를 렌더링하지 않는다.
 */
export function BiographyView({ biography }: { biography: Biography }) {
  const { education, career, certifications, awards } = biography;
  const hasAny =
    education.length > 0 || career.length > 0 || certifications.length > 0 || awards.length > 0;

  if (!hasAny) return null;

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-yna-main">약력</h2>
      <div className="space-y-6">
        {education.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-medium text-yna-sub">학력</h3>
            <ul className="space-y-1">
              {education.map((e, i) => (
                <li key={i} className="text-sm text-yna-main">
                  {e.school}
                  {e.major ? ` ${e.major}` : ''}
                  {e.degree ? ` (${e.degree})` : ''}
                  {e.period ? <span className="ml-2 text-xs text-gray-500">{e.period}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {career.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-medium text-yna-sub">경력</h3>
            <ul className="space-y-1">
              {career.map((c, i) => (
                <li key={i} className="text-sm text-yna-main">
                  {c.company}
                  {c.position ? ` ${c.position}` : ''}
                  {c.period ? <span className="ml-2 text-xs text-gray-500">{c.period}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {certifications.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-medium text-yna-sub">자격증</h3>
            <ul className="space-y-1">
              {certifications.map((c, i) => (
                <li key={i} className="text-sm text-yna-main">
                  {c.name}
                  {c.issuer ? ` · ${c.issuer}` : ''}
                  {c.period ? <span className="ml-2 text-xs text-gray-500">{c.period}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {awards.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-medium text-yna-sub">수상</h3>
            <ul className="space-y-1">
              {awards.map((a, i) => (
                <li key={i} className="text-sm text-yna-main">
                  {a.name}
                  {a.issuer ? ` · ${a.issuer}` : ''}
                  {a.period ? <span className="ml-2 text-xs text-gray-500">{a.period}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
