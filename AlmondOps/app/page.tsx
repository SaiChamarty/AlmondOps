"use client";

import { useState } from "react";
import { FormCard } from "@/components/FormCard";
import { ReportCard } from "@/components/ReportCard";
import {
  apiResponseSchema,
  type DataReport,
  type RiskReportApiResponse,
  type RiskReportRequest,
} from "@/lib/schema";

type ChatMessage = {
  role: "system" | "user";
  text: string;
};

export default function HomePage() {
  const [dataReport, setDataReport] = useState<DataReport | null>(null);
  const [apiMeta, setApiMeta] = useState<{ jsonFilePath: string; provider: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runReport(payload: RiskReportRequest) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/risk-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to generate report");
      }

      const parsed = apiResponseSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error("Received an invalid report format");
      }

      const typed = parsed.data as RiskReportApiResponse;
      setDataReport(typed.dataReport);
      setApiMeta({ jsonFilePath: typed.jsonFilePath, provider: typed.provider });
      setChatMessages((prev) => [
        ...prev,
        { role: "system", text: typed.chatMessage },
        { role: "system", text: "You can now ask follow-up questions in the box below." },
      ]);
    } catch (error) {
      const fallback =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(fallback);
    } finally {
      setIsLoading(false);
    }
  }

  function submitFollowUp() {
    const text = followUpInput.trim();
    if (!text) return;

    setChatMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "system",
        text: "Follow-up captured. (LLM answering is not enabled yet. JSON data is ready for later model use.)",
      },
    ]);
    setFollowUpInput("");
  }

  function resetForRunAgain() {
    setDataReport(null);
    setApiMeta(null);
    setErrorMessage(null);
    setChatMessages([]);
    setFollowUpInput("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Almond Risk Report (72 hours)
          </h1>
          <p className="text-lg text-slate-700">One click → clear actions for the next 72 hours</p>
        </header>

        <FormCard isLoading={isLoading} errorMessage={errorMessage} onSubmit={runReport} />

        {dataReport && apiMeta && (
          <ReportCard
            dataReport={dataReport}
            jsonFilePath={apiMeta.jsonFilePath}
            provider={apiMeta.provider}
            onRunAgain={resetForRunAgain}
          />
        )}

        {dataReport && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <h2 className="text-2xl font-bold text-slate-900">Report Chat</h2>
            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "ml-8 bg-orchard text-white"
                      : "mr-8 border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <input
                value={followUpInput}
                onChange={(event) => setFollowUpInput(event.target.value)}
                placeholder="Ask a follow-up question"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
              />
              <button
                type="button"
                onClick={submitFollowUp}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-800 hover:bg-slate-100"
              >
                Send
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
