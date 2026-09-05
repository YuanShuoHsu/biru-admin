import type { BaseUnitCode, UnitCode } from "@/types/inventory";

export const UNIT_FACTORS: Record<UnitCode, number> = {
  GRM: 1,
  H87: 1,
  KGM: 1000,
  LTR: 1000,
  MLT: 1,
};

export const BASE_UNIT_CODES: Record<UnitCode, BaseUnitCode> = {
  GRM: "GRM",
  H87: "H87",
  KGM: "GRM",
  LTR: "MLT",
  MLT: "MLT",
};
