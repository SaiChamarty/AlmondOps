"use client";

import { useState, type FormEvent } from "react";
import { locationPresets } from "@/lib/locations";
import { stageOptions, type RiskReportRequest } from "@/lib/schema";

type FormCardProps = {
  isLoading: boolean;
  errorMessage: string | null;
  onSubmit: (payload: RiskReportRequest) => Promise<void>;
};

export function FormCard({ isLoading, errorMessage, onSubmit }: FormCardProps) {
  const [locationPreset, setLocationPreset] = useState<(typeof locationPresets)[number]>("Davis");
  const [customLocation, setCustomLocation] = useState("");
  const [stage, setStage] = useState<(typeof stageOptions)[number]>("Bloom");
  const [hazardFocus, setHazardFocus] = useState({
    frost: true,
    heat: true,
    insects: true,
  });

  async function handleRunRiskReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      locationPreset,
      customLocation: customLocation.trim() || undefined,
      stage,
      hazardFocus,
    });
  }

  function toggleHazard(key: keyof typeof hazardFocus) {
    setHazardFocus((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <form onSubmit={handleRunRiskReport} className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quick Inputs</h2>
          <p className="text-sm text-slate-600">4 fast questions before running the report.</p>
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-slate-900">1) Crop stage</label>
          <select
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900"
            value={stage}
            onChange={(e) => setStage(e.target.value as (typeof stageOptions)[number])}
          >
            {stageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-slate-900">2) Location</label>
          <select
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900"
            value={locationPreset}
            onChange={(e) => setLocationPreset(e.target.value as (typeof locationPresets)[number])}
          >
            {locationPresets.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          {locationPreset === "Custom" && (
            <input
              className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900"
              placeholder="City or ZIP"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
            />
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className="text-base font-semibold text-slate-900">3) Hazard focus (checkboxes)</legend>
          <label className="flex items-center gap-3 text-base text-slate-800">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300"
              checked={hazardFocus.frost}
              onChange={() => toggleHazard("frost")}
            />
            Frost
          </label>
          <label className="flex items-center gap-3 text-base text-slate-800">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300"
              checked={hazardFocus.heat}
              onChange={() => toggleHazard("heat")}
            />
            Heat
          </label>
          <label className="flex items-center gap-3 text-base text-slate-800">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300"
              checked={hazardFocus.insects}
              onChange={() => toggleHazard("insects")}
            />
            Insects / disease pressure
          </label>
        </fieldset>

        <p className="text-sm text-slate-600">4) Click run to generate backend JSON + report.</p>

        {errorMessage && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-orchard px-5 py-4 text-xl font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-600"
        >
          {isLoading ? "Generating report..." : "Run Report"}
        </button>
      </form>
    </section>
  );
}
