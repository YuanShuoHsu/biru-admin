"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useState } from "react";

import { downloadCsv } from "@/utils/dataGrid";
import { getErrorMessage } from "@/utils/errors";

export const useCsvDownload = () => {
  const [downloading, setDownloading] = useState(false);

  const locale = useLocale();

  const tCommon = useTranslations("common");

  const download = useCallback(
    async (path: string, fileName: string) => {
      try {
        setDownloading(true);

        await downloadCsv(path, fileName, {
          fallbackMessage: tCommon("error.title"),
          locale,
        });
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        setDownloading(false);
      }
    },
    [locale, tCommon],
  );

  return { download, downloading };
};
