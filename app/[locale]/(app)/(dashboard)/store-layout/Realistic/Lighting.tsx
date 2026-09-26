"use client";

import { useState } from "react";

import { STORE_LAYOUT_ROOM } from "@/constants/storeLayout";

import { Environment, Lightformer } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  N8AO,
  ToneMapping,
} from "@react-three/postprocessing";

import { ToneMappingMode } from "postprocessing";
import { Object3D } from "three";

const CENTER_X = STORE_LAYOUT_ROOM.width / 2;
const CENTER_Z = STORE_LAYOUT_ROOM.depth / 2;
const SHADOW_EXTENT =
  Math.hypot(STORE_LAYOUT_ROOM.width, STORE_LAYOUT_ROOM.depth) / 2 + 2;

const WARM_WHITE = "#fff4e5";
const FLOOR_BOUNCE = "#e9dfd2";

const Lighting = () => {
  const [target] = useState(() => {
    const object = new Object3D();

    object.position.set(CENTER_X, 0, CENTER_Z);

    return object;
  });

  return (
    <>
      <Environment resolution={256}>
        <Lightformer
          color={WARM_WHITE}
          form="rect"
          intensity={2}
          position={[0, 6, 0]}
          rotation-x={Math.PI / 2}
          scale={[12, 12, 1]}
        />
        <Lightformer
          color={FLOOR_BOUNCE}
          form="rect"
          intensity={0.8}
          position={[0, -6, 0]}
          rotation-x={-Math.PI / 2}
          scale={[12, 12, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.6}
          position={[-8, 2, 0]}
          rotation-y={Math.PI / 2}
          scale={[10, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.6}
          position={[8, 2, 0]}
          rotation-y={-Math.PI / 2}
          scale={[10, 3, 1]}
        />
      </Environment>
      <hemisphereLight args={[WARM_WHITE, FLOOR_BOUNCE, 0.8]} />
      <primitive object={target} />
      <directionalLight
        castShadow
        color={WARM_WHITE}
        intensity={2.2}
        position={[CENTER_X + 6, 20, CENTER_Z + 4]}
        shadow-bias={-0.0004}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-far={60}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-mapSize={[2048, 2048]}
        shadow-normalBias={0.02}
        target={target}
      />
      <EffectComposer multisampling={4}>
        <N8AO
          aoRadius={0.6}
          distanceFalloff={0.6}
          halfRes
          intensity={2.5}
          quality="medium"
        />
        <Bloom intensity={0.5} luminanceThreshold={3} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
};

export default Lighting;
