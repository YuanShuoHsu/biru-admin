export const getDailyBuckets = (
  createdAts: (string | Date)[],
  days: number,
  endDate = new Date(),
): number[] => {
  const buckets = Array(days).fill(0);
  const end = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  );

  for (const createdAt of createdAts) {
    const date = new Date(createdAt);
    const day = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
    const diffDays = Math.round((end - day) / 86_400_000);
    const index = days - 1 - diffDays;

    if (index >= 0 && index < days) buckets[index] += 1;
  }

  return buckets;
};

export const getTrendPercent = (buckets: number[]): number => {
  const half = Math.floor(buckets.length / 2);
  const prev = buckets.slice(0, half).reduce((sum, n) => sum + n, 0);
  const recent = buckets.slice(half).reduce((sum, n) => sum + n, 0);

  if (prev === 0) return recent > 0 ? 100 : 0;

  return Math.round(((recent - prev) / prev) * 100);
};
