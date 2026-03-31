"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm } from "react-hook-form";

import {
  type UpdateOrganizationForm,
  useUpdateOrganizationFormSchema,
} from "./definitions";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization } from "@/types/auth";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
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

  const onSubmit = handleSubmit(
    async ({ name, slug }: UpdateOrganizationForm) => {
      await authClient.organization.update(
        { organizationId: organization.id, data: { name, slug } },
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
            const message = tOrganizations("update.success");
            enqueueSnackbar(message, { variant: "success" });

            resetDialog();
            fetchData();
          },
        },
      );
    },
  );

  return (
    <StyledBox
      component="form"
      id="update-organization-form"
      onSubmit={onSubmit}
    >
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

export default UpdateOrganizationDialogContent;
