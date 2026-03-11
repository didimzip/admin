import { NextResponse } from "next/server";
import crypto from "crypto";

interface TestSmsRequest {
  apiKey?: string;
  apiSecret?: string;
  sender: string;
  receiver: string;      // 테스트 수신 번호 1개
  msg: string;
  subject?: string;
  imageId?: string;
}

const SOLAPI_SEND_URL = "https://api.solapi.com/messages/v4/send-many/detail";

function createSolapiAuthHeader(apiKey: string, apiSecret: string): string {
  const dateTime = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(dateTime + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`;
}

export async function POST(request: Request) {
  try {
    const body: TestSmsRequest = await request.json();
    const { sender, receiver, msg, subject, imageId } = body;

    const apiKey = body.apiKey || process.env.SOLAPI_API_KEY || "";
    const apiSecret = body.apiSecret || process.env.SOLAPI_API_SECRET || "";

    // API 키 없으면 시뮬레이션 모드
    if (!apiKey || !apiSecret) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const autoType = imageId ? "MMS" : (new Blob([msg]).size > 90 ? "LMS" : "SMS");
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `[시뮬레이션] ${autoType} 테스트 발송 완료 (${receiver})`,
      });
    }

    if (!sender || !receiver || !msg) {
      return NextResponse.json(
        { error: "발신번호, 수신번호, 메시지 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const message: Record<string, string> = {
      to: receiver.replace(/-/g, ""),
      from: sender.replace(/-/g, ""),
      text: msg,
    };
    if (subject) message.subject = subject;
    if (imageId) message.imageId = imageId;

    const res = await fetch(SOLAPI_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createSolapiAuthHeader(apiKey, apiSecret),
      },
      body: JSON.stringify({ messages: [message] }),
    });
    const data = await res.json();

    if (res.ok && (!data.failedMessageList || data.failedMessageList.length === 0)) {
      const autoType = imageId ? "MMS" : (subject || new Blob([msg]).size > 90 ? "LMS" : "SMS");
      return NextResponse.json({
        success: true,
        simulated: false,
        message: `${autoType} 테스트 발송 완료 (${receiver})`,
      });
    }

    const fm = data.failedMessageList?.[0];
    const errorMsg = fm?.reason || fm?.message || fm?.statusCode || data.errorMessage || "솔라피 API 오류";
    return NextResponse.json(
      { success: false, error: String(errorMsg) },
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
