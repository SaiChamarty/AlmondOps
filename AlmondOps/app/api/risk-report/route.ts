import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { presetLocationDetails } from "@/lib/locations";
import { riskReportRequestSchema } from "@/lib/schema";

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

function locationForRequest(locationPreset: string, customLocation?: string): {
  label: string;
  lat: number | null;
  lon: number | null;
  source: string;
  status: "WORKING" | "NOT_WORKING";
  detail: string;
} {
  if (locationPreset !== "Custom") {
    const details = presetLocationDetails[locationPreset as keyof typeof presetLocationDetails];
    return {
      label: details.label,
      lat: details.lat,
      lon: details.lon,
      source: "preset",
      status: "WORKING",
      detail: "Preset location resolved to fixed coordinates.",
    };
  }

  return {
    label: customLocation || "Custom location",
    lat: null,
    lon: null,
    source: "custom-unresolved",
    status: "NOT_WORKING",
    detail: "Custom location geocoding is not implemented yet.",
  };
}

async function fetchWeatherData(lat: number, lon: number): Promise<{
  provider: string;
  fetchedAt: string | null;
  httpStatus: number | null;
  timezone: string | null;
  hourlyAvailable: {
    temperature2m: boolean;
    relativeHumidity2m: boolean;
    precipitation: boolean;
    windSpeed10m: boolean;
  };
  sample: {
    minTempC: number;
    maxTempC: number;
    maxWindKph: number;
    maxHumidityPct: number;
    precipTotalMm: number;
  } | null;
  status: "WORKING" | "NOT_WORKING";
  detail: string;
}> {
  const now = new Date();

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&forecast_days=3&timezone=America%2FLos_Angeles`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return {
        provider: "open-meteo",
        fetchedAt: now.toISOString(),
        httpStatus: response.status,
        timezone: null,
        hourlyAvailable: {
          temperature2m: false,
          relativeHumidity2m: false,
          precipitation: false,
          windSpeed10m: false,
        },
        sample: null,
        status: "NOT_WORKING",
        detail: `Provider request failed with HTTP ${response.status}.`,
      };
    }

    const data = await response.json();
    const hourly = data?.hourly;
    const temperatures = Array.isArray(hourly?.temperature_2m) ? hourly.temperature_2m : [];
    const humidity = Array.isArray(hourly?.relative_humidity_2m) ? hourly.relative_humidity_2m : [];
    const precipitation = Array.isArray(hourly?.precipitation) ? hourly.precipitation : [];
    const wind = Array.isArray(hourly?.wind_speed_10m) ? hourly.wind_speed_10m : [];

    const hasTemps = temperatures.length > 0;
    const hasHumidity = humidity.length > 0;
    const hasPrecip = precipitation.length > 0;
    const hasWind = wind.length > 0;
    const allArraysPresent = hasTemps && hasHumidity && hasPrecip && hasWind;

    return {
      provider: "open-meteo",
      fetchedAt: now.toISOString(),
      httpStatus: response.status,
      timezone: typeof data?.timezone === "string" ? data.timezone : null,
      hourlyAvailable: {
        temperature2m: hasTemps,
        relativeHumidity2m: hasHumidity,
        precipitation: hasPrecip,
        windSpeed10m: hasWind,
      },
      sample: allArraysPresent
        ? {
            minTempC: Math.min(...temperatures),
            maxTempC: Math.max(...temperatures),
            maxWindKph: Math.max(...wind),
            maxHumidityPct: Math.max(...humidity),
            precipTotalMm: precipitation.reduce((sum: number, value: number) => sum + value, 0),
          }
        : null,
      status: allArraysPresent ? "WORKING" : "NOT_WORKING",
      detail: allArraysPresent
        ? "Provider data fetched successfully."
        : "Provider response is missing one or more required hourly arrays.",
    };
  } catch {
    return {
      provider: "open-meteo",
      fetchedAt: now.toISOString(),
      httpStatus: null,
      timezone: null,
      hourlyAvailable: {
        temperature2m: false,
        relativeHumidity2m: false,
        precipitation: false,
        windSpeed10m: false,
      },
      sample: null,
      status: "NOT_WORKING",
      detail: "Provider request failed before a valid response was received.",
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = riskReportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const location = locationForRequest(parsed.data.locationPreset, parsed.data.customLocation);
    const weatherData =
      location.status === "WORKING" && location.lat !== null && location.lon !== null
        ? await fetchWeatherData(location.lat, location.lon)
        : {
            provider: "open-meteo",
            fetchedAt: null,
            httpStatus: null,
            timezone: null,
            hourlyAvailable: {
              temperature2m: false,
              relativeHumidity2m: false,
              precipitation: false,
              windSpeed10m: false,
            },
            sample: null,
            status: "SKIPPED" as const,
            detail: "Provider fetch skipped because location could not be resolved.",
          };

    const dataReport = {
      meta: {
        generatedAtLocal: formatLocal(new Date()),
        locationLabel: location.label,
        stage: parsed.data.stage,
        horizonHours: 72,
      },
      backend: {
        inputValidation: {
          status: "WORKING" as const,
          detail: "Request payload passed schema validation.",
        },
        locationResolution: {
          status: location.status,
          detail: location.detail,
        },
        providerFetch: {
          status: weatherData.status,
          detail: weatherData.detail,
          provider: weatherData.provider,
          httpStatus: weatherData.httpStatus,
        },
        dataPersistence: {
          status: "WORKING" as const,
          detail: "Data report prepared and ready to persist.",
        },
        riskAnalysis: {
          status: "SKIPPED" as const,
          detail: "Risk analysis intentionally not run; provider data only.",
        },
      },
      providerData: {
        weather: {
          provider: weatherData.provider,
          fetchedAt: weatherData.fetchedAt,
          latitude: location.lat,
          longitude: location.lon,
          timezone: weatherData.timezone,
          hourlyAvailable: weatherData.hourlyAvailable,
          sample: weatherData.sample,
          note:
            weatherData.status === "WORKING"
              ? null
              : "Only provider facts are included; no fallback analysis data was generated.",
        },
      },
    };

    const artifact = {
      input: parsed.data,
      location,
      provider: weatherData.provider,
      dataReport,
      createdAt: new Date().toISOString(),
    };

    const dir = path.join(process.cwd(), "data");
    await fs.mkdir(dir, { recursive: true });

    const filename = `risk-report-${Date.now()}.json`;
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, JSON.stringify(artifact, null, 2), "utf8");

    dataReport.backend.dataPersistence = {
      status: "WORKING",
      detail: `Data report persisted to data/${filename}.`,
    };

    return NextResponse.json({
      created: true,
      jsonFilePath: `data/${filename}`,
      provider: weatherData.provider,
      chatMessage: `JSON file created: data/${filename}`,
      dataReport,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to generate report",
      },
      { status: 500 },
    );
  }
}
