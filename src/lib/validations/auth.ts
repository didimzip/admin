import { z } from "zod";

// 비밀번호: 8자 이상, 영문/숫자/특수문자 포함 필수
export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다")
  .regex(/[a-zA-Z]/, "영문자를 포함해야 합니다")
  .regex(/[0-9]/, "숫자를 포함해야 합니다")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "특수문자를 포함해야 합니다");

// 가입 요청 스키마
export const signupSchema = z
  .object({
    email: z.string().email("올바른 이메일 형식이 아닙니다"),
    password: passwordSchema.optional(),
    provider: z.enum(["EMAIL", "GOOGLE", "KAKAO", "NAVER"]),
    snsAccessToken: z.string().optional(),
    nickname: z
      .string()
      .min(2, "닉네임은 2자 이상이어야 합니다")
      .max(20, "닉네임은 20자 이하여야 합니다"),
    realName: z.string().min(2, "실명은 2자 이상이어야 합니다"),
    companyType: z.enum(["스타트업", "투자사", "공공기관", "전문직", "기타"]),
    companyName: z.string().min(1, "회사명을 입력해주세요"),
    position: z.string().min(1, "직책을 입력해주세요"),
    jobCategory: z.string().min(1, "직종을 선택해주세요"),
    marketingConsent: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.provider === "EMAIL") return !!data.password;
      return true;
    },
    { message: "이메일 가입 시 비밀번호는 필수입니다", path: ["password"] }
  )
  .refine(
    (data) => {
      if (data.provider !== "EMAIL") return !!data.snsAccessToken;
      return true;
    },
    {
      message: "SNS 가입 시 액세스 토큰이 필요합니다",
      path: ["snsAccessToken"],
    }
  );

export type SignupInput = z.infer<typeof signupSchema>;
