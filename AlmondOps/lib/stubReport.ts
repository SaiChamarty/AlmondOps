import {
  type Hazard,
  type RiskLevel,
  type RiskReport,
  type RiskReportRequest,
} from "@/lib/schema";

type HazardSignals = {
  frostSignal: RiskLevel;
  heatSignal: RiskLevel;
  insectSignal: RiskLevel;
  rainWindSignal: RiskLevel;
  windows: {
    frostStart: Date;
    frostEnd: Date;
    heatStart: Date;
    heatEnd: Date;
    rainWindStart: Date;
    rainWindEnd: Date;
  };
};

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatLocal(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${lookup("year")}-${lookup("month")}-${lookup("day")} ${lookup("hour")}:${lookup(
    "minute",
  )}`;
}

function makeRisk(
  hazard: Hazard,
  riskLevel: RiskLevel,
  start: Date,
  end: Date,
  why: string[],
) {
  return {
    hazard,
    riskLevel,
    window: {
      startLocal: formatLocal(start),
      endLocal: formatLocal(end),
    },
    why,
  };
}

export function buildFallbackSignals(now: Date): HazardSignals {
  const hourSeed = now.getHours();
  const frostSignal: RiskLevel = hourSeed % 3 === 0 ? "HIGH" : "MEDIUM";
  const heatSignal: RiskLevel = hourSeed % 3 === 1 ? "HIGH" : "MEDIUM";

  return {
    frostSignal,
    heatSignal,
    insectSignal: "MEDIUM",
    rainWindSignal: "MEDIUM",
    windows: {
      frostStart: addHours(now, 7),
      frostEnd: addHours(now, 13),
      heatStart: addHours(now, 30),
      heatEnd: addHours(now, 38),
      rainWindStart: addHours(now, 10),
      rainWindEnd: addHours(now, 16),
    },
  };
}

function priorityValue(level: RiskLevel) {
  if (level === "HIGH") return 3;
  if (level === "MEDIUM") return 2;
  return 1;
}

function resolveLocationLabel(payload: RiskReportRequest) {
  if (payload.locationPreset === "Custom") {
    return payload.customLocation?.trim() || "Custom location, CA";
  }
  return `${payload.locationPreset}, CA`;
}

export function generateStubReport(payload: RiskReportRequest, signals: HazardSignals): RiskReport {
  const now = new Date();
  const locationLabel = resolveLocationLabel(payload);
  const { stage, hazardFocus } = payload;

  const riskCandidates: RiskReport["topRisks"] = [];

  if (hazardFocus.frost) {
    riskCandidates.push(
      makeRisk("FROST", signals.frostSignal, signals.windows.frostStart, signals.windows.frostEnd, [
        "Overnight low-temperature risk detected for orchard blocks.",
        "Low spots and calm periods increase frost exposure.",
      ]),
    );
  }

  if (stage === "Bloom" && (hazardFocus.frost || hazardFocus.insects)) {
    riskCandidates.push(
      makeRisk(
        "BLOOM_RAIN_WIND",
        signals.rainWindSignal,
        signals.windows.rainWindStart,
        signals.windows.rainWindEnd,
        [
          "Bloom-stage flowers are sensitive to rain and wind disruptions.",
          "Pollination efficiency can drop during unstable bloom weather.",
        ],
      ),
    );
  }

  if (hazardFocus.insects) {
    riskCandidates.push(
      makeRisk("DISEASE_PRESSURE", signals.insectSignal, addHours(now, 20), addHours(now, 52), [
        "Warm, humid windows can increase pest and disease pressure.",
        "Scouting high-risk blocks early can reduce spread impact.",
      ]),
    );
  }

  if (stage === "Nut Fill" || stage === "Hull Split" || hazardFocus.heat) {
    riskCandidates.push(
      makeRisk("HEAT", signals.heatSignal, signals.windows.heatStart, signals.windows.heatEnd, [
        "Heat stress can reduce nut development during warm periods.",
        "Canopy cooling and timing of operations are critical.",
      ]),
    );
  }

  const topRisks = riskCandidates
    .sort((a, b) => priorityValue(b.riskLevel) - priorityValue(a.riskLevel))
    .slice(0, 2);

  if (topRisks.length === 0) {
    topRisks.push(
      makeRisk("FROST", "LOW", addHours(now, 12), addHours(now, 18), [
        "No major hazard selected; showing low baseline overnight risk.",
        "Keep routine monitoring active for rapid changes.",
      ]),
    );
  }

  const before: RiskReport["actionPlan"]["before"] = [
    {
      title: "Confirm priority blocks",
      details: "Flag vulnerable rows first so actions are focused where losses are most likely.",
    },
    {
      title: "Set trigger checkpoints",
      details: "Review conditions every 1-2 hours during identified risk windows.",
    },
  ];

  const during: RiskReport["actionPlan"]["during"] = [
    {
      title: "Execute risk-window actions",
      details: "Apply mitigation by hazard type and keep a timestamped action log.",
    },
    {
      title: "Watch microclimate variation",
      details: "Adjust by block rather than relying on one whole-farm average signal.",
    },
  ];

  const after: RiskReport["actionPlan"]["after"] = [
    {
      title: "Morning inspection pass",
      details: "Inspect representative rows early and capture observations for follow-up decisions.",
    },
    {
      title: "Prepare next-cycle adjustments",
      details: "Update task timing for the next day based on observed orchard response.",
    },
  ];

  if (stage === "Bloom") {
    during.push({
      title: "Protect pollination windows",
      details: "Minimize disruptive operations during key pollinator activity periods.",
    });
  }

  const assumptions = [
    "Weather signals are from backend provider fetch with fallback to deterministic local stubs.",
    "Times are formatted in America/Los_Angeles local time.",
    `Selected hazard focus: ${Object.entries(hazardFocus)
      .filter(([, value]) => value)
      .map(([key]) => key)
      .join(", ")}`,
  ];

  return {
    meta: {
      generatedAtLocal: formatLocal(now),
      locationLabel,
      stage,
      horizonHours: 72,
    },
    topRisks,
    actionPlan: {
      before,
      during,
      after,
    },
    assumptions,
    disclaimer:
      "Prototype output for planning support. Validate decisions with local agronomy and operational judgment.",
  };
}

export type { HazardSignals };
