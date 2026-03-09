// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminRole = "SUPER_ADMIN" | "OPERATOR";
export type AdminStatus = "ACTIVE" | "INACTIVE";

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // btoa(password) — 모의 해싱
  role: AdminRole;
  status: AdminStatus;
  createdAt: string;
  createdBy: string | null;
  lastLoginAt: string | null;
};

export type AdminSession = {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
  loginAt: string;
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const SESSION_KEY = "didimzip_admin_session";
const ACCOUNTS_KEY = "didimzip_admin_accounts";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_ACCOUNTS: AdminAccount[] = [
  {
    id: "admin_001",
    name: "슈퍼 관리자",
    email: "admin@didimzip.com",
    passwordHash: btoa("test123!"),
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    createdAt: "2025-01-01T00:00:00.000Z",
    createdBy: null,
    lastLoginAt: null,
  },
  {
    id: "admin_002",
    name: "운영 관리자",
    email: "operator@didimzip.com",
    passwordHash: btoa("test123!"),
    role: "OPERATOR",
    status: "ACTIVE",
    createdAt: "2025-01-15T00:00:00.000Z",
    createdBy: "admin_001",
    lastLoginAt: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadAccounts(): AdminAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw) as AdminAccount[];
    // 최초 실행 시 시드 데이터 저장
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(SEED_ACCOUNTS));
    return SEED_ACCOUNTS;
  } catch {
    return SEED_ACCOUNTS;
  }
}

function saveAccounts(accounts: AdminAccount[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: AdminSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type LoginResult =
  | { ok: true; session: AdminSession }
  | { ok: false; reason: "invalid_credentials" | "inactive_account" };

export function login(email: string, password: string): LoginResult {
  const accounts = loadAccounts();
  const account = accounts.find(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );

  if (!account || account.passwordHash !== btoa(password)) {
    return { ok: false, reason: "invalid_credentials" };
  }

  if (account.status === "INACTIVE") {
    return { ok: false, reason: "inactive_account" };
  }

  // 마지막 로그인 시각 업데이트
  const now = new Date().toISOString();
  saveAccounts(
    accounts.map((a) =>
      a.id === account.id ? { ...a, lastLoginAt: now } : a
    )
  );

  const session: AdminSession = {
    adminId: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
    loginAt: now,
  };
  saveSession(session);
  return { ok: true, session };
}

// ─── Admin Account Management ─────────────────────────────────────────────────

export function getAllAdmins(): AdminAccount[] {
  return loadAccounts();
}

export function createAdmin(
  data: Pick<AdminAccount, "name" | "email" | "role"> & { password: string },
  createdById: string
): AdminAccount {
  const accounts = loadAccounts();
  const now = new Date().toISOString();
  const newAccount: AdminAccount = {
    id: `admin_${Date.now()}`,
    name: data.name,
    email: data.email,
    passwordHash: btoa(data.password),
    role: data.role,
    status: "ACTIVE",
    createdAt: now,
    createdBy: createdById,
    lastLoginAt: null,
  };
  saveAccounts([...accounts, newAccount]);
  return newAccount;
}

export function updateAdmin(
  id: string,
  patch: Partial<Pick<AdminAccount, "role" | "status">>
): void {
  const accounts = loadAccounts();
  saveAccounts(
    accounts.map((a) => (a.id === id ? { ...a, ...patch } : a))
  );
}

export function verifyAdminPassword(id: string, password: string): boolean {
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.id === id);
  return !!account && account.passwordHash === btoa(password);
}

export function resetAdminPassword(id: string, newPassword: string): void {
  const accounts = loadAccounts();
  saveAccounts(
    accounts.map((a) =>
      a.id === id ? { ...a, passwordHash: btoa(newPassword) } : a
    )
  );
}

export function deleteAdmins(ids: string[]): void {
  const accounts = loadAccounts();
  saveAccounts(accounts.filter((a) => !ids.includes(a.id)));
}
