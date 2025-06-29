type ExtractKeys<T extends string> =
  T extends `${string}{${infer K}}${infer Rest}`
    ? K | ExtractKeys<Rest>
    : never;

export const interpolate = <
  T extends string,
  V extends Record<ExtractKeys<T>, string | number>,
>(
  template: T,
  values: V,
): string =>
  template.replace(/\{(\w+)\}/g, (_, key) =>
    key in values ? String(values[key as keyof V]) : `{${key}}`,
  );
