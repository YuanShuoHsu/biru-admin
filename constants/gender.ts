enum GenderEnum {
  Female = "FEMALE",
  Male = "MALE",
  Other = "OTHER",
}

type GenderLabel = "female" | "male" | "other";

export const GENDER_LABELS: Record<GenderEnum, GenderLabel> = {
  [GenderEnum.Female]: "female",
  [GenderEnum.Male]: "male",
  [GenderEnum.Other]: "other",
};

export const GENDER_VALUES = [
  GenderEnum.Female,
  GenderEnum.Male,
  GenderEnum.Other,
] as const;
