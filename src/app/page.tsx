"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  {
    icon: "📊",
    title: "Percentile Calculator",
    desc: "Uses actual NTA JEE Main 2024–25 data from jeepredictor.in with linear interpolation for precise NTA scores up to 7 decimal places.",
    color: "#3b82f6",
  },
  {
    icon: "⚡",
    title: "All Paper Types",
    desc: "Track PCM full paper, or individual Physics, Chemistry, and Mathematics mock tests. Enter marks out of any maximum.",
    color: "#a78bfa",
  },
  {
    icon: "🏆",
    title: "Rank Estimation",
    desc: "Instantly see your estimated All India Rank among 15.5 lakh candidates and which college category you fall in.",
    color: "#f59e0b",
  },
  {
    icon: "📈",
    title: "Progress Graphs",
    desc: "Visualize your percentile trend, subject-wise raw marks, and cumulative improvement across all your saved tests.",
    color: "#10b981",
  },
  {
    icon: "🔄",
    title: "Shift Normalization",
    desc: "Apply Easy / Moderate / Tough shift difficulty adjustments — the same normalization method NTA uses across sessions.",
    color: "#f43f5e",
  },
  {
    icon: "🔗",
    title: "Tie-Breaking Rules",
    desc: "Understand exactly where you stand with NTA's official tie-breaking order: Maths → Physics → Chemistry → accuracy → age.",
    color: "#06b6d4",
  },
];

const stats = [
  { value: "15.5L+", label: "Candidates Benchmarked" },
  { value: "7", label: "Decimal Precision" },
  { value: "4", label: "Paper Types" },
  { value: "NTA", label: "Official Formula" },
];

const faqs = [
  {
    q: "How accurate is the percentile calculation?",
    a: "It uses real NTA JEE Main 2024 & 2025 result data (84 data points) from jeepredictor.in and applies linear interpolation. Results are estimates — actual NTA scores depend on live session data.",
  },
  {
    q: "Can I enter marks out of any number?",
    a: "Yes. Enter your scored marks and the maximum possible marks for each subject. The tool normalizes your score to the JEE Main 300/100-point scale automatically.",
  },
  {
    q: "What is shift difficulty normalization?",
    a: "NTA adjusts scores across sessions to account for difficulty variation. 'Easy' shifts require higher marks for the same percentile; 'Tough' shifts are more lenient. This mirrors NTA's official inter-session normalization.",
  },
  {
    q: "Is my data saved securely?",
    a: "All your test data is stored locally in your browser. Nothing is sent to any server. Your account credentials are stored in your browser's localStorage.",
  },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If already logged in, going to tracker is one click away but don't auto-redirect
  // so user still sees the homepage

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-white/8 bg-[#0d0d15]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base font-black shadow-lg shadow-blue-500/30">
              J
            </div>
            <div>
              <span className="font-bold text-white text-sm">JEE Mock Tracker</span>
              <span className="hidden sm:inline text-xs text-gray-500 ml-2">by jeepredictor.in formula</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:block text-xs text-gray-400">
                  Hi, <span className="text-white font-medium">{user.name.split(" ")[0]}</span>
                </span>
                <Link
                  href="/tracker"
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
                >
                  Open Tracker
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:border-white/30 transition-all"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-600/8 blur-[100px]" />
          <div className="absolute top-[30%] right-[10%] w-[250px] h-[250px] rounded-full bg-cyan-600/8 blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              NTA Formula · jeepredictor.in data · JEE Main 2025
            </div>

            <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6">
              Track Your{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                JEE Mock Tests
              </span>
              <br />
              Know Your Percentile
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Enter marks from any mock paper — PCM or individual subjects — and get your exact NTA percentile,
              estimated rank, and progress graphs. All calculated using real JEE Main data.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {user ? (
                <Link
                  href="/tracker"
                  className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-bold hover:from-blue-500 hover:to-purple-500 transition-all shadow-2xl shadow-blue-500/30 active:scale-95"
                >
                  Go to My Tracker →
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-bold hover:from-blue-500 hover:to-purple-500 transition-all shadow-2xl shadow-blue-500/30 active:scale-95"
                  >
                    Get Started Free →
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto rounded-2xl border border-white/15 px-8 py-4 text-base font-medium text-gray-300 hover:text-white hover:border-white/30 transition-all"
                  >
                    I already have an account
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/8 bg-white/4 p-4 text-center"
              >
                <p className="text-2xl sm:text-3xl font-black text-white mb-1">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mock result preview */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/10 to-purple-600/10 p-6 sm:p-8"
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 text-center">Sample Result</p>
            <p className="text-xs text-gray-600 text-center mb-6">PCM Full Paper · Moderate Shift · 210 / 300</p>
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">NTA Score (Percentile)</p>
              <p className="text-5xl sm:text-6xl font-black text-emerald-400">99.5620000</p>
              <p className="text-sm text-gray-500 mt-1">Estimated Rank: ~6,759</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Physics", score: "70/100", pct: "98.75", color: "#3b82f6" },
                { label: "Chemistry", score: "68/100", pct: "98.38", color: "#10b981" },
                { label: "Mathematics", score: "72/100", pct: "99.05", color: "#f59e0b" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className="text-sm font-bold text-white">{s.score}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: s.color }}>{s.pct}%ile</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Everything you need to</h2>
            <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ace your JEE preparation
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-2xl border border-white/8 bg-white/4 p-6 hover:bg-white/6 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `${f.color}18` }}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 border-t border-white/6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">How it works</h2>
            <p className="text-gray-400">Three steps to know your JEE percentile</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Create your account", desc: "Sign up in seconds. No email verification — just pick a name, email, and password." },
              { step: "02", title: "Enter your mock marks", desc: "Select the paper type, pick difficulty, enter marks scored and max marks for each subject." },
              { step: "03", title: "See your NTA score", desc: "Get your percentile, estimated rank, subject breakdown, and progress graphs instantly." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-black text-white/5 mb-3 leading-none">{s.step}</div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <div className="hidden sm:block absolute top-6 right-0 translate-x-1/2 text-gray-700 text-2xl">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 border-t border-white/6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Frequently asked</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="rounded-2xl border border-white/8 bg-white/4 p-5"
              >
                <p className="font-semibold text-white mb-2">{faq.q}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 border-t border-white/6">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Ready to track your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                progress?
              </span>
            </h2>
            <p className="text-gray-400 mb-8">
              Join thousands of JEE aspirants using data-driven mock test analysis.
            </p>
            {user ? (
              <Link
                href="/tracker"
                className="inline-block rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-10 py-4 text-base font-bold hover:from-blue-500 hover:to-purple-500 transition-all shadow-2xl shadow-blue-500/30"
              >
                Go to My Tracker →
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-block rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-10 py-4 text-base font-bold hover:from-blue-500 hover:to-purple-500 transition-all shadow-2xl shadow-blue-500/30"
              >
                Create Free Account →
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-6 text-center text-xs text-gray-600">
        Data sourced from NTA JEE Main 2024 &amp; 2025 results via jeepredictor.in &bull; Estimates only &bull; Not affiliated with NTA or jeepredictor.in
      </footer>
    </div>
  );
}
