"use client";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { quantAccountUrl } from "../../useQuantCredentials";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";

import {
  Button,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { QuantAssets } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const AssetsBreakdown = ({ assets }: { assets: QuantAssets }) => {
  const tAssets = useTranslations("quant.settings.assets");
  const tTransfer = useTranslations("quant.transfer");
  const format = useFormatter();

  const usdt = (value: number) =>
    `${format.number(value, { maximumFractionDigits: 2, minimumFractionDigits: 2 })} USDT`;

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack>
        <Typography variant="h5">{usdt(assets.totalInUsdt)}</Typography>
        <Typography color="text.secondary" variant="body2">
          {tAssets("inBtc", {
            amount: format.number(assets.totalInBtc, {
              maximumFractionDigits: 8,
            }),
          })}
        </Typography>
      </Stack>
      {assets.accounts.map(({ account, categories, totalInUsdt }) => (
        <Table key={account} size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>
                {tTransfer(`accounts.${account}`)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {usdt(totalInUsdt)}
              </TableCell>
            </TableRow>
            {categories.map(({ title, totalInUsdt: value, type }) => (
              <TableRow key={type}>
                <TableCell sx={{ pl: 4 }}>{title}</TableCell>
                <TableCell align="right">{usdt(value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ))}
    </Stack>
  );
};

const CredentialAssets = ({ credentialId }: { credentialId: string }) => {
  const tAssets = useTranslations("quant.settings.assets");
  const format = useFormatter();
  const setDialog = useDialogStore((state) => state.setDialog);

  const { data: assets, error } = useSWR<QuantAssets>(
    quantAccountUrl(credentialId, "assets"),
    fetcher,
  );

  if (error)
    return (
      <Typography color="error" variant="body2">
        {getErrorMessage(error)}
      </Typography>
    );
  if (!assets) return <Skeleton width={120} />;

  return (
    <Button
      onClick={(event) => {
        event.stopPropagation();

        setDialog({
          content: (
            <>
              <CustomizedDialogContent>
                <AssetsBreakdown assets={assets} />
              </CustomizedDialogContent>
              <CustomizedDialogActions />
            </>
          ),
          open: true,
          showCancel: false,
          title: tAssets("title"),
        });
      }}
      size="small"
    >
      {format.number(assets.totalInUsdt, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}{" "}
      USDT
    </Button>
  );
};

export default CredentialAssets;
