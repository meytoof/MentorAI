"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DailyCount {
  date: string;
  count: number;
}

interface StatusCount {
  name: string;
  value: number;
  color: string;
}

interface LevelCount {
  level: string;
  count: number;
}

interface AdminChartsProps {
  signupsByDay: DailyCount[];
  conversationsByDay: DailyCount[];
  statusDistribution: StatusCount[];
  levelDistribution: LevelCount[];
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#1a2035",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: 12,
};

export default function AdminCharts({
  signupsByDay,
  conversationsByDay,
  statusDistribution,
  levelDistribution,
}: AdminChartsProps) {
  return (
    <div className="mt-10 flex flex-col gap-8">
      <h2 className="text-lg font-semibold text-white/70">Analytiques (30 derniers jours)</h2>

      {/* Row 1: Inscriptions + Conversations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inscriptions par jour */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Inscriptions / jour</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={signupsByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="count" name="Inscriptions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversations par jour */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Conversations / jour</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={conversationsByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="count"
                name="Conversations"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#8b5cf6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Statuts + Niveaux scolaires */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Statuts utilisateurs */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Statuts utilisateurs</p>
          {statusDistribution.every((s) => s.value === 0) ? (
            <p className="text-center text-sm text-white/30 py-16">Aucune donnée</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={statusDistribution.filter((s) => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution
                      .filter((s) => s.value > 0)
                      .map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {statusDistribution
                  .filter((s) => s.value > 0)
                  .map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-white/60">{s.name}</span>
                      <span className="ml-auto font-semibold text-white">{s.value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Niveaux scolaires */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Niveaux scolaires</p>
          {levelDistribution.length === 0 ? (
            <p className="text-center text-sm text-white/30 py-16">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={levelDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="level" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="count" name="Élèves" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
