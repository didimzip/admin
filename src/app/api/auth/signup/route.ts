import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Zod 검증
    const result = signupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "입력값이 올바르지 않습니다",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // 2. 이메일 중복 확인
    // TODO: DB 연결 시 실제 쿼리로 교체
    // const existingUser = await db.user.findUnique({ where: { email: data.email } });
    // if (existingUser) { ... }

    // 3. 비밀번호 해싱 (EMAIL 가입인 경우)
    let hashedPassword: string | null = null;
    if (data.provider === "EMAIL" && data.password) {
      // TODO: bcrypt 설치 후 교체
      // hashedPassword = await bcrypt.hash(data.password, 12);
      hashedPassword = `hashed_${data.password}`;
    }

    // 4. SNS 토큰 검증 (SNS 가입인 경우)
    if (data.provider !== "EMAIL" && data.snsAccessToken) {
      // TODO: 각 SNS provider의 토큰 검증 API 호출
      // - GOOGLE: https://oauth2.googleapis.com/tokeninfo
      // - KAKAO: https://kapi.kakao.com/v1/user/access_token_info
      // - NAVER: https://openapi.naver.com/v1/nid/me
    }

    // 5. User 레코드 생성
    const userId = `usr_${Date.now()}`;
    // TODO: DB 연결 시 교체
    // const user = await db.user.create({
    //   data: {
    //     id: userId,
    //     email: data.email,
    //     password: hashedPassword,
    //     provider: data.provider,
    //     role: "MEMBER",
    //     authStatus: "NONE",
    //   },
    // });

    // 6. Profile 레코드 생성
    // TODO: DB 연결 시 교체
    // const profile = await db.profile.create({
    //   data: {
    //     userId,
    //     nickname: data.nickname,
    //     realName: data.realName,
    //     companyType: data.companyType,
    //     companyName: data.companyName,
    //     position: data.position,
    //     jobCategory: data.jobCategory,
    //     hasBadge: false,
    //     marketingConsent: data.marketingConsent,
    //   },
    // });

    console.log("User created:", {
      userId,
      email: data.email,
      provider: data.provider,
      hashedPassword: hashedPassword ? "[HASHED]" : null,
      nickname: data.nickname,
      companyType: data.companyType,
    });

    return NextResponse.json(
      {
        success: true,
        message: "회원가입이 완료되었습니다",
        userId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
