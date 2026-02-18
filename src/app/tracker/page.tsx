"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  calculatePercentile,
  type MockTest,
  type SubjectScores,
  type PercentileResult,
  type Difficulty,
  type PaperType,
} from "@/lib/jee-percentile";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function pctColor(p: number) {
  if (p >= 99) return "text-emerald-400";
  if (p >= 95) return "text-green-400";
  if (p >= 90) return "text-lime-400";
  if (p >= 80) return "text-yellow-400";
  if (p >= 60) return "text-orange-400";
  return "text-red-400";
}

function rankBadgeColor(rank: number) {
  if (rank <= 500)    return "bg-gradient-to-r from-yellow-400 to-amber-500 text-black";
  if (rank <= 2500)   return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white";
  if (rank <= 10000)  return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
  if (rank <= 50000)  return "bg-gradient-to-r from-violet-500 to-purple-500 text-white";
  if (rank <= 200000) return "bg-gradient-to-r from-orange-500 to-red-500 text-white";
  return "bg-gradient-to-r from-gray-600 to-gray-700 text-white";
}

const DIFFICULTY_META: Record<Difficulty, { label: string; desc: string; color: string; bg: string; border: string }> = {
  easy:     { label: "Easy",     desc: "Simple shift — need more marks for same %ile", color: "#34d399", bg: "bg-emerald-500/10", border: "border-emerald-500/40" },
  moderate: { label: "Moderate", desc: "Average shift — standard 2024/25 benchmark",  color: "#60a5fa", bg: "bg-blue-500/10",    border: "border-blue-500/40" },
  tough:    { label: "Tough",    desc: "Hard shift — lower marks yield higher %ile",   color: "#f87171", bg: "bg-red-500/10",     border: "border-red-500/40" },
};

const PAPER_META: Record<PaperType, { label: string; subjects: ("physics" | "chemistry" | "mathematics")[]; color: string; icon: string }> = {
  pcm:         { label: "PCM (Full Paper)", subjects: ["physics", "chemistry", "mathematics"], color: "#a78bfa", icon: "⚡" },
  physics:     { label: "Physics Only",    subjects: ["physics"],     color: "#3b82f6", icon: "🔭" },
  chemistry:   { label: "Chemistry Only",  subjects: ["chemistry"],   color: "#10b981", icon: "⚗️" },
  mathematics: { label: "Mathematics Only",subjects: ["mathematics"], color: "#f59e0b", icon: "📐" },
};

const SUBJECT_META = {
  physics:     { label: "Physics",     color: "#3b82f6", scoreKey: "physics"     as const, maxKey: "physicsMax"     as const },
  chemistry:   { label: "Chemistry",   color: "#10b981", scoreKey: "chemistry"   as const, maxKey: "chemistryMax"   as const },
  mathematics: { label: "Mathematics", color: "#f59e0b", scoreKey: "mathematics" as const, maxKey: "mathematicsMax" as const },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SubjectInputProps {
  label: string;
  color: string;
  scored: number;
  max: number;
  onScored: (v: number) => void;
  onMax: (v: number) => void;
}

function SubjectInput({ label, color, scored, max, onScored, onMax }: SubjectInputProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((scored / max) * 100))) : 0;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm" style={{ color }}>{label}</span>
        <span className="text-xs text-gray-400">{scored} / {max} &nbsp;({pct}%)</span>
      </div>
      <div className="mb-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Marks Scored</label>
          <input
            type="number"
            value={scored}
            onChange={(e) => { const v = Number(e.target.value); onScored(isNaN(v) ? 0 : v); }}
            className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max Marks</label>
          <input
            type="number"
            value={max}
            min={1}
            onChange={(e) => { const v = Number(e.target.value); onMax(isNaN(v) || v <= 0 ? 100 : v); }}
            className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          />
        </div>
      </div>
    </div>
  );
}

