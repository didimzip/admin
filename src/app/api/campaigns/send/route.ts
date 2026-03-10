import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  const { recipients, senderName, subject, html } = await request.json() as {
    recipients: string[];
    senderName: string;
    subject: string;
    html: string;
  };

  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
    return NextResponse.json(
      { error: "메일 서버 설정이 없습니다. .env.local을 확인해주세요." },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? "2525"),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const from = `"${senderName}" <${process.env.MAIL_FROM ?? "noreply@didimzip.com"}>`;

  const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #334155; line-height: 1.75; margin: 0; padding: 0; background: #f8fafc; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; padding: 32px 40px; }
    h1 { font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #0f172a; line-height: 1.3; }
    h2 { font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #0f172a; }
    h3 { font-size: 1.1rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #0f172a; }
    p { margin-bottom: 0.75rem; line-height: 1.75; color: #334155; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    s { text-decoration: line-through; }
    u { text-decoration: underline; }
    ul { padding-left: 1.5rem; margin-bottom: 0.75rem; list-style-type: disc; }
    ol { padding-left: 1.5rem; margin-bottom: 0.75rem; list-style-type: decimal; }
    li { margin-bottom: 0.25rem; line-height: 1.75; color: #334155; }
    blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; margin-left: 0; margin-bottom: 0.75rem; color: #64748b; font-style: italic; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0; }
    a { color: #6366f1; text-decoration: underline; text-underline-offset: 2px; }
    code { background: #f1f5f9; border-radius: 0.25rem; padding: 0.125rem 0.375rem; font-size: 0.875em; font-family: monospace; color: #6366f1; }
    pre { background: #1e293b; border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem; overflow-x: auto; }
    pre code { background: none; color: #e2e8f0; padding: 0; border-radius: 0; font-size: 0.875rem; }
    img { width: 100%; max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.75rem 0; display: block; }
  </style>
</head>
<body>
  <div class="wrapper">
${html}
  </div>
</body>
</html>`;

  const results = await Promise.allSettled(
    recipients.map((to) =>
      transporter.sendMail({ from, to, subject, html: fullHtml })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failedEmails = results
    .map((r, i) => (r.status === "rejected" ? recipients[i] : null))
    .filter((e): e is string => e !== null);

  if (sent === 0) {
    return NextResponse.json(
      { error: "모든 이메일 발송이 실패했습니다.", sent, failed: failedEmails.length, failedEmails },
      { status: 500 }
    );
  }

  return NextResponse.json({ sent, failed: failedEmails.length, failedEmails });
}
