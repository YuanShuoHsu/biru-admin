"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type UpdateOrganizationForm,
  useUpdateOrganizationFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization } from "@/types/organizations";

interface UpdateOrganizationDialogProps {
  mutate: () => void;
  organization: Organization;
}

const UpdateOrganizationDialog = ({
  mutate,
  organization,
}: UpdateOrganizationDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const uploadKey = `update-organization-avatar-${organization.id}`;
  const logo = useUploadAvatarSrc(uploadKey, organization.logo);

  const tOrganizations = useTranslations("organizations");

  const updateOrganizationFormSchema = useUpdateOrganizationFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateOrganizationForm>({
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
    },
    resolver: zodResolver(updateOrganizationFormSchema),
  });

  const onSubmitHandler = async ({ name, slug }: UpdateOrganizationForm) => {
    await authClient.organization.update(
      {
        organizationId: organization.id,
        data: { logo, name, slug },
      },
      {
        onError: ({ error: { code } }) => {
          const message = getErrorMessage(code, locale);
          enqueueSnackbar(message, { variant: "error" });

          setDialog({ confirmLoading: false });
        },
        onRequest: () => setDialog({ confirmLoading: true }),
        onSuccess: () => {
          const message = tOrganizations("actions.updateOrganization.success", {
            name,
          });
          enqueueSnackbar(message, { variant: "success" });

          closeDialog();

          mutate();
        },
      },
    );
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="update-organization-form" onSubmit={onSubmit}>
      <UploadAvatars initialSrc={organization.logo} uploadKey={uploadKey} />
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
    </FormBox>
  );
};

export default UpdateOrganizationDialog;
