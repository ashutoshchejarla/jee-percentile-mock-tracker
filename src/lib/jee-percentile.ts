/**
 * JEE Main Percentile Calculation
 *
 * Based on jeepredictor.in methodology using actual NTA JEE Main 2024 & 2025
 * result data.
 *
 * Official NTA formula:
 *   Percentile (NTA Score) = 100 × (candidates with raw score ≤ yours) / (total candidates in session)
 *   Rank ≈ ceil(((100 − P) / 100) × 15,50,000) + 1
 *
 * Supports four paper types:
 *   - "pcm"        : Full paper (Physics + Chemistry + Mathematics), total out of 300
 *   - "physics"    : Physics-only paper
 *   - "chemistry"  : Chemistry-only paper
 *   - "mathematics": Mathematics-only paper
 *
 * For single-subject papers the same marks-vs-percentile distribution is used
 * (jeepredictor.in shows per-subject percentiles using the same session rank table),
 * but scores are normalised to a 100-point scale (each subject is /100 in JEE Main).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaperType = "pcm" | "physics" | "chemistry" | "mathematics";
export type Difficulty = "easy" | "moderate" | "tough";

export interface SubjectScores {
  physics: number;
  chemistry: number;
  mathematics: number;
  physicsMax: number;
  chemistryMax: number;
  mathematicsMax: number;
}

export interface PercentileResult {
  physicsPercentile: number;
  chemistryPercentile: number;
  mathematicsPercentile: number;
  totalPercentile: number;
  totalRaw: number;
  totalMax: number;
  estimatedRank: number;
  category: string;
  paperType: PaperType;
  breakdown: {
    label: string;
    raw: number;
    max: number;
    percentile: number;
    color: string;
  }[];
}

export interface MockTest {
  id: string;
  name: string;
  date: string;
  scores: SubjectScores;
  difficulty: Difficulty;
  paperType: PaperType;
  result: PercentileResult;
}

// ─── Marks-vs-Percentile Table (jeepredictor.in / NTA 2024-25 data) ──────────
//
// Full-paper table (out of 300). Each entry: { score, percentile }.
// Derived from actual NTA JEE Main Jan/Apr 2025 declared results data
// as cross-referenced on jeepredictor.in.
// Sorted descending by score.

const BASE_TABLE_300: { score: number; percentile: number }[] = [
  { score: 300, percentile: 100.0000000 },
  { score: 292, percentile: 99.9997000 },
  { score: 285, percentile: 99.9990000 },
  { score: 280, percentile: 99.9980000 },
  { score: 275, percentile: 99.9960000 },
  { score: 270, percentile: 99.9920000 },
  { score: 265, percentile: 99.9870000 },
  { score: 260, percentile: 99.9800000 },
  { score: 255, percentile: 99.9700000 },
  { score: 250, percentile: 99.9570000 },
  { score: 245, percentile: 99.9390000 },
  { score: 240, percentile: 99.9170000 },
  { score: 235, percentile: 99.8870000 },
  { score: 230, percentile: 99.8480000 },
  { score: 225, percentile: 99.8020000 },
  { score: 220, percentile: 99.7430000 },
  { score: 215, percentile: 99.6680000 },
  { score: 212, percentile: 99.6000000 },
  { score: 210, percentile: 99.5620000 }, // ~6,759 rank (NTA 2025)
  { score: 207, percentile: 99.4800000 },
  { score: 205, percentile: 99.4200000 },
  { score: 202, percentile: 99.3500000 },
  { score: 200, percentile: 99.2800000 },
  { score: 197, percentile: 99.1800000 },
  { score: 195, percentile: 99.1100000 },
  { score: 192, percentile: 99.0200000 },
  { score: 190, percentile: 98.9300000 },
  { score: 187, percentile: 98.8000000 },
  { score: 185, percentile: 98.7000000 },
  { score: 183, percentile: 98.5800000 },
  { score: 181, percentile: 98.4500000 },
  { score: 179, percentile: 98.3200000 },
  { score: 177, percentile: 98.1600000 },
  { score: 175, percentile: 98.0000000 },
  { score: 173, percentile: 97.8000000 },
  { score: 171, percentile: 97.6200000 },
  { score: 169, percentile: 97.4100000 },
  { score: 167, percentile: 97.2200000 },
  { score: 165, percentile: 97.0000000 },
  { score: 163, percentile: 96.7600000 },
  { score: 161, percentile: 96.5000000 },
  { score: 159, percentile: 96.2400000 },
  { score: 157, percentile: 96.0000000 },
  { score: 155, percentile: 95.7000000 },
  { score: 153, percentile: 95.4200000 },
  { score: 151, percentile: 95.1200000 },
  { score: 149, percentile: 94.8200000 },
  { score: 147, percentile: 94.5000000 },
  { score: 145, percentile: 94.1700000 },
  { score: 143, percentile: 93.8200000 },
  { score: 141, percentile: 93.5000000 },
  { score: 139, percentile: 93.1000000 },
  { score: 137, percentile: 92.7000000 },
  { score: 135, percentile: 92.3000000 },
  { score: 133, percentile: 91.8000000 },
  { score: 131, percentile: 91.3500000 },
  { score: 129, percentile: 90.8500000 },
  { score: 127, percentile: 90.3000000 },
  { score: 125, percentile: 89.7500000 },
  { score: 122, percentile: 88.9000000 },
  { score: 119, percentile: 88.0000000 },
  { score: 116, percentile: 87.0000000 },
  { score: 113, percentile: 86.0000000 },
  { score: 110, percentile: 84.9000000 }, // JEE Adv cutoff ~2025 (~88th %ile)
  { score: 107, percentile: 83.6000000 },
  { score: 104, percentile: 82.2000000 },
  { score: 101, percentile: 80.8000000 },
  { score: 98,  percentile: 79.2000000 },
  { score: 95,  percentile: 77.5000000 },
  { score: 92,  percentile: 75.7000000 },
  { score: 89,  percentile: 73.8000000 },
  { score: 86,  percentile: 71.8000000 },
  { score: 83,  percentile: 69.7000000 },
  { score: 80,  percentile: 67.5000000 },
  { score: 75,  percentile: 64.0000000 },
  { score: 70,  percentile: 60.2000000 },
  { score: 65,  percentile: 56.2000000 },
  { score: 60,  percentile: 52.0000000 },
  { score: 55,  percentile: 47.5000000 },
  { score: 50,  percentile: 43.0000000 },
  { score: 45,  percentile: 38.2000000 },
  { score: 40,  percentile: 33.2000000 },
  { score: 35,  percentile: 28.0000000 },
  { score: 30,  percentile: 22.8000000 },
  { score: 25,  percentile: 18.0000000 },
  { score: 20,  percentile: 14.0000000 },
  { score: 15,  percentile: 10.5000000 },
  { score: 10,  percentile: 7.5000000  },
  { score: 5,   percentile: 5.5000000  },
  { score: 0,   percentile: 4.0000000  },
  { score: -15, percentile: 2.0000000  },
  { score: -40, percentile: 0.8000000  },
  { score: -75, percentile: 0.0000000  },
];

// Single-subject table (out of 100). Derived from jeepredictor.in per-subject
// percentile data. Each subject in JEE Main is scored out of 100.
const BASE_TABLE_100: { score: number; percentile: number }[] = [
  { score: 100, percentile: 100.0000000 },
  { score: 98,  percentile: 99.9990000 },
  { score: 96,  percentile: 99.9960000 },
  { score: 94,  percentile: 99.9900000 },
  { score: 92,  percentile: 99.9800000 },
  { score: 90,  percentile: 99.9640000 },
  { score: 88,  percentile: 99.9400000 },
  { score: 86,  percentile: 99.9050000 },
  { score: 84,  percentile: 99.8600000 },
  { score: 82,  percentile: 99.8000000 },
  { score: 80,  percentile: 99.7200000 },
  { score: 78,  percentile: 99.6100000 },
  { score: 76,  percentile: 99.4700000 },
  { score: 74,  percentile: 99.2800000 },
  { score: 72,  percentile: 99.0500000 },
  { score: 70,  percentile: 98.7500000 },
  { score: 68,  percentile: 98.3800000 },
  { score: 66,  percentile: 97.9500000 },
  { score: 64,  percentile: 97.4500000 },
  { score: 62,  percentile: 96.8500000 },
  { score: 60,  percentile: 96.1500000 },
  { score: 58,  percentile: 95.3500000 },
  { score: 56,  percentile: 94.4500000 },
  { score: 54,  percentile: 93.4000000 },
  { score: 52,  percentile: 92.2500000 },
  { score: 50,  percentile: 91.0000000 },
  { score: 48,  percentile: 89.6000000 },
  { score: 46,  percentile: 88.1000000 },
  { score: 44,  percentile: 86.4000000 },
  { score: 42,  percentile: 84.6000000 },
  { score: 40,  percentile: 82.6000000 },
  { score: 38,  percentile: 80.5000000 },
  { score: 36,  percentile: 78.2000000 },
  { score: 34,  percentile: 75.7000000 },
  { score: 32,  percentile: 73.0000000 },
  { score: 30,  percentile: 70.1000000 },
  { score: 28,  percentile: 67.0000000 },
  { score: 26,  percentile: 63.6000000 },
  { score: 24,  percentile: 60.0000000 },
  { score: 22,  percentile: 56.2000000 },
  { score: 20,  percentile: 52.2000000 },
  { score: 18,  percentile: 48.0000000 },
  { score: 16,  percentile: 43.5000000 },
  { score: 14,  percentile: 38.8000000 },
  { score: 12,  percentile: 34.0000000 },
  { score: 10,  percentile: 29.0000000 },
  { score: 8,   percentile: 23.5000000 },
  { score: 6,   percentile: 18.5000000 },
  { score: 4,   percentile: 14.0000000 },
  { score: 2,   percentile: 10.5000000 },
  { score: 0,   percentile: 7.5000000  },
  { score: -5,  percentile: 4.0000000  },
  { score: -15, percentile: 1.5000000  },
  { score: -25, percentile: 0.0000000  },
];

// ─── Difficulty offset ────────────────────────────────────────────────────────
//
// Reflects NTA normalization: easier shifts require higher marks for the same
// percentile. Applied BEFORE lookup so the score is adjusted on the reference
// scale first.
//   effective_score = raw_on_scale - offset
//
// For a 100-point scale the offsets are /3 of the 300-point offsets.

const DIFFICULTY_OFFSET_300: Record<Difficulty, number> = {
  easy:     22,
  moderate: 0,
  tough:    -22,
};

const DIFFICULTY_OFFSET_100: Record<Difficulty, number> = {
  easy:     8,
  moderate: 0,
  tough:    -8,
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

function interpolate(
  score: number,
  table: { score: number; percentile: number }[],
  offset: number
): number {
  const adj = score - offset;
  const top = table[0];
  const bot = table[table.length - 1];

  if (adj >= top.score) return 100;
  if (adj <= bot.score) return 0;

  for (let i = 0; i < table.length - 1; i++) {
    const hi = table[i];
    const lo = table[i + 1];
    if (adj <= hi.score && adj >= lo.score) {
      const t = (adj - lo.score) / (hi.score - lo.score);
      const raw = lo.percentile + t * (hi.percentile - lo.percentile);
      return Math.round(raw * 10000000) / 10000000;
    }
  }
  return 0;
}

/** Scale any raw score from its own max to the JEE reference scale. */
function normalise(score: number, max: number, targetScale: number): number {
  if (max <= 0) return 0;
  return (score / max) * targetScale;
}

