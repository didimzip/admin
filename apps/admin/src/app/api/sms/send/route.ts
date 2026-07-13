import { NextResponse } from "next/server";
import crypto from "crypto";

interface SmsRequest {
  apiKey?: string;
  apiSecret?: string;
  sender: string;
  receivers: string[];   // ["010-1234-5678", ...]
  msg: string;
  subject?: string;      // LMS/MMS 제목
  imageId?: string;      // MMS 이미지 (솔라피 업로드 후 받은 ID)
}

interface SmsResult {
  sent: number;
  failed: number;
  failedPhones: string[];
  failedReasons: string[];
  groupId?: string;
}

const SOLAPI_SEND_URL = "https://api.solapi.com/messages/v4/send-many/detail";
const SOLAPI_GROUP_URL = "https://api.solapi.com/messages/v4/groups";
const SOLAPI_MESSAGES_URL = "https://api.solapi.com/messages/v4/list";
const BATCH_SIZE = 10000;
const POLL_INTERVAL = 2000; // 2초
const POLL_MAX_ATTEMPTS = 10; // 최대 20초 대기

function createSolapiAuthHeader(apiKey: string, apiSecret: string): string {
  const dateTime = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(dateTime + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 그룹의 메시지 목록을 조회하여 최종 이통사 결과를 수집 */
async function pollGroupResult(
  groupId: string,
  apiKey: string,
  apiSecret: string,
  totalCount: number,
): Promise<{ sent: number; failed: number; failedPhones: string[]; failedReasons: string[] }> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL);

    try {
      // 그룹 상태 조회
      const groupRes = await fetch(`${SOLAPI_GROUP_URL}/${groupId}`, {
        headers: { Authorization: createSolapiAuthHeader(apiKey, apiSecret) },
      });
      if (!groupRes.ok) continue;
      const groupData = await groupRes.json();

      // count 객체에서 상태 확인
      const count = groupData.count || {};
      const pending = (count.registering ?? 0) + (count.sending ?? 0);

      // 아직 처리 중이면 계속 대기
      if (pending > 0) continue;

      // 처리 완료 — 메시지 목록에서 실패 건 상세 조회
      const messagesRes = await fetch(
        `${SOLAPI_MESSAGES_URL}?groupId=${groupId}&limit=100`,
        { headers: { Authorization: createSolapiAuthHeader(apiKey, apiSecret) } },
      );
      if (!messagesRes.ok) break;
      const messagesData = await messagesRes.json();
      const messageList = messagesData.messageList || messagesData;

      let sent = 0;
      let failed = 0;
      const failedPhones: string[] = [];
      const failedReasons: string[] = [];

      // messageList가 객체(key=messageId)인 경우와 배열인 경우 모두 처리
      const entries = Array.isArray(messageList)
        ? messageList
        : Object.values(messageList);

      for (const msg of entries as Record<string, unknown>[]) {
        const status = String(msg.statusCode ?? msg.status ?? "");
        if (status === "4000" || status === "DELIVERED" || status === "success") {
          sent++;
        } else if (status.startsWith("2") || status === "SENDING" || status === "PENDING") {
          // 아직 처리 중 — 성공으로 잠정 처리
          sent++;
        } else {
          failed++;
          const phone = String(msg.to ?? "");
          if (phone) failedPhones.push(phone);
          const reason = String(msg.reason || msg.statusMessage || msg.statusCode || status);
          if (reason && !failedReasons.includes(reason)) {
            failedReasons.push(reason);
          }
        }
      }

      return { sent, failed, failedPhones, failedReasons };
    } catch {
      continue;
    }
  }

  // 타임아웃 — 기본값 반환 (보수적으로 처리)
  return { sent: 0, failed: 0, failedPhones: [], failedReasons: ["결과 조회 시간 초과 — 솔라피 콘솔에서 확인해주세요."] };
}

export async function POST(request: Request) {
  try {
    const body: SmsRequest = await request.json();
    const { sender, receivers, msg, subject, imageId } = body;

    const apiKey = body.apiKey || process.env.SOLAPI_API_KEY || "";
    const apiSecret = body.apiSecret || process.env.SOLAPI_API_SECRET || "";

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "솔라피 API Key 또는 API Secret이 설정되지 않았습니다." },
        { status: 400 }
      );
    }

    if (!sender || receivers.length === 0 || !msg) {
      return NextResponse.json(
        { error: "발신번호, 수신자, 메시지 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const result: SmsResult = { sent: 0, failed: 0, failedPhones: [], failedReasons: [] };

    for (let i = 0; i < receivers.length; i += BATCH_SIZE) {
      const batch = receivers.slice(i, i + BATCH_SIZE);
      const cleanSender = sender.replace(/-/g, "");

      const messages = batch.map((phone) => {
        const m: Record<string, string> = {
          to: phone.replace(/-/g, ""),
          from: cleanSender,
          text: msg,
        };
        if (subject) m.subject = subject;
        if (imageId) m.imageId = imageId;
        return m;
      });

      try {
        const res = await fetch(SOLAPI_SEND_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: createSolapiAuthHeader(apiKey, apiSecret),
          },
          body: JSON.stringify({ messages }),
        });
        const data = await res.json();

        if (res.ok) {
          const groupId = data.groupInfo?.groupId;
          result.groupId = groupId;

          // 발송 요청 시점의 즉시 실패 (잘못된 번호 등)
          const immediateFailCount = data.failedMessageList?.length ?? 0;
          if (data.failedMessageList?.length) {
            for (const fm of data.failedMessageList) {
              const idx = fm.index ?? 0;
              if (batch[idx]) result.failedPhones.push(batch[idx]);
              const reason = fm.reason || fm.message || fm.statusCode || "";
              if (reason && !result.failedReasons.includes(String(reason))) {
                result.failedReasons.push(String(reason));
              }
            }
            result.failed += immediateFailCount;
          }

          // 즉시 실패가 아닌 건들은 이통사 결과를 폴링
          const pendingCount = batch.length - immediateFailCount;
          if (pendingCount > 0 && groupId) {
            const pollResult = await pollGroupResult(groupId, apiKey, apiSecret, pendingCount);
            result.sent += pollResult.sent;
            result.failed += pollResult.failed;
            result.failedPhones.push(...pollResult.failedPhones);
            for (const r of pollResult.failedReasons) {
              if (!result.failedReasons.includes(r)) result.failedReasons.push(r);
            }
          }
        } else {
          result.failed += batch.length;
          result.failedPhones.push(...batch);
          const apiError = data.errorMessage || data.message || JSON.stringify(data);
          if (!result.failedReasons.includes(apiError)) {
            result.failedReasons.push(apiError);
          }
          console.error("[Solapi SMS Error]", data);
        }
      } catch (err) {
        result.failed += batch.length;
        result.failedPhones.push(...batch);
        console.error("[Solapi SMS Fetch Error]", err);
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
