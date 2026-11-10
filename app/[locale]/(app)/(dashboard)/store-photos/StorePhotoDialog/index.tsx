"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type StorePhotoForm, useStorePhotoFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { CreateStorePhotoDto, StorePhoto } from "@/types/storePhotos";

import { fetcher } from "@/utils/fetcher";

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

interface StorePhotoDialogProps {
  mutate: () => void;
  storePhoto: StorePhoto | null;
}

const StorePhotoDialog = ({ mutate, storePhoto }: StorePhotoDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tStorePhotos = useTranslations("storePhotos");

  const uploadKey = storePhoto
    ? `update-store-photo-image-${storePhoto.id}`
    : "create-store-photo-image";
  const imageSrc = useUploadAvatarSrc(uploadKey, storePhoto?.imageUrl);

  const storePhotoFormSchema = useStorePhotoFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<StorePhotoForm>({
    defaultValues: {
      alt: storePhoto?.alt ?? {},
      image: imageSrc ?? "",
      isActive: storePhoto?.isActive ?? true,
    },
    resolver: zodResolver(storePhotoFormSchema),
  });

  const altValue = useWatch({ control, name: "alt" });
  const isActive = useWatch({ control, name: "isActive" });

  const onSubmitHandler = async ({ alt, image, isActive }: StorePhotoForm) => {
    try {
      setDialog({ confirmLoading: true });

      const body: Partial<CreateStorePhotoDto> = {
        alt,
        isActive,
        ...(image !== storePhoto?.imageUrl && { image }),
      };

      await fetcher(
        storePhoto ? `/api/store-photos/${storePhoto.id}` : "/api/store-photos",
        {
          method: storePhoto ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      enqueueSnackbar(
        tStorePhotos(
          storePhoto
            ? "actions.updateStorePhoto.success"
            : "actions.createStorePhoto.success",
        ),
        { variant: "success" },
      );

      closeDialog();
      mutate();
    } catch {
      enqueueSnackbar(
        tStorePhotos(
          storePhoto
            ? "actions.updateStorePhoto.error"
            : "actions.createStorePhoto.error",
        ),
        { variant: "error" },
      );

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="store-photo-form" noValidate onSubmit={onSubmit}>
      <FormControl error={!!errors.image}>
        <UploadAvatars
          aspectRatio="4/3"
          fullWidth
          highQuality
          initialSrc={storePhoto?.imageUrl}
          onChange={(src) =>
            setValue("image", src ?? "", { shouldValidate: isSubmitted })
          }
          shape="square"
          uploadKey={uploadKey}
        />
        {errors.image && (
          <FormHelperText>{errors.image.message}</FormHelperText>
        )}
      </FormControl>
      <LocalizedTextFields
        fields={(lang) => [
          {
            error: !!errors.alt?.[lang],
            fullWidth: true,
            helperText:
              errors.alt?.[lang]?.message ?? tStorePhotos("alt.helperText"),
            label: tStorePhotos("alt.label"),
            onChange: (event) =>
              setValue(
                "alt",
                { ...altValue, [lang]: event.target.value },
                { shouldValidate: isSubmitted },
              ),
            placeholder: tStorePhotos("alt.placeholder"),
            required: true,
            value: altValue?.[lang] || "",
          },
        ]}
      />
      <StyledFormControlLabel
        control={
          <Switch
            checked={isActive}
            onChange={(_, checked) => setValue("isActive", checked)}
          />
        }
        label={tStorePhotos("isActive.label")}
      />
    </FormBox>
  );
};

export default StorePhotoDialog;
