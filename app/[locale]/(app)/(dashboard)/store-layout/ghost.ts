const GHOST_SURFACE_OPACITY = 0.06;
const GHOST_EDGE_OPACITY = 0.1;

export const ghostSurface = (ghost: boolean) => ({
  depthWrite: !ghost,
  opacity: ghost ? GHOST_SURFACE_OPACITY : 1,
  transparent: ghost,
});

export const ghostEdge = (ghost: boolean) => ({
  depthWrite: !ghost,
  opacity: ghost ? GHOST_EDGE_OPACITY : 1,
  transparent: ghost,
});
