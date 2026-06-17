import { z } from 'zod';

/**
 * 상세 화면 카드 섹션 표시/숨김 — 전 도메인 공통 인프라.
 * 등록·기본 수정 폼에서 섹션별 활성/비활성을 토글하고, 상세 화면은 활성 섹션만 노출한다.
 * 도메인마다 키·라벨만 다르고 저장/검증/정규화 로직은 동일하므로 한 곳(팩토리)에서 생성한다.
 *
 * 규약(17_conventions.md 7장):
 * - 프로필/식별 카드(이름·로고 등 핵심 정보)는 토글 대상에서 제외한다.
 * - 'Phase 4 연동 예정' 플레이스홀더 Alert 도 토글 대상이 아니다(실데이터 카드만).
 * - DB 는 섹션키→boolean 맵을 jsonb 한 컬럼(sections)으로 통째 보관한다.
 * - 누락 키는 항상 '표시'로 간주(normalize) → 섹션이 추가돼도 기존 행이 깨지지 않는다.
 */

/** 섹션 키 → 표시 여부 맵. */
export type SectionVisibility<K extends string> = Record<K, boolean>;

export interface SectionConfig<K extends string> {
  /** 표시 순서대로의 섹션 키(상세 렌더 순서와 동일). */
  keys: readonly K[];
  /** 섹션 키 → 한국어 라벨(폼 토글·문서 표기). */
  labels: Record<K, string>;
  /** 신규 등록 기본값: 전체 표시. */
  defaults: SectionVisibility<K>;
  /** 부분/누락 가능한 raw jsonb → 안전한 맵(누락 키는 표시로 간주). */
  normalize: (raw: Partial<Record<string, boolean>> | null | undefined) => SectionVisibility<K>;
  /** 폼 검증용 zod 스키마(키별 boolean). 도메인 입력 스키마에 `sections` 로 합성. */
  schema: z.ZodType<SectionVisibility<K>>;
}

/** 도메인 섹션 설정 1개 생성. keys 는 `as const` 배열로 넘겨 키 타입을 좁힌다. */
export function defineSections<K extends string>(
  keys: readonly K[],
  labels: Record<K, string>,
): SectionConfig<K> {
  const defaults = Object.fromEntries(keys.map((k) => [k, true])) as SectionVisibility<K>;

  const normalize = (
    raw: Partial<Record<string, boolean>> | null | undefined,
  ): SectionVisibility<K> => {
    const out = { ...defaults };
    if (raw) {
      for (const k of keys) {
        if (typeof raw[k] === 'boolean') out[k] = raw[k] as boolean;
      }
    }
    return out;
  };

  const shape = Object.fromEntries(keys.map((k) => [k, z.boolean()])) as Record<K, z.ZodBoolean>;
  const schema = z.object(shape) as unknown as z.ZodType<SectionVisibility<K>>;

  return { keys, labels, defaults, normalize, schema };
}
