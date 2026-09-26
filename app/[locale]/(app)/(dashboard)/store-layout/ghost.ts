export const ghostSurface = (ghost: boolean) => ({
  depthWrite: !ghost,
  opacity: ghost ? 0.06 : 1,
  transparent: ghost,
});

export const ghostEdge = (ghost: boolean) => ({
  depthWrite: !ghost,
  opacity: ghost ? 0.4 : 1,
  transparent: ghost,
});
