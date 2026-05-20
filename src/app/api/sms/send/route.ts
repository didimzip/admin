import { NextResponse } from "next/server";

interface SmsRequest {
  apiKey?: string;
  userId?: string;
  sender: string;
  receivers: string[];   // ["010-1234-5678", ...]
  msgType: "SMS" | "LMS" | "MMS";
  msg: string;
  title?: string;        // LMS/MMS 제목
  imageBase64?: string;  // MMS 이미지 (base64)
  testMode?: boolean;
}

interface SmsResult {
  sent: number;
  failed: number;
  failedPhones: string[];
}

const ALIGO_SEND_URL = "https://apis.aligo.in/send/";
const BATCH_SIZE = 1000; // 알리고 최대 수신자 수

export async function POST(request: Request) {
  try {
    const body: SmsRequest = await request.json();
    const { sender, receivers, msgType, msg, title, imageBase64, testMode } = body;

    // API 키: body에서 받거나 환경변수에서 가져오기
    const apiKey = body.apiKey || process.env.ALIGO_API_KEY || "";
    const userId = body.userId || process.env.ALIGO_USER_ID || "";

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: "알리고 API Key 또는 사용자 ID가 설정되지 않았습니다." },
        { status: 400 }
      );
    }

    if (!sender || receivers.length === 0 || !msg) {
      return NextResponse.json(
        { error: "발신번호, 수신자, 메시지 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const result: SmsResult = { sent: 0, failed: 0, failedPhones: [] };

    // 수신자 배치 분할
    for (let i = 0; i < receivers.length; i += BATCH_SIZE) {
      const batch = receivers.slice(i, i + BATCH_SIZE);
      // 010-1234-5678 → 01012345678 (하이픈 제거)
      const cleanNumbers = batch.map((r) => r.replace(/-/g, ""));

      const formData = new FormData();
      formData.append("key", apiKey);
      formData.append("user_id", userId);
      formData.append("sender", sender.replace(/-/g, ""));
      formData.append("receiver", cleanNumbers.join(","));
      formData.append("msg", msg);
      formData.append("msg_type", msgType);

      if (title && (msgType === "LMS" || msgType === "MMS")) {
        formData.append("title", title);
      }

      if (testMode) {
        formData.append("testmode_yn", "Y");
      }

      // MMS 이미지 처리
      if (imageBase64 && msgType === "MMS") {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const blob = new Blob([buffer], { type: "image/jpeg" });
        formData.append("image", blob, "image.jpg");
      }

      try {
        const res = await fetch(ALIGO_SEND_URL, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (Number(data.result_code) === 1) {
          // 성공
          result.sent += batch.length;
        } else {
          // 실패
          result.failed += batch.length;
          result.failedPhones.push(...batch);
          console.error("[Aligo SMS Error]", data.message);
        }
      } catch (err) {
        result.failed += batch.length;
        result.failedPhones.push(...batch);
        console.error("[Aligo SMS Fetch Error]", err);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[SMS Send Error]", err);
    return NextResponse.json(
      { error: "SMS 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