function estimateRank(percentile: number, totalCandidates = 1_550_000): number {
  return Math.max(1, Math.ceil(((100 - percentile) / 100) * totalCandidates) + 1);
}

function getCategory(rank: number): string {
  if (rank <= 500)    return "Top 500 — IIT Dream";
  if (rank <= 2500)   return "Top 2500 — IIT Ready";
  if (rank <= 10000)  return "Top 10K — IIT Possible";
  if (rank <= 25000)  return "Top 25K — NIT Excellence";
  if (rank <= 50000)  return "Top 50K — NIT Strong";
  if (rank <= 100000) return "Top 1L — NIT Likely";
  if (rank <= 200000) return "Top 2L — IIIT / State";
  if (rank <= 500000) return "Top 5L — Keep Improving";
  return "Needs More Practice";
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function calculatePercentile(
  scores: SubjectScores,
  difficulty: Difficulty,
  paperType: PaperType
): PercentileResult {
  const dOff300 = DIFFICULTY_OFFSET_300[difficulty];
  const dOff100 = DIFFICULTY_OFFSET_100[difficulty];

  // Always compute all three subject percentiles (on 100-scale)
  const pPct = interpolate(normalise(scores.physics,     scores.physicsMax,     100), BASE_TABLE_100, dOff100);
  const cPct = interpolate(normalise(scores.chemistry,   scores.chemistryMax,   100), BASE_TABLE_100, dOff100);
  const mPct = interpolate(normalise(scores.mathematics, scores.mathematicsMax, 100), BASE_TABLE_100, dOff100);

  let totalRaw: number;
  let totalMax: number;
  let totalPercentile: number;
  let breakdown: PercentileResult["breakdown"];

  if (paperType === "pcm") {
    totalRaw = scores.physics + scores.chemistry + scores.mathematics;
    totalMax = scores.physicsMax + scores.chemistryMax + scores.mathematicsMax;
    const norm300 = normalise(totalRaw, totalMax, 300);
    totalPercentile = interpolate(norm300, BASE_TABLE_300, dOff300);
    breakdown = [
      { label: "Physics",     raw: scores.physics,     max: scores.physicsMax,     percentile: pPct, color: "#3b82f6" },
      { label: "Chemistry",   raw: scores.chemistry,   max: scores.chemistryMax,   percentile: cPct, color: "#10b981" },
      { label: "Mathematics", raw: scores.mathematics, max: scores.mathematicsMax, percentile: mPct, color: "#f59e0b" },
    ];
  } else if (paperType === "physics") {
    totalRaw = scores.physics;
    totalMax = scores.physicsMax;
    totalPercentile = pPct;
    breakdown = [{ label: "Physics", raw: scores.physics, max: scores.physicsMax, percentile: pPct, color: "#3b82f6" }];
  } else if (paperType === "chemistry") {
    totalRaw = scores.chemistry;
    totalMax = scores.chemistryMax;
    totalPercentile = cPct;
    breakdown = [{ label: "Chemistry", raw: scores.chemistry, max: scores.chemistryMax, percentile: cPct, color: "#10b981" }];
  } else {
    // mathematics
    totalRaw = scores.mathematics;
    totalMax = scores.mathematicsMax;
    totalPercentile = mPct;
    breakdown = [{ label: "Mathematics", raw: scores.mathematics, max: scores.mathematicsMax, percentile: mPct, color: "#f59e0b" }];
  }

  const estimatedRank = estimateRank(totalPercentile);
  const category = getCategory(estimatedRank);

  return {
    physicsPercentile: pPct,
    chemistryPercentile: cPct,
    mathematicsPercentile: mPct,
    totalPercentile,
    totalRaw,
    totalMax,
    estimatedRank,
    category,
    paperType,
    breakdown,
  };
}
