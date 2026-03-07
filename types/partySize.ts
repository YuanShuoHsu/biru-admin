import { PARTY_SIZE_MAX } from "@/constants/partySize";

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<F extends number, T extends number> =
  | Exclude<Enumerate<T>, Enumerate<F>>
  | T;

export type PartySize = `${IntRange<1, typeof PARTY_SIZE_MAX>}`;
