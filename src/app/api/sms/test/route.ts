import { NextResponse } from "next/server";

interface TestSmsRequest {
  apiKey?: string;
  userId?: string;
  sender: string;
  receiver: string;      // 테스트 수신 번호 1개
  msgType: "SMS" | "LMS" | "MMS";
  msg: string;
  title?: string;
  imageBase64?: string;
}

const ALIGO_SEND_URL = "https://apis.aligo.in/send/";

export async function POST(request: Request) {
  try {
    const body: TestSmsRequest = await request.json();
    const { sender, receiver, msgType, msg, title, imageBase64 } = body;

    const apiKey = body.apiKey || process.env.ALIGO_API_KEY || "";
    const userId = body.userId || process.env.ALIGO_USER_ID || "";

    // API 키 없으면 시뮬레이션 모드
    if (!apiKey || !userId) {
      // 1초 딜레이 후 시뮬레이션 결과 반환
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `[시뮬레이션] ${msgType} 테스트 발송 완료 (${receiver})`,
      });
    }

    if (!sender || !receiver || !msg) {
      return NextResponse.json(
        { error: "발신번호, 수신번호, 메시지 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const formData = new FormData();
    formData.append("key", apiKey);
    formData.append("user_id", userId);
    formData.append("sender", sender.replace(/-/g, ""));
    formData.append("receiver", receiver.replace(/-/g, ""));
    formData.append("msg", msg);
    formData.append("msg_type", msgType);
    formData.append("testmode_yn", "Y"); // 테스트 발송은 항상 테스트모드

    if (title && (msgType === "LMS" || msgType === "MMS")) {
      formData.append("title", title);
    }

    if (imageBase64 && msgType === "MMS") {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const blob = new Blob([buffer], { type: "image/jpeg" });
      formData.append("image", blob, "image.jpg");
    }

    const res = await fetch(ALIGO_SEND_URL, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (Number(data.result_code) === 1) {
      return NextResponse.json({
        success: true,
        simulated: false,
        message: `${msgType} 테스트 발송 완료 (${receiver}) — 테스트모드, 요금 미발생`,
      });
    }

    return NextResponse.json(
      { success: false, error: data.message || "알리고 API 오류" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[SMS Test Error]", err);
    return NextResponse.json(
      { error: "테스트 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
