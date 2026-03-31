"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useRef } from "react";
import { useForm } from "react-hook-form";

import {
  type CreateOrganizationForm,
  useCreateOrganizationFormSchema,
} from "./definitions";

import UploadAvatars, {
  type UploadAvatarsHandle,
} from "@/components/UploadAvatars";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1),
}));

interface CreateOrganizationDialogContentProps {
  fetchData: () => Promise<void>;
}

const CreateOrganizationDialogContent = ({
  fetchData,
}: CreateOrganizationDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tOrganizations = useTranslations("organizations");

  const createOrganizationFormSchema = useCreateOrganizationFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateOrganizationForm>({
    defaultValues: { name: "", slug: "" },
    resolver: zodResolver(createOrganizationFormSchema),
  });

  const uploadAvatarsRef = useRef<UploadAvatarsHandle>(null);

  const onSubmitHandler = async ({ name, slug }: CreateOrganizationForm) => {
    const { avatarSrc: logo } = uploadAvatarsRef.current?.getValue() || {};

    await authClient.organization.create(
      { logo, name, slug },
      {
        onRequest: () => {
          setDialog({ confirmLoading: true });
        },
        onError: ({ error: { code } }) => {
          const message = getErrorMessage(code, locale);
          enqueueSnackbar(message, { variant: "error" });

          setDialog({ confirmLoading: false });
        },
        onSuccess: () => {
          const message = tOrganizations("create.success");
          enqueueSnackbar(message, { variant: "success" });

          resetDialog();
          fetchData();
        },
      },
    );
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox
      component="form"
      id="create-organization-form"
      onSubmit={onSubmit}
    >
      <UploadAvatars ref={uploadAvatarsRef} />
      <TextField
        autoComplete="organization"
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tOrganizations("fields.name.label")}
        placeholder={tOrganizations("fields.name.placeholder")}
        required
        {...register("name")}
      />
      <TextField
        error={!!errors.slug}
        fullWidth
        helperText={errors.slug?.message}
        label={tOrganizations("fields.slug.label")}
        placeholder={tOrganizations("fields.slug.placeholder")}
        required
        {...register("slug")}
      />
    </StyledBox>
  );
};

export default CreateOrganizationDialogContent;
