"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";

import FormBox from "@/components/FormBox";
import UploadAvatars from "@/components/UploadAvatars";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { FormControlLabel, Switch } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Banner, CreateBannerDto } from "@/types/banners";

import { fetcher } from "@/utils/fetcher";

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

interface BannerDialogProps {
  banner: Banner | null;
  mutate: () => void;
}

const BannerDialog = ({ banner, mutate }: BannerDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const [isActive, setIsActive] = useState(banner?.isActive ?? true);

  const tBanners = useTranslations("banners");

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

    try {
      setDialog({ confirmLoading: true });

      const body: CreateBannerDto = { image: imageSrc, isActive };

      await fetcher(banner ? `/api/banners/${banner.id}` : "/api/banners", {
        method: banner ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    </FormBox>
  );
};

export default BannerDialog;
