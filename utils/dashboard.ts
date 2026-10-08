export const getChangePercent = (prev: number, recent: number): number => {
  if (prev === 0) return recent > 0 ? 100 : 0;

  return Math.round(((recent - prev) / prev) * 100);
};
