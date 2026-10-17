"use client";

import { Skeleton, Stack } from "@mui/material";

import { Board, CHART_HEIGHT, Panel, SidePanel } from "./MarketTerminal/styled";

const QuantMarketLoading = () => (
  <Stack sx={{ gap: 2 }}>
    <Skeleton height={104} variant="rounded" />
    <Board>
      <Panel sx={{ flex: 1, gap: 1, minWidth: 0 }}>
        <Skeleton height={40} variant="rounded" />
        <Skeleton height={CHART_HEIGHT} variant="rounded" />
      </Panel>
      <SidePanel>
        <Skeleton height={480} variant="rounded" />
        <Skeleton height={480} variant="rounded" />
      </SidePanel>
    </Board>
  </Stack>
);

export default QuantMarketLoading;