function PaperTypePicker({ value, onChange }: { value: PaperType; onChange: (p: PaperType) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Paper Type</label>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(PAPER_META) as PaperType[]).map((p) => {
          const m = PAPER_META[p];
          const selected = value === p;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`rounded-xl border p-3 text-left transition-all ${
                selected
                  ? "border-white/30 bg-white/10 shadow-lg"
                  : "border-white/8 bg-white/4 hover:bg-white/8"
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base">{m.icon}</span>
                <span
                  className="text-xs font-bold"
                  style={{ color: selected ? m.color : "#9ca3af" }}
                >
                  {m.label}
                </span>
              </div>
              {selected && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {m.subjects.map((s) => (
                    <span
                      key={s}
                      className="text-[9px] rounded-full px-1.5 py-0.5 font-medium"
                      style={{ backgroundColor: `${SUBJECT_META[s].color}22`, color: SUBJECT_META[s].color }}
                    >
                      {SUBJECT_META[s].label}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Shift Difficulty</label>
      <div className="grid grid-cols-3 gap-2">
        {(["easy", "moderate", "tough"] as Difficulty[]).map((d) => {
          const m = DIFFICULTY_META[d];
          const selected = value === d;
          return (
            <button
              key={d}
              onClick={() => onChange(d)}
              className={`rounded-xl border p-3 text-left transition-all ${
                selected ? `${m.bg} ${m.border} shadow-lg` : "border-white/8 bg-white/4 hover:bg-white/8"
              }`}
            >
              <div className="text-xs font-bold mb-0.5" style={{ color: selected ? m.color : "#9ca3af" }}>{m.label}</div>
              <div className="text-[9px] text-gray-500 leading-tight">{m.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultCard({ result, difficulty }: { result: PercentileResult; difficulty: Difficulty }) {
  const dm = DIFFICULTY_META[difficulty];
  const pm = PAPER_META[result.paperType];

  const radarData = result.breakdown.map((b) => ({
    subject: b.label,
    percentile: parseFloat(b.percentile.toFixed(2)),
    score: Math.round((b.raw / b.max) * 100),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-lg">{pm.icon}</span>
          <p className="text-xs uppercase tracking-widest text-gray-400">{pm.label}</p>
        </div>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">NTA Score (Percentile)</p>
        <p className={`text-5xl font-black mb-1 ${pctColor(result.totalPercentile)}`}>
          {result.totalPercentile.toFixed(7)}
        </p>
        <p className="text-gray-400 text-sm">Raw: {result.totalRaw} / {result.totalMax}</p>

        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-medium ${dm.bg} ${dm.border}`}
            style={{ color: dm.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: dm.color }} />
            {dm.label} Shift
          </div>
          <div className={`inline-block rounded-full px-4 py-1 text-xs font-bold ${rankBadgeColor(result.estimatedRank)}`}>
            {result.category}
          </div>
        </div>
        <p className="mt-2 text-gray-400 text-sm">
          Est. Rank: <span className="text-white font-semibold">~{result.estimatedRank.toLocaleString("en-IN")}</span>
        </p>
      </div>

      {result.breakdown.length > 0 && (
        <div className={`grid gap-3 ${result.breakdown.length === 3 ? "grid-cols-3" : result.breakdown.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {result.breakdown.map((b) => (
            <div key={b.label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">{b.label}</p>
              <p className={`text-xl font-bold ${pctColor(b.percentile)}`}>{b.percentile.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{b.raw}/{b.max}</p>
            </div>
          ))}
        </div>
      )}

      {result.paperType === "pcm" && radarData.length === 3 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Subject Overview</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#ffffff15" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Radar name="Percentile" dataKey="percentile" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Radar name="Score %" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
              <Legend formatter={(v) => <span className="text-xs text-gray-400">{v}</span>} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {result.paperType === "pcm" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-400 space-y-1.5">
          <p className="font-semibold text-gray-300 text-sm mb-2">NTA Tie-Breaking Order</p>
          {[
            "Mathematics percentile (highest wins)",
            "Physics percentile",
            "Chemistry percentile",
            "Lower ratio of incorrect to correct answers",
            "Age (older candidate preferred)",
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">{i + 1}.</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function HistoryGraphs({ tests }: { tests: MockTest[] }) {
  if (tests.length === 0) return null;

  const lineData = tests.map((t, i) => ({
    name: t.name.length > 10 ? `T${i + 1}` : t.name,
    total: parseFloat(t.result.totalPercentile.toFixed(4)),
    physics:     parseFloat(t.result.physicsPercentile.toFixed(4)),
    chemistry:   parseFloat(t.result.chemistryPercentile.toFixed(4)),
    mathematics: parseFloat(t.result.mathematicsPercentile.toFixed(4)),
    fullName: t.name,
    date: t.date,
    paperType: t.paperType,
  }));

  const barData = tests.map((t, i) => {
    const pm = PAPER_META[t.paperType];
    const obj: Record<string, string | number> = {
      name: t.name.length > 10 ? `T${i + 1}` : t.name,
      fullName: t.name,
    };
    pm.subjects.forEach((s) => {
      obj[SUBJECT_META[s].label] = t.scores[SUBJECT_META[s].scoreKey];
    });
    return obj;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const item = lineData.find((d) => d.name === label) || lineData[0];
    return (
      <div className="rounded-xl border border-white/10 bg-gray-900/95 p-3 text-xs shadow-xl">
        <p className="font-semibold text-white mb-1">{item.fullName}</p>
        <p className="text-gray-400 mb-2">{item.date} · {PAPER_META[item.paperType as PaperType].label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="text-white font-mono">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const item = barData.find((d) => d.name === label) || barData[0];
    return (
      <div className="rounded-xl border border-white/10 bg-gray-900/95 p-3 text-xs shadow-xl">
        <p className="font-semibold text-white mb-2">{item.fullName as string}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span style={{ color: p.fill }}>{p.name}:</span>
            <span className="text-white font-mono">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-semibold text-white mb-1 text-sm">Percentile Trend</h3>
        <p className="text-xs text-gray-500 mb-4">NTA Score across all saved tests</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span className="text-xs text-gray-400">{v}</span>} />
            {tests.length > 1 && (
              <ReferenceLine y={99} stroke="#ffffff20" strokeDasharray="4 4" label={{ value: "99", fill: "#ffffff40", fontSize: 10 }} />
            )}
            <Line type="monotone" dataKey="total"       stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4, fill: "#a855f7" }} name="Total" />
            <Line type="monotone" dataKey="physics"     stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 3 }} name="Physics"     strokeDasharray="5 3" />
            <Line type="monotone" dataKey="chemistry"   stroke="#10b981" strokeWidth={1.5} dot={{ r: 3 }} name="Chemistry"   strokeDasharray="5 3" />
            <Line type="monotone" dataKey="mathematics" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3 }} name="Mathematics" strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-semibold text-white mb-1 text-sm">Raw Marks Comparison</h3>
        <p className="text-xs text-gray-500 mb-4">Subject-wise marks across all tests</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <Tooltip content={<BarTooltip />} />
            <Legend formatter={(v) => <span className="text-xs text-gray-400">{v}</span>} />
            <Bar dataKey="Physics"     fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Chemistry"   fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Mathematics" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-semibold text-white mb-4 text-sm">Total Percentile — All Tests</h3>
        <div className="space-y-3">
          {[...tests].reverse().map((t) => {
            const p = t.result.totalPercentile;
            const dm = DIFFICULTY_META[t.difficulty];
            const pm = PAPER_META[t.paperType];
            return (
              <div key={t.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <span>{pm.icon}</span>
                    {t.name}
                    <span className="rounded-full px-1.5 py-0.5 text-[9px]" style={{ color: dm.color, background: `${dm.color}18` }}>
                      {dm.label}
                    </span>
                  </span>
                  <span className={`font-bold font-mono ${pctColor(p)}`}>{p.toFixed(4)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${p}%`,
                      background: p >= 99 ? "linear-gradient(90deg,#10b981,#34d399)"
                                : p >= 90 ? "linear-gradient(90deg,#3b82f6,#60a5fa)"
                                : p >= 70 ? "linear-gradient(90deg,#f59e0b,#fcd34d)"
                                : "linear-gradient(90deg,#ef4444,#f87171)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Tracker Page ────────────────────────────────────────────────────────

const DEFAULT_SCORES: SubjectScores = {
  physics: 0, chemistry: 0, mathematics: 0,
  physicsMax: 100, chemistryMax: 100, mathematicsMax: 100,
};

type TabType = "add" | "history" | "graphs";

export default function TrackerPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [paperType, setPaperType] = useState<PaperType>("pcm");
  const [scores, setScores] = useState<SubjectScores>(DEFAULT_SCORES);
  const [difficulty, setDifficulty] = useState<Difficulty>("moderate");
  const [testName, setTestName] = useState("");
  const [testDate, setTestDate] = useState("2026-02-18");
  const [currentResult, setCurrentResult] = useState<PercentileResult | null>(null);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [tab, setTab] = useState<TabType>("add");
  const [calculated, setCalculated] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const visibleSubjects = PAPER_META[paperType].subjects;

  const handlePaperTypeChange = (p: PaperType) => {
    setPaperType(p);
    setCalculated(false);
    setCurrentResult(null);
  };

  const handleCalculate = useCallback(() => {
    const result = calculatePercentile(scores, difficulty, paperType);
    setCurrentResult(result);
    setCalculated(true);
  }, [scores, difficulty, paperType]);

  const handleSave = useCallback(() => {
    if (!currentResult) return;
    const name = testName.trim() || `Mock Test ${tests.length + 1}`;
    const newTest: MockTest = {
      id: uid(),
      name,
      date: testDate,
      scores: { ...scores },
      difficulty,
      paperType,
      result: currentResult,
    };
    setTests((prev) => [...prev, newTest]);
    setTestName("");
    setCalculated(false);
    setCurrentResult(null);
    setScores(DEFAULT_SCORES);
    setTab("history");
  }, [currentResult, testName, testDate, scores, difficulty, paperType, tests.length]);

  const handleDelete = useCallback((id: string) => {
    setTests((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateScore = (field: keyof SubjectScores) => (v: number) => {
    setScores((prev) => ({ ...prev, [field]: v }));
    setCalculated(false);
    setCurrentResult(null);
  };

  const handleDifficultyChange = (d: Difficulty) => {
    setDifficulty(d);
    setCalculated(false);
    setCurrentResult(null);
  };

  const best = tests.length
    ? tests.reduce((a, b) => b.result.totalPercentile > a.result.totalPercentile ? b : a)
    : null;

  const displayTotal = visibleSubjects.reduce((s, sub) => s + scores[SUBJECT_META[sub].scoreKey], 0);
  const displayMax   = visibleSubjects.reduce((s, sub) => s + scores[SUBJECT_META[sub].maxKey], 0);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#0d0d15]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-black shadow-lg shadow-blue-500/20">
              J
            </Link>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight">JEE Mock Tracker</h1>
              <p className="text-xs text-gray-500">NTA Score · Percentile · Rank Estimator</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {best && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Best Percentile</p>
                <p className={`text-lg font-black ${pctColor(best.result.totalPercentile)}`}>
                  {best.result.totalPercentile.toFixed(4)}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 border-l border-white/8 pl-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-all"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats bar */}
        {tests.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
              <p className="text-2xl font-black text-white">{tests.length}</p>
              <p className="text-xs text-gray-500">Tests Taken</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
              <p className={`text-2xl font-black ${pctColor(best!.result.totalPercentile)}`}>
                {best!.result.totalPercentile.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Best %ile</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
              <p className="text-2xl font-black text-white">
                {(tests.reduce((s, t) => s + t.result.totalPercentile, 0) / tests.length).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Avg %ile</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-center hidden sm:block">
              <p className="text-2xl font-black text-white">
                ~{best!.result.estimatedRank.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-gray-500">Best Rank</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 mb-6">
          {(["add", "history", "graphs"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                tab === t ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "add" ? "Add Test" : t === "history" ? `History (${tests.length})` : "Graphs"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── ADD TEST TAB ─────────────────────────────────────────────── */}
          {tab === "add" && (
            <motion.div
              key="add"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Left: Input */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
                  <h2 className="font-semibold text-white mb-4">Enter Your Marks</h2>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Test Name</label>
                      <input
                        type="text"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        placeholder="e.g. JEE Mock #1"
                        className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        value={testDate}
                        onChange={(e) => setTestDate(e.target.value)}
                        className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <PaperTypePicker value={paperType} onChange={handlePaperTypeChange} />
                  </div>

                  <div className="mb-4">
                    <DifficultyPicker value={difficulty} onChange={handleDifficultyChange} />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={paperType}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {visibleSubjects.map((sub) => {
                        const meta = SUBJECT_META[sub];
                        return (
                          <SubjectInput
                            key={sub}
                            label={meta.label}
                            color={meta.color}
                            scored={scores[meta.scoreKey]}
                            max={scores[meta.maxKey]}
                            onScored={updateScore(meta.scoreKey)}
                            onMax={updateScore(meta.maxKey)}
                          />
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total</span>
                    <span className="font-bold text-white text-sm">{displayTotal} / {displayMax}</span>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleCalculate}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-semibold text-white hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                      Calculate Percentile
                    </button>
                    {calculated && currentResult && (
                      <button
                        onClick={handleSave}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-all active:scale-95"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-gray-400 space-y-2">
                  <p className="text-blue-400 font-semibold text-sm">How percentile is calculated</p>
                  <p>
                    Uses actual NTA JEE Main 2024 &amp; 2025 marks-vs-percentile data from{" "}
                    <span className="text-blue-400">jeepredictor.in</span>, with linear interpolation
                    between known data points.
                  </p>
                  <p className="font-mono text-gray-500 bg-black/30 rounded p-2 leading-relaxed whitespace-pre">{`P = 100 × (candidates ≤ score) / total\nRank = ⌈((100 − P)/100) × 15,50,000⌉ + 1`}</p>
                  <p className="text-yellow-400/80">Estimates only — actual NTA score depends on live session data.</p>
                </div>
              </div>

              {/* Right: Result */}
              <div>
                {currentResult ? (
                  <ResultCard result={currentResult} difficulty={difficulty} />
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4 text-2xl">
                      📊
                    </div>
                    <p className="text-gray-400 font-medium mb-1">Select paper type, enter marks</p>
                    <p className="text-gray-400 font-medium">and click</p>
                    <p className="text-blue-400 font-bold mt-1">"Calculate Percentile"</p>
                    <p className="text-xs text-gray-600 mt-3">Supports any marks out of any max (e.g. 75/100, 45/60)</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── HISTORY TAB ──────────────────────────────────────────────── */}
          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {tests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-gray-400">No tests saved yet.</p>
                  <button
                    onClick={() => setTab("add")}
                    className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-sm font-semibold transition-all"
                  >
                    Add First Test
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...tests].reverse().map((t) => {
                    const dm = DIFFICULTY_META[t.difficulty];
                    const pm = PAPER_META[t.paperType];
                    return (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-white/10 bg-white/4 p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white flex items-center gap-2">
                              <span>{pm.icon}</span>
                              {t.name}
                              <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ color: dm.color, background: `${dm.color}18` }}>
                                {dm.label}
                              </span>
                            </h3>
                            <p className="text-xs text-gray-500">{t.date} · {pm.label}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`text-2xl font-black ${pctColor(t.result.totalPercentile)}`}>
                                {t.result.totalPercentile.toFixed(4)}
                              </p>
                              <p className="text-xs text-gray-500">NTA Score</p>
                            </div>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-2 py-1.5 transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className={`grid gap-2 mb-3 ${t.result.breakdown.length === 3 ? "grid-cols-3" : t.result.breakdown.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {t.result.breakdown.map((b) => (
                            <div key={b.label} className="rounded-lg bg-white/5 p-2 text-center">
                              <p className="text-xs text-gray-500">{b.label}</p>
                              <p className="text-sm font-bold text-white">{b.raw}/{b.max}</p>
                              <p className={`text-xs font-mono ${pctColor(b.percentile)}`}>{b.percentile.toFixed(2)}%ile</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rankBadgeColor(t.result.estimatedRank)}`}>
                            {t.result.category}
                          </span>
                          <span className="text-gray-400">Rank ~{t.result.estimatedRank.toLocaleString("en-IN")}</span>
                        </div>

                        <div className="mt-3 h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${t.result.totalPercentile}%`,
                              background: t.result.totalPercentile >= 99 ? "linear-gradient(90deg,#10b981,#34d399)"
                                        : t.result.totalPercentile >= 90 ? "linear-gradient(90deg,#3b82f6,#60a5fa)"
                                        : t.result.totalPercentile >= 70 ? "linear-gradient(90deg,#f59e0b,#fcd34d)"
                                        : "linear-gradient(90deg,#ef4444,#f87171)",
                            }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── GRAPHS TAB ────────────────────────────────────────────────── */}
          {tab === "graphs" && (
            <motion.div
              key="graphs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {tests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                  <div className="text-4xl mb-3">📈</div>
                  <p className="text-gray-400">Add at least one test to see graphs.</p>
                  <button
                    onClick={() => setTab("add")}
                    className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-sm font-semibold transition-all"
                  >
                    Add First Test
                  </button>
                </div>
              ) : (
                <HistoryGraphs tests={tests} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="border-t border-white/8 mt-12 py-5 text-center text-xs text-gray-600">
        Data sourced from NTA JEE Main 2024 &amp; 2025 results via jeepredictor.in &bull; Estimates only &bull; Not affiliated with NTA
      </footer>
    </div>
  );
}
