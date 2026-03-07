// https://stackoverflow.com/questions/39494689/is-it-possible-to-restrict-number-to-a-certain-range

import type { StoreSlug } from "./stores";

import { tableNumbers } from "@/constants/tableNumbers";

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<F extends number, T extends number> =
  | Exclude<Enumerate<T>, Enumerate<F>>
  | T;

export type TableNumber = {
  [Store in StoreSlug]: `${IntRange<1, (typeof tableNumbers)[Store]>}`;
}[StoreSlug];
