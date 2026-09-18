export const BASE_SIZE = 112;
export const KNOB_SIZE = 48;
export const JUMP_SIZE = 64;

export const TRAVEL = (BASE_SIZE - KNOB_SIZE) / 2;

export const joystickVector = (dx: number, dy: number) => {
  const distance = Math.hypot(dx, dy);
  const limit = distance > TRAVEL ? TRAVEL / distance : 1;

  return { x: (dx * limit) / TRAVEL, y: (dy * limit) / TRAVEL };
};
