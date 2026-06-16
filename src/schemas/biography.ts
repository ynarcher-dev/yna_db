import { z } from 'zod';

/**
 * 약력(biography) 공통 검증 스키마 — 심사역(managers)·전문가(experts) 공유.
 * (5_managers.md / 9_experts.md)
 */
export const educationSchema = z.object({
  school: z.string().min(1, '학교명을 입력해 주세요.').max(100),
  major: z.string().max(100),
  degree: z.string().max(50),
  period: z.string().max(50),
});

export const careerSchema = z.object({
  company: z.string().min(1, '회사/기관명을 입력해 주세요.').max(100),
  position: z.string().max(50),
  period: z.string().max(50),
});

export const certificationSchema = z.object({
  name: z.string().min(1, '자격증명을 입력해 주세요.').max(100),
  issuer: z.string().max(100),
  period: z.string().max(50),
});

export const awardSchema = z.object({
  name: z.string().min(1, '수상명을 입력해 주세요.').max(100),
  issuer: z.string().max(100),
  period: z.string().max(50),
});

export const biographySchema = z.object({
  education: z.array(educationSchema),
  career: z.array(careerSchema),
  certifications: z.array(certificationSchema),
  awards: z.array(awardSchema),
});
