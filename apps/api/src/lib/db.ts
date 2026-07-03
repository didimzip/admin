import fs from "fs";
import path from "path";
import type { Post } from "@didimzip/api";
import { seedPosts } from "./seed";

// ─── Mock 영속 계층 (JSON 파일) ──────────────────────────────────────────────
//
// 실백엔드(PostgreSQL) 전환 시 이 파일과 repository 구현만 교체하면 된다.
// Route Handler / Client / admin / web 코드는 수정 불필요.

export interface DbShape {
  posts: Post[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function ensureDb(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbShape = { posts: seedPosts() };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function readDb(): DbShape {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as DbShape;
  } catch {
    return { posts: [] };
  }
}

export function writeDb(db: DbShape): void {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}
