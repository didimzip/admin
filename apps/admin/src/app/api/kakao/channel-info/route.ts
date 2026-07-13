import { NextResponse } from "next/server";

/**
 * 카카오톡 채널 프로필에서 친구 수를 조회합니다.
 * 카카오 채널 홈 내부 API (rocket-web)를 활용합니다.
 *
 * 입력: channelUrl (예: "https://pf.kakao.com/_SFxnAX") 또는 encodedId (예: "_SFxnAX")
 * 출력: { name, friendCount, profileImage, verified }
 */

const KAKAO_PROFILE_API = "https://pf.kakao.com/rocket-web/web/v2/profiles/";

function extractEncodedId(input: string): string | null {
  // URL 형태: https://pf.kakao.com/_SFxnAX 또는 pf.kakao.com/_SFxnAX
  const urlMatch = input.match(/pf\.kakao\.com\/(_[A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // encodedId 직접 입력: _SFxnAX
  if (/^_[A-Za-z0-9]+$/.test(input.trim())) return input.trim();

  return null;
}

export async function POST(request: Request) {
  try {
    const { channelInput } = await request.json();

    if (!channelInput || typeof channelInput !== "string") {
      return NextResponse.json(
        { error: "채널 URL 또는 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    const encodedId = extractEncodedId(channelInput);
    if (!encodedId) {
      return NextResponse.json(
        { error: "올바른 카카오톡 채널 URL 또는 ID가 아닙니다. (예: https://pf.kakao.com/_xxxxx)" },
        { status: 400 }
      );
    }

    const res = await fetch(`${KAKAO_PROFILE_API}${encodedId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Referer": `https://pf.kakao.com/${encodedId}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "채널 정보를 가져올 수 없습니다. 채널 URL을 확인해주세요." },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    // cards 배열에서 type: "profile" 카드를 찾아서 profile.friend_count 추출
    const profileCard = data.cards?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (card: any) => card.type === "profile" && card.profile
    );

    if (!profileCard?.profile) {
      return NextResponse.json(
        { error: "채널 프로필 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const profile = profileCard.profile;

    return NextResponse.json({
      encodedId,
      name: profile.name ?? "",
      friendCount: profile.friend_count ?? 0,
      profileImage: profile.profile_image?.medium_url ?? "",
      verified: profile.verify ?? false,
      businessType: profile.business_type ?? "",
    });
  } catch (err) {
    console.error("[Kakao Channel Info Error]", err);
    return NextResponse.json(
      { error: "채널 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
