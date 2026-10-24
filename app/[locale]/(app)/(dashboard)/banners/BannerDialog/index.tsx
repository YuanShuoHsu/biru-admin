"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import UploadAvatars from "@/components/UploadAvatars";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { FormControlLabel, Grid, Switch, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Banner } from "@/types/banners";
import type { LocalizedText } from "@/types/locale";

import { fetcher } from "@/utils/fetcher";

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

const toPickerValue = (value?: string | null) =>
  value ? dayjs(value).format("YYYY-MM-DDTHH:mm") : "";

const toIsoString = (value: string) =>
  value ? new Date(value).toISOString() : null;

interface BannerDialogProps {
  banner: Banner | null;
  mutate: () => void;
}

const BannerDialog = ({ banner, mutate }: BannerDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [alt, setAlt] = useState<LocalizedText>(banner?.alt ?? {});
  const [url, setUrl] = useState(banner?.url ?? "");
  const [startsAt, setStartsAt] = useState(toPickerValue(banner?.startsAt));
  const [endsAt, setEndsAt] = useState(toPickerValue(banner?.endsAt));

  const tBanners = useTranslations("banners");
  const tCommon = useTranslations("common");

  const uploadKey = banner
    ? `update-banner-image-${banner.id}`
    : "create-banner-image";
  const imageSrc = useUploadAvatarSrc(uploadKey, banner?.image);

  const handleSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();

    if (!imageSrc) {
      enqueueSnackbar(tBanners("image.notSelected"), { variant: "error" });

      return;
    }

    const startsAtDate = startsAt ? dayjs(startsAt) : null;
    const endsAtDate = endsAt ? dayjs(endsAt) : null;

    if (
      startsAtDate?.isValid() === false ||
      endsAtDate?.isValid() === false ||
      (startsAtDate && endsAtDate && !startsAtDate.isBefore(endsAtDate))
    ) {
      enqueueSnackbar(tBanners("schedule.invalid"), { variant: "error" });

      return;
    }

    try {
      setDialog({ confirmLoading: true });

      await fetcher(banner ? `/api/banners/${banner.id}` : "/api/banners", {
        method: banner ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alt,
          endsAt: toIsoString(endsAt),
          image: imageSrc,
          isActive,
          startsAt: toIsoString(startsAt),
          url: url.trim() || null,
        }),
      });

      enqueueSnackbar(
        tBanners(
          banner
            ? "actions.updateBanner.success"
            : "actions.createBanner.success",
        ),
        { variant: "success" },
      );

      closeDialog();
      mutate();
    } catch {
      enqueueSnackbar(
        tBanners(
          banner ? "actions.updateBanner.error" : "actions.createBanner.error",
        ),
        { variant: "error" },
      );

      setDialog({ confirmLoading: false });
    }
  };

  return (
    <FormBox id="banner-form" onSubmit={handleSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        highQuality
        initialSrc={banner?.image}
        shape="square"
        uploadKey={uploadKey}
      />
      <StyledFormControlLabel
        control={
          <Switch
            checked={isActive}
            onChange={(_, checked) => setIsActive(checked)}
          />
        }
        label={tBanners("isActive.label")}
      />
      <LocalizedTextFields
        fields={(lang) => [
          {
            fullWidth: true,
            helperText: tBanners("alt.helperText"),
            label: `${tBanners("alt.label")} ${tCommon("optional")}`,
            onChange: (event) => setAlt({ ...alt, [lang]: event.target.value }),
            value: alt[lang] || "",
          },
        ]}
      />
      <TextField
        fullWidth
        helperText={tBanners("url.helperText")}
        label={`${tBanners("url.label")} ${tCommon("optional")}`}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="/order"
        slotProps={{ htmlInput: { maxLength: 2048 } }}
        value={url}
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DateTimePicker
            label={`${tBanners("startsAt")} ${tCommon("optional")}`}
            maxDateTime={endsAt ? dayjs(endsAt) : undefined}
            onChange={(date) =>
              setStartsAt(date ? date.format("YYYY-MM-DDTHH:mm") : "")
            }
            slotProps={{
              field: { clearable: true },
              textField: { fullWidth: true },
            }}
            value={startsAt ? dayjs(startsAt) : null}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DateTimePicker
            label={`${tBanners("endsAt")} ${tCommon("optional")}`}
            minDateTime={startsAt ? dayjs(startsAt) : undefined}
            onChange={(date) =>
              setEndsAt(date ? date.format("YYYY-MM-DDTHH:mm") : "")
            }
            slotProps={{
              field: { clearable: true },
              textField: { fullWidth: true },
            }}
            value={endsAt ? dayjs(endsAt) : null}
          />
        </Grid>
      </Grid>
    </FormBox>
  );
};

export default BannerDialog;
