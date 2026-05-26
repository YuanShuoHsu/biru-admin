"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type CreateOrganizationForm,
  useCreateOrganizationFormSchema,
} from "./definitions";

import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const CREATE_ORGANIZATION_AVATAR_KEY = "create-organization-avatar";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface CreateOrganizationDialogProps {
  mutateOrganizations: () => void;
}

const CreateOrganizationDialog = ({
  mutateOrganizations,
}: CreateOrganizationDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);
  const logo = useUploadAvatarSrc(CREATE_ORGANIZATION_AVATAR_KEY);

  const locale = useLocale();

  const tOrganizations = useTranslations("organizations");

  const createOrganizationFormSchema = useCreateOrganizationFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateOrganizationForm>({
    defaultValues: {
      name: "",
      slug: "",
    },
    resolver: zodResolver(createOrganizationFormSchema),
  });

  const onSubmitHandler = async ({ name, slug }: CreateOrganizationForm) => {
    await authClient.organization.create(
      { logo, name, slug },
      {
        onError: ({ error: { code } }) => {
          const message = getErrorMessage(code, locale);
          enqueueSnackbar(message, { variant: "error" });

          setDialog({ confirmLoading: false });
        },
        onRequest: () => setDialog({ confirmLoading: true }),
        onSuccess: () => {
          const message = tOrganizations("actions.createOrganization.success", {
            name,
          });
          enqueueSnackbar(message, { variant: "success" });

          closeDialog();

          mutateOrganizations();
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
      <UploadAvatars uploadKey={CREATE_ORGANIZATION_AVATAR_KEY} />
      <TextField
        autoComplete="organization"
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tOrganizations("name.label")}
        placeholder={tOrganizations("name.placeholder")}
        required
        {...register("name")}
      />
      <TextField
        error={!!errors.slug}
        fullWidth
        helperText={errors.slug?.message}
        label={tOrganizations("slug.label")}
        placeholder={tOrganizations("slug.placeholder")}
        required
        {...register("slug")}
      />
    </StyledBox>
  );
};

export default CreateOrganizationDialog;
