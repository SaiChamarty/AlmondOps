import { z } from "zod";
import { locationPresets } from "@/lib/locations";

export const stageOptions = [
  "Dormant",
  "Bloom",
  "Petal Fall",
  "Nut Fill",
  "Hull Split",
] as const;

export const hazardOptions = [
  "FROST",
  "BLOOM_RAIN_WIND",
  "DISEASE_PRESSURE",
  "HEAT",
] as const;

export const riskLevels = ["LOW", "MEDIUM", "HIGH"] as const;
export const backendStatusLevels = ["WORKING", "NOT_WORKING", "SKIPPED"] as const;

export const riskReportRequestSchema = z
  .object({
    locationPreset: z.enum(locationPresets),
    customLocation: z.string().trim().optional(),
    stage: z.enum(stageOptions),
    hazardFocus: z.object({
      frost: z.boolean(),
      heat: z.boolean(),
      insects: z.boolean(),
    }),
  })
  .refine(
    (data) => {
      if (data.locationPreset !== "Custom") return true;
      return Boolean(data.customLocation && data.customLocation.trim().length > 0);
    },
    {
      message: "Custom location is required when Custom is selected",
      path: ["customLocation"],
    },
  )
  .refine(
    (data) => data.hazardFocus.frost || data.hazardFocus.heat || data.hazardFocus.insects,
    {
      message: "Select at least one hazard checkbox",
      path: ["hazardFocus"],
    },
  );

export const backendComponentStatusSchema = z.object({
  status: z.enum(backendStatusLevels),
  detail: z.string(),
});

export const dataReportSchema = z.object({
  meta: z.object({
    generatedAtLocal: z.string(),
    locationLabel: z.string(),
    stage: z.enum(stageOptions),
    horizonHours: z.number(),
  }),
  backend: z.object({
    inputValidation: backendComponentStatusSchema,
    locationResolution: backendComponentStatusSchema,
    providerFetch: backendComponentStatusSchema.extend({
      provider: z.string(),
      httpStatus: z.number().nullable(),
    }),
    dataPersistence: backendComponentStatusSchema,
    riskAnalysis: backendComponentStatusSchema,
  }),
  providerData: z.object({
    weather: z.object({
      provider: z.string(),
      fetchedAt: z.string().nullable(),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      timezone: z.string().nullable(),
      hourlyAvailable: z.object({
        temperature2m: z.boolean(),
        relativeHumidity2m: z.boolean(),
        precipitation: z.boolean(),
        windSpeed10m: z.boolean(),
      }),
      sample: z
        .object({
          minTempC: z.number(),
          maxTempC: z.number(),
          maxWindKph: z.number(),
          maxHumidityPct: z.number(),
          precipTotalMm: z.number(),
        })
        .nullable(),
      note: z.string().nullable(),
    }),
  }),
});

export const riskReportSchema = z.object({
  meta: z.object({
    generatedAtLocal: z.string(),
    locationLabel: z.string(),
    stage: z.enum(stageOptions),
    horizonHours: z.number(),
  }),
  topRisks: z.array(
    z.object({
      hazard: z.enum(hazardOptions),
      riskLevel: z.enum(riskLevels),
      window: z.object({
        startLocal: z.string(),
        endLocal: z.string(),
      }),
      why: z.array(z.string()),
    }),
  ),
  actionPlan: z.object({
    before: z.array(
      z.object({
        title: z.string(),
        details: z.string(),
      }),
    ),
    during: z.array(
      z.object({
        title: z.string(),
        details: z.string(),
      }),
    ),
    after: z.array(
      z.object({
        title: z.string(),
        details: z.string(),
      }),
    ),
  }),
  assumptions: z.array(z.string()),
  disclaimer: z.string(),
});

export const apiResponseSchema = z.object({
  created: z.literal(true),
  jsonFilePath: z.string(),
  provider: z.string(),
  dataReport: dataReportSchema,
  chatMessage: z.string(),
});

export type RiskReportRequest = z.infer<typeof riskReportRequestSchema>;
export type DataReport = z.infer<typeof dataReportSchema>;
export type RiskReport = z.infer<typeof riskReportSchema>;
export type Hazard = (typeof hazardOptions)[number];
export type RiskLevel = (typeof riskLevels)[number];
export type RiskReportApiResponse = z.infer<typeof apiResponseSchema>;
