import { ok, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export function GET() {
  return ok({ status: "ok", service: "didimzip-api" });
}
