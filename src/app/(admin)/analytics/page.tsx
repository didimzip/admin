"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Users, FileText, MessageSquare } from "lucide-react";
import { monthlyStats, contentPerformance } from "@/data/mock-data";

export default function AnalyticsPage() {
  const latest = monthlyStats[monthlyStats.length - 1];
  const prev = monthlyStats[monthlyStats.length - 2];

  function diff(curr: number, previous: number) {
    const d = curr - previous;
    return d >= 0 ? `+${d}` : `${d}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">통계/분석</h2>
        <p className="mt-1 text-sm text-slate-500">서비스 주요 지표를 기간별로 분석합니다.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "이번 달 가입", value: latest.signups, change: diff(latest.signups, prev.signups), icon: Users, bg: "bg-blue-100", color: "text-blue-600" },
          { label: "이번 달 게시물", value: latest.posts, change: diff(latest.posts, prev.posts), icon: FileText, bg: "bg-green-100", color: "text-green-600" },
          { label: "이번 달 댓글", value: latest.comments, change: diff(latest.comments, prev.comments), icon: MessageSquare, bg: "bg-purple-100", color: "text-purple-600" },
          { label: "페이지뷰", value: latest.pageViews.toLocaleString(), change: diff(latest.pageViews, prev.pageViews), icon: TrendingUp, bg: "bg-orange-100", color: "text-orange-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{card.label}</CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}><Icon className={`h-5 w-5 ${card.color}`} /></div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{card.value}</div>
                <p className="mt-1 text-xs text-slate-500">전월 대비 <span className={card.change.startsWith("+") ? "text-green-600" : "text-red-600"}>{card.change}</span></p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base font-semibold text-slate-900">월별 추이</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyStats.map((s) => ({ ...s, month: s.month.slice(5) + "월" }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 13, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 13, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="signups" name="가입" stroke="#4f46e5" strokeWidth={2} />
                  <Line type="monotone" dataKey="posts" name="게시물" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="comments" name="댓글" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Page Views */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base font-semibold text-slate-900">월별 페이지뷰</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats.map((s) => ({ ...s, month: s.month.slice(5) + "월" }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 13, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 13, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px" }} />
                  <Bar dataKey="pageViews" name="페이지뷰" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance */}
      <Card className="bg-white">
        <CardHeader><CardTitle className="text-base font-semibold text-slate-900">콘텐츠 클릭 대비 스크랩 비율</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead className="text-right">조회수</TableHead>
                <TableHead className="text-right">스크랩수</TableHead>
                <TableHead className="text-right">스크랩 비율</TableHead>
                <TableHead>성과</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentPerformance.map((cp) => (
                <TableRow key={cp.category}>
                  <TableCell className="font-medium">{cp.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{cp.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{cp.scraps.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{cp.ratio}%</TableCell>
                  <TableCell>
                    {cp.ratio >= 7 ? <Badge variant="success">우수</Badge> : cp.ratio >= 4.5 ? <Badge variant="warning">보통</Badge> : <Badge variant="secondary">개선 필요</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
