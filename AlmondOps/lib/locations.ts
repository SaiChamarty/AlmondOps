export const locationPresets = [
  "Davis",
  "Fresno Area",
  "Kern (Bakersfield) Area",
  "Stanislaus (Modesto) Area",
  "Merced Area",
  "Madera Area",
  "Custom",
] as const;

export type LocationPreset = (typeof locationPresets)[number];

export type LocationDetails = {
  label: string;
  lat: number;
  lon: number;
  sourceNote: string;
};

export const presetLocationDetails: Record<Exclude<LocationPreset, "Custom">, LocationDetails> = {
  Davis: {
    label: "Davis, CA",
    lat: 38.5449,
    lon: -121.7405,
    sourceNote: "Added as requested",
  },
  "Fresno Area": {
    label: "Fresno County, CA",
    lat: 36.7378,
    lon: -119.7871,
    sourceNote: "Top almond county by value",
  },
  "Kern (Bakersfield) Area": {
    label: "Kern County (Bakersfield), CA",
    lat: 35.3733,
    lon: -119.0187,
    sourceNote: "Top almond county by value",
  },
  "Stanislaus (Modesto) Area": {
    label: "Stanislaus County (Modesto), CA",
    lat: 37.6391,
    lon: -120.9969,
    sourceNote: "Top almond county by value",
  },
  "Merced Area": {
    label: "Merced County, CA",
    lat: 37.3022,
    lon: -120.4820,
    sourceNote: "Top almond county by value",
  },
  "Madera Area": {
    label: "Madera County, CA",
    lat: 36.9613,
    lon: -120.0607,
    sourceNote: "Top almond county by value",
  },
};
