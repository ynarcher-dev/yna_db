import { Switch } from 'antd';
import type { SectionConfig, SectionVisibility } from '@/lib/sectionVisibility';

/**
 * 상세 화면 카드 섹션 표시/숨김 토글 — 전 도메인 공통 폼 필드(표현 전용).
 * react-hook-form 의 단일 `Controller name="sections"` 안에서 value/onChange 로 합성한다.
 * 도메인은 섹션 설정(config)만 넘기면 되고, 검증/저장/정규화는 lib/sectionVisibility 가 담당한다.
 */
export function SectionVisibilityField<K extends string>({
  config,
  value,
  onChange,
}: {
  config: SectionConfig<K>;
  value: SectionVisibility<K>;
  onChange: (next: SectionVisibility<K>) => void;
}) {
  return (
    <div className="border-t border-yna-border pt-4">
      <label className="mb-1 block text-sm text-yna-main">상세 화면 카드 섹션</label>
      <p className="mb-2 text-xs text-yna-sub">비활성화한 섹션은 상세 화면에서 숨겨집니다.</p>
      <div className="space-y-2">
        {config.keys.map((key) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-yna-main">{config.labels[key]}</span>
            <Switch
              size="small"
              checked={value[key]}
              onChange={(checked) => onChange({ ...value, [key]: checked })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
