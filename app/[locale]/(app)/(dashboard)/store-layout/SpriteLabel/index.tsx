"use client";

import { useMemo } from "react";

import { STORE_LAYOUT_FOV } from "@/constants/storeLayout";

import { useColorScheme } from "@mui/material/styles";

import { useThree } from "@react-three/fiber";

import { CanvasTexture, SRGBColorSpace } from "three";

const SUPERSAMPLE = 3;
const FONT_SIZE = 11;
const LINE_HEIGHT = 1.5;
const PADDING_X = 6;
const NOTE_GAP = 4;
const RADIUS = 4;
const HALO_WIDTH = 3;

interface CachedLabel {
  height: number;
  texture: CanvasTexture;
  width: number;
}

const cache = new Map<string, CachedLabel>();

const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(width, 0, width, height, radius);
  ctx.arcTo(width, height, 0, height, radius);
  ctx.arcTo(0, height, 0, 0, radius);
  ctx.arcTo(0, 0, width, 0, radius);
  ctx.closePath();
};

const build = (text: string, note: string, plain: boolean) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const font = `${FONT_SIZE * SUPERSAMPLE}px ${getComputedStyle(document.body).fontFamily}`;

  ctx.font = font;

  const textWidth = ctx.measureText(text).width;
  const noteWidth = note
    ? NOTE_GAP * SUPERSAMPLE + ctx.measureText(note).width
    : 0;
  const padding = plain ? HALO_WIDTH * SUPERSAMPLE : PADDING_X * SUPERSAMPLE;

  canvas.width = Math.ceil(textWidth + noteWidth + padding * 2);
  canvas.height = Math.ceil(FONT_SIZE * LINE_HEIGHT * SUPERSAMPLE);

  ctx.font = font;
  ctx.textBaseline = "middle";

  const middle = canvas.height / 2;

  if (plain) {
    ctx.lineJoin = "round";
    ctx.lineWidth = HALO_WIDTH * SUPERSAMPLE;
    ctx.strokeStyle = cssVar("--mui-palette-background-default");
    ctx.strokeText(text, padding, middle);
    ctx.fillStyle = cssVar("--mui-palette-text-secondary");
    ctx.fillText(text, padding, middle);
  } else {
    roundedRect(ctx, canvas.width, canvas.height, RADIUS * SUPERSAMPLE);
    ctx.fillStyle = cssVar("--mui-palette-background-paper");
    ctx.fill();
    ctx.lineWidth = SUPERSAMPLE;
    ctx.strokeStyle = cssVar("--mui-palette-divider");
    ctx.stroke();

    ctx.fillStyle = cssVar("--mui-palette-text-primary");
    ctx.fillText(text, padding, middle);

    if (note) {
      ctx.fillStyle = cssVar("--mui-palette-text-secondary");
      ctx.fillText(note, padding + textWidth + NOTE_GAP * SUPERSAMPLE, middle);
    }
  }

  const texture = new CanvasTexture(canvas);

  texture.colorSpace = SRGBColorSpace;

  return { height: canvas.height, texture, width: canvas.width };
};

interface SpriteLabelProps {
  note?: string;
  plain?: boolean;
  position: [number, number, number];
  text: string;
}

const SpriteLabel = ({
  note = "",
  plain = false,
  position,
  text,
}: SpriteLabelProps) => {
  const viewportHeight = useThree((state) => state.size.height);
  const { mode, systemMode } = useColorScheme();

  const scheme = (mode === "system" ? systemMode : mode) ?? "light";

  const label = useMemo(() => {
    const key = `${scheme}|${plain}|${text}|${note}`;
    const cached = cache.get(key);

    if (cached) return cached;

    const built = build(text, note, plain);

    if (built) cache.set(key, built);

    return built;
  }, [note, plain, scheme, text]);

  if (!label) return null;

  const perPixel =
    (2 * Math.tan((STORE_LAYOUT_FOV * Math.PI) / 360)) / viewportHeight;

  return (
    <sprite
      position={position}
      renderOrder={2}
      scale={[
        (label.width / SUPERSAMPLE) * perPixel,
        (label.height / SUPERSAMPLE) * perPixel,
        1,
      ]}
    >
      <spriteMaterial
        depthTest={false}
        depthWrite={false}
        map={label.texture}
        sizeAttenuation={false}
        toneMapped={false}
        transparent
      />
    </sprite>
  );
};

export default SpriteLabel;
