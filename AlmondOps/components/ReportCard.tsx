import type { DataReport } from "@/lib/schema";

type ReportCardProps = {
  dataReport: DataReport;
  jsonFilePath: string;
  provider: string;
  onRunAgain: () => void;
};

function statusClass(level: DataReport["backend"]["inputValidation"]["status"]) {
  if (level === "WORKING") return "bg-emerald-100 text-emerald-800";
  if (level === "NOT_WORKING") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

export function ReportCard({ dataReport, jsonFilePath, provider, onRunAgain }: ReportCardProps) {
  const backendRows: Array<{
    key: string;
    value: DataReport["backend"]["inputValidation"];
    provider?: string;
    httpStatus?: number | null;
  }> = [
    { key: "Input validation", value: dataReport.backend.inputValidation },
    { key: "Location resolution", value: dataReport.backend.locationResolution },
    {
      key: "Provider fetch",
      value: dataReport.backend.providerFetch,
      provider: dataReport.backend.providerFetch.provider,
      httpStatus: dataReport.backend.providerFetch.httpStatus,
    },
    { key: "Data persistence", value: dataReport.backend.dataPersistence },
    { key: "Risk analysis", value: dataReport.backend.riskAnalysis },
  ];

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm md:p-7">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Backend Data Report (next 72 hours)</h2>
        <p className="text-sm text-slate-600">
          Generated {dataReport.meta.generatedAtLocal} for {dataReport.meta.locationLabel} (
          {dataReport.meta.stage})
        </p>
        <p className="text-sm text-slate-700">
          Provider: <span className="font-semibold">{provider}</span> | JSON file: <span className="font-semibold">{jsonFilePath}</span>
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-bold text-slate-900">Backend status</h3>
        <div className="mt-3 space-y-3">
          {backendRows.map((row) => (
            <div key={row.key} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{row.key}</p>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClass(row.value.status)}`}>
                  {row.value.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{row.value.detail}</p>
              {row.provider && (
                <p className="mt-1 text-xs text-slate-600">
                  provider: {row.provider}, httpStatus: {row.httpStatus === null ? "n/a" : row.httpStatus}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-bold text-slate-900">Provider data (factual only)</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
          <li>Fetched at: {dataReport.providerData.weather.fetchedAt ?? "n/a"}</li>
          <li>Timezone: {dataReport.providerData.weather.timezone ?? "n/a"}</li>
          <li>
            Coordinates: {dataReport.providerData.weather.latitude ?? "n/a"},{" "}
            {dataReport.providerData.weather.longitude ?? "n/a"}
          </li>
          <li>
            Hourly arrays available:
            {` temp=${String(dataReport.providerData.weather.hourlyAvailable.temperature2m)}, humidity=${String(dataReport.providerData.weather.hourlyAvailable.relativeHumidity2m)}, precip=${String(dataReport.providerData.weather.hourlyAvailable.precipitation)}, wind=${String(dataReport.providerData.weather.hourlyAvailable.windSpeed10m)}`}
          </li>
          <li>
            Sample:{" "}
            {dataReport.providerData.weather.sample
              ? `minTempC=${dataReport.providerData.weather.sample.minTempC}, maxTempC=${dataReport.providerData.weather.sample.maxTempC}, maxWindKph=${dataReport.providerData.weather.sample.maxWindKph}, maxHumidityPct=${dataReport.providerData.weather.sample.maxHumidityPct}, precipTotalMm=${dataReport.providerData.weather.sample.precipTotalMm}`
              : "n/a"}
          </li>
          {dataReport.providerData.weather.note && <li>{dataReport.providerData.weather.note}</li>}
        </ul>
      </section>

      <button
        type="button"
        onClick={onRunAgain}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-base font-semibold text-slate-800 hover:bg-slate-100"
      >
        Run again
      </button>
    </section>
  );
}
