import { NextResponse } from "next/server";
import crypto from "crypto";

const SOLAPI_GROUP_URL = "https://api.solapi.com/messages/v4/groups";
const SOLAPI_MESSAGES_URL = "https://api.solapi.com/messages/v4/list";

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
    const { apiKey, apiSecret, groupId } = await request.json();

    if (!apiKey || !apiSecret || !groupId) {
      return NextResponse.json(
        { error: "apiKey, apiSecret, groupId는 필수입니다." },
        { status: 400 },
      );
    }

    // 1) 그룹 상태 조회
    const groupRes = await fetch(`${SOLAPI_GROUP_URL}/${groupId}`, {
      headers: { Authorization: createSolapiAuthHeader(apiKey, apiSecret) },
    });
    if (!groupRes.ok) {
      const errData = await groupRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.errorMessage || "그룹 조회 실패" },
        { status: groupRes.status },
      );
    }
    const groupData = await groupRes.json();
    const count = groupData.count || {};
    const pending = (count.registering ?? 0) + (count.sending ?? 0);

    // 2) 메시지 목록 조회
    const messagesRes = await fetch(
      `${SOLAPI_MESSAGES_URL}?groupId=${groupId}&limit=100`,
      { headers: { Authorization: createSolapiAuthHeader(apiKey, apiSecret) } },
    );
    if (!messagesRes.ok) {
      return NextResponse.json(
        { error: "메시지 목록 조회 실패" },
        { status: messagesRes.status },
      );
    }
    const messagesData = await messagesRes.json();
    const messageList = messagesData.messageList || messagesData;
    const entries = Array.isArray(messageList)
      ? messageList
      : Object.values(messageList);

    let sent = 0;
    let failed = 0;
    const failedPhones: string[] = [];
    const failedReasons: string[] = [];

    for (const msg of entries as Record<string, unknown>[]) {
      const status = String(msg.statusCode ?? msg.status ?? "");
      if (status === "4000" || status === "DELIVERED" || status === "success") {
        sent++;
      } else if (
        status.startsWith("2") ||
        status === "SENDING" ||
        status === "PENDING"
      ) {
        // 아직 처리 중
        sent++; // 잠정 성공 처리
      } else {
        failed++;
        const phone = String(msg.to ?? "");
        if (phone) failedPhones.push(phone);
        const reason = String(
          msg.reason || msg.statusMessage || msg.statusCode || status,
        );
        if (reason && !failedReasons.includes(reason)) {
          failedReasons.push(reason);
        }
      }
    }

    return NextResponse.json({
      sent,
      failed,
      failedPhones,
      failedReasons,
      pending: pending > 0,
      groupStatus: groupData.status,
    });
  } catch (err) {
    console.error("[SMS Status Error]", err);
    return NextResponse.json(
      { error: "발송 결과 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
