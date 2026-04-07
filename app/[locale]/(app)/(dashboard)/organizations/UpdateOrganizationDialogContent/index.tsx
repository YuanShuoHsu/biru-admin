"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useRef } from "react";
import { useForm } from "react-hook-form";

import {
  type UpdateOrganizationForm,
  useUpdateOrganizationFormSchema,
} from "./definitions";

import UploadAvatars, {
  type UploadAvatarsHandle,
} from "@/components/UploadAvatars";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization } from "@/types/organizations";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface UpdateOrganizationDialogContentProps {
  fetchData: () => Promise<void>;
  organization: Organization;
}

const UpdateOrganizationDialogContent = ({
  fetchData,
  organization,
}: UpdateOrganizationDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tOrganizations = useTranslations("organizations");

  const updateOrganizationFormSchema = useUpdateOrganizationFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateOrganizationForm>({
    defaultValues: { name: organization.name, slug: organization.slug },
    resolver: zodResolver(updateOrganizationFormSchema),
  });

  const uploadAvatarsRef = useRef<UploadAvatarsHandle>(null);

  const onSubmitHandler = async ({ name, slug }: UpdateOrganizationForm) => {
    const { avatarSrc: logo } = uploadAvatarsRef.current?.getValue() || {};

    await authClient.organization.update(
      { organizationId: organization.id, data: { logo, name, slug } },
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
          const message = tOrganizations("actions.update.success");
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
      id="update-organization-form"
      onSubmit={onSubmit}
    >
      <UploadAvatars initialSrc={organization.logo} ref={uploadAvatarsRef} />
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

export default UpdateOrganizationDialogContent;
