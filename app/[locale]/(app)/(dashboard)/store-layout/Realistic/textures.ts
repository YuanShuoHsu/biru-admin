import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

const SIZE = 1024;

const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

const paint = (
  draw: (ctx: CanvasRenderingContext2D, random: () => number) => void,
  seed: number,
  meters = 1,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, seeded(seed));

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  texture.repeat.set(1 / meters, 1 / meters);

  return texture;
};

const grain = (
  ctx: CanvasRenderingContext2D,
  random: () => number,
  x: number,
  y: number,
  width: number,
  height: number,
  lines: number,
) => {
  for (let line = 0; line < lines; line += 1) {
    const offset = y + random() * height;
    const wave = 1 + random() * 3;

    ctx.strokeStyle = `rgba(60, 35, 15, ${0.05 + random() * 0.12})`;
    ctx.lineWidth = 0.5 + random() * 1.5;
    ctx.beginPath();
    for (let step = 0; step <= width; step += 16)
      ctx[step ? "lineTo" : "moveTo"](
        x + step,
        offset + Math.sin((step / width) * Math.PI * wave) * 3,
      );
    ctx.stroke();
  }
};

const PLANK_ROWS = 8;

const drawPlanks = (ctx: CanvasRenderingContext2D, random: () => number) => {
  const rowHeight = SIZE / PLANK_ROWS;

  for (let row = 0; row < PLANK_ROWS; row += 1) {
    let x = -random() * SIZE * 0.5;

    while (x < SIZE) {
      const length = SIZE * (0.35 + random() * 0.4);
      const tone = 150 + random() * 40;

      ctx.fillStyle = `rgb(${tone}, ${tone * 0.72}, ${tone * 0.48})`;
      ctx.fillRect(x, row * rowHeight, length, rowHeight);
      grain(ctx, random, x, row * rowHeight, length, rowHeight, 10);
      ctx.fillStyle = "rgba(40, 25, 12, 0.55)";
      ctx.fillRect(x, row * rowHeight, 2, rowHeight);
      x += length;
    }

    ctx.fillStyle = "rgba(40, 25, 12, 0.55)";
    ctx.fillRect(0, row * rowHeight, SIZE, 2);
  }
};

const TILE_COUNT = 4;

const drawTiles = (ctx: CanvasRenderingContext2D, random: () => number) => {
  const tile = SIZE / TILE_COUNT;

  ctx.fillStyle = "rgb(120, 120, 116)";
  ctx.fillRect(0, 0, SIZE, SIZE);

  for (let row = 0; row < TILE_COUNT; row += 1)
    for (let column = 0; column < TILE_COUNT; column += 1) {
      const tone = 185 + random() * 15;

      ctx.fillStyle = `rgb(${tone}, ${tone}, ${tone - 4})`;
      ctx.fillRect(column * tile + 4, row * tile + 4, tile - 8, tile - 8);

      for (let speck = 0; speck < 220; speck += 1) {
        ctx.fillStyle = `rgba(90, 90, 90, ${random() * 0.25})`;
        ctx.fillRect(
          column * tile + 4 + random() * (tile - 8),
          row * tile + 4 + random() * (tile - 8),
          2,
          2,
        );
      }
    }
};

const drawWood = (ctx: CanvasRenderingContext2D, random: () => number) => {
  ctx.fillStyle = "rgb(222, 196, 160)";
  ctx.fillRect(0, 0, SIZE, SIZE);
  grain(ctx, random, 0, 0, SIZE, SIZE, 90);
};

let cache: Record<"planks" | "tiles" | "wood", Texture> | null = null;

export const realisticTextures = () => {
  cache ??= {
    planks: paint(drawPlanks, 11, 1.6),
    tiles: paint(drawTiles, 23, 1.2),
    wood: paint(drawWood, 37),
  };

  return cache;
};
