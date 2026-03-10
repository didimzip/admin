"use client";

import {
  Users,
  UserPlus,
  ShieldCheck,
  FileWarning,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Hardcoded data                                                     */
/* ------------------------------------------------------------------ */

const summaryCards = [
  {
    title: "총 회원 수",
    value: "247",
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "이번 달 신규",
    value: "34",
    icon: UserPlus,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "인증 뱃지 보유",
    value: "89",
    icon: ShieldCheck,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    title: "서류 검토 대기",
    value: "3",
    icon: FileWarning,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
];

const recentMembers = [
  {
    nickname: "김건설",
    organization: "(주)대한건설",
    type: "시공사",
    joinDate: "2026-03-03",
  },
  {
    nickname: "이설계",
    organization: "모던건축사무소",
    type: "설계사",
    joinDate: "2026-03-02",
  },
  {
    nickname: "박자재",
    organization: "한빛자재",
    type: "자재업체",
    joinDate: "2026-03-01",
  },
  {
    nickname: "최인테리어",
    organization: "스타일홈 인테리어",
    type: "인테리어",
    joinDate: "2026-02-28",
  },
  {
    nickname: "정감리",
    organization: "신뢰감리",
    type: "감리사",
    joinDate: "2026-02-27",
  },
];

const monthlySignups = [
  { month: "10월", count: 28 },
  { month: "11월", count: 35 },
  { month: "12월", count: 22 },
  { month: "1월", count: 41 },
  { month: "2월", count: 38 },
  { month: "3월", count: 34 },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">대시보드</h2>
        <p className="mt-1 text-sm text-slate-500">
          DidimZip 서비스 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {card.title}
                </CardTitle>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Section: Table + Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Members Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              최근 가입 회원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>닉네임</TableHead>
                  <TableHead>소속</TableHead>
                  <TableHead>회원유형</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMembers.map((member) => (
                  <TableRow key={member.nickname}>
                    <TableCell className="font-medium">
                      {member.nickname}
                    </TableCell>
                    <TableCell>{member.organization}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {member.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {member.joinDate}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Monthly Signups Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              월별 신규 가입자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlySignups}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 13, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    labelStyle={{ fontWeight: 600, color: "#1e293b" }}
                  />
                  <Bar
                    dataKey="count"
                    name="가입자 수"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
