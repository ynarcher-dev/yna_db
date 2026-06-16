/**
 * 약력(biography) 공통 타입 — 심사역(managers)·전문가(experts) 공유.
 * (5_managers.md / 9_experts.md, 사람-프로필 골격 공유)
 */

/** 학력 1건 */
export interface Education {
  school: string;
  major: string;
  degree: string;
  period: string;
}

/** 경력 1건 */
export interface Career {
  company: string;
  position: string;
  period: string;
}

/** 자격증 1건 */
export interface Certification {
  name: string;
  issuer: string;
  period: string;
}

/** 수상 1건 */
export interface Award {
  name: string;
  issuer: string;
  period: string;
}

export interface Biography {
  education: Education[];
  career: Career[];
  certifications: Certification[];
  awards: Award[];
}

export const EMPTY_BIOGRAPHY: Biography = {
  education: [],
  career: [],
  certifications: [],
  awards: [],
};

/** jsonb biography 를 안전한 형태로 정규화 */
export function normalizeBiography(value: unknown): Biography {
  if (!value || typeof value !== 'object') return { ...EMPTY_BIOGRAPHY };
  const v = value as Partial<Biography>;
  return {
    education: Array.isArray(v.education) ? v.education : [],
    career: Array.isArray(v.career) ? v.career : [],
    certifications: Array.isArray(v.certifications) ? v.certifications : [],
    awards: Array.isArray(v.awards) ? v.awards : [],
  };
}
