"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type BannerForm, useBannerFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import UploadAvatars from "@/components/UploadAvatars";

import { PLATFORM_TIMEZONE } from "@/constants/timezone";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { zodResolver } from "@hookform/resolvers/zod";

import { FormControlLabel, Grid, Switch, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Banner, CreateBannerDto } from "@/types/banners";

import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

interface BannerDialogProps {
  banner: Banner | null;
  mutate: () => void;
}

const BannerDialog = ({ banner, mutate }: BannerDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tBanners = useTranslations("banners");
  const tCommon = useTranslations("common");

  const bannerFormSchema = useBannerFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<BannerForm>({
    defaultValues: {
      alt: banner?.alt ?? {},
      endsAt: banner?.endsAt ?? "",
      isActive: banner?.isActive ?? true,
      startsAt: banner?.startsAt ?? "",
      url: banner?.url ?? "",
    },
    resolver: zodResolver(bannerFormSchema),
  });

  const [alt, endsAt, isActive, startsAt] = useWatch({
    control,
    name: ["alt", "endsAt", "isActive", "startsAt"],
  });

  const uploadKey = banner
    ? `update-banner-image-${banner.id}`
    : "create-banner-image";
  const imageSrc = useUploadAvatarSrc(uploadKey, banner?.image);

  const onSubmitHandler = async ({
    alt,
    endsAt,
    isActive,
    startsAt,
    url,
  }: BannerForm) => {
    if (!imageSrc) {
      enqueueSnackbar(tBanners("image.notSelected"), { variant: "error" });

      return;
    }

    try {
      setDialog({ confirmLoading: true });

      await fetcher(banner ? `/api/banners/${banner.id}` : "/api/banners", {
        method: banner ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alt,
          endsAt: endsAt || null,
          image: imageSrc,
          isActive,
          startsAt: startsAt || null,
          url: url || null,
        } satisfies CreateBannerDto),
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

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="banner-form" onSubmit={onSubmit}>
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
            onChange={(_, checked) => setValue("isActive", checked)}
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
            onChange: (event) =>
              setValue("alt", { ...alt, [lang]: event.target.value }),
            value: alt[lang] || "",
          },
        ]}
      />
      <TextField
        error={!!errors.url}
        fullWidth
        helperText={errors.url?.message ?? tBanners("url.helperText")}
        label={`${tBanners("url.label")} ${tCommon("optional")}`}
        placeholder="/order"
        slotProps={{ htmlInput: { maxLength: 2048 } }}
        {...register("url")}
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DateTimePicker
            label={`${tBanners("startsAt")} ${tCommon("optional")}`}
            maxDateTime={endsAt ? dayjs(endsAt) : undefined}
            onChange={(date) =>
              setValue(
                "startsAt",
                date?.isValid() ? date.startOf("minute").toISOString() : "",
                {
                  shouldValidate: isSubmitted,
                },
              )
            }
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!errors.startsAt,
                fullWidth: true,
                helperText: errors.startsAt?.message,
              },
            }}
            timezone={PLATFORM_TIMEZONE}
            value={startsAt ? dayjs(startsAt) : null}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DateTimePicker
            label={`${tBanners("endsAt")} ${tCommon("optional")}`}
            minDateTime={startsAt ? dayjs(startsAt) : undefined}
            onChange={(date) =>
              setValue(
                "endsAt",
                date?.isValid() ? date.startOf("minute").toISOString() : "",
                {
                  shouldValidate: isSubmitted,
                },
              )
            }
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!errors.endsAt,
                fullWidth: true,
                helperText: errors.endsAt?.message,
              },
            }}
            timezone={PLATFORM_TIMEZONE}
            value={endsAt ? dayjs(endsAt) : null}
          />
        </Grid>
      </Grid>
    </FormBox>
  );
};

export default BannerDialog;
