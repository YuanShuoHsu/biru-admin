"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  type UpdateOrganizationForm,
  useUpdateOrganizationFormSchema,
} from "./definitions";

import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  Box,
  type BoxProps,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  styled,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization } from "@/types/organizations";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface UpdateOrganizationDialogProps {
  fetchOrganizationList: () => Promise<void>;
  organization: Organization;
}

const UpdateOrganizationDialog = ({
  fetchOrganizationList,
  organization,
}: UpdateOrganizationDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const uploadKey = `update-organization-avatar-${organization.id}`;
  const logo = useUploadAvatarSrc(uploadKey, organization.logo);

  const tOrganizations = useTranslations("organizations");

  const updateOrganizationFormSchema = useUpdateOrganizationFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateOrganizationForm>({
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
      isOpen: organization.isOpen ?? true,
      addressCountry: organization.addressCountry ?? "",
      addressLocality: organization.addressLocality ?? "",
      addressRegion: organization.addressRegion ?? "",
      extendedAddress: organization.extendedAddress ?? "",
      postOfficeBoxNumber: organization.postOfficeBoxNumber ?? "",
      postalCode: organization.postalCode ?? "",
      streetAddress: organization.streetAddress ?? "",
    },
    resolver: zodResolver(updateOrganizationFormSchema),
  });

  const onSubmitHandler = async ({
    name,
    slug,
    isOpen,
    addressCountry,
    addressLocality,
    addressRegion,
    extendedAddress,
    postOfficeBoxNumber,
    postalCode,
    streetAddress,
  }: UpdateOrganizationForm) => {
    await authClient.organization.update(
      {
        organizationId: organization.id,
        data: {
          logo,
          name,
          slug,
          isOpen,
          addressCountry,
          addressLocality,
          addressRegion,
          extendedAddress,
          postOfficeBoxNumber,
          postalCode,
          streetAddress,
        },
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

          fetchOrganizationList();
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
      <Divider flexItem>
        <Chip label={tOrganizations("additionalFields.label")} size="small" />
      </Divider>
      <TextField
        error={!!errors.streetAddress}
        fullWidth
        helperText={errors.streetAddress?.message}
        label={tOrganizations("address.streetAddress.label")}
        placeholder={tOrganizations("address.streetAddress.placeholder")}
        {...register("streetAddress")}
      />
      <TextField
        error={!!errors.extendedAddress}
        fullWidth
        helperText={errors.extendedAddress?.message}
        label={tOrganizations("address.extendedAddress.label")}
        placeholder={tOrganizations("address.extendedAddress.placeholder")}
        {...register("extendedAddress")}
      />
      <Box display="flex" gap={2} width="100%">
        <TextField
          error={!!errors.postalCode}
          fullWidth
          helperText={errors.postalCode?.message}
          label={tOrganizations("address.postalCode.label")}
          placeholder={tOrganizations("address.postalCode.placeholder")}
          {...register("postalCode")}
        />
        <TextField
          error={!!errors.addressLocality}
          fullWidth
          helperText={errors.addressLocality?.message}
          label={tOrganizations("address.addressLocality.label")}
          placeholder={tOrganizations("address.addressLocality.placeholder")}
          {...register("addressLocality")}
        />
      </Box>
      <Box display="flex" gap={2} width="100%">
        <TextField
          error={!!errors.addressRegion}
          fullWidth
          helperText={errors.addressRegion?.message}
          label={tOrganizations("address.addressRegion.label")}
          placeholder={tOrganizations("address.addressRegion.placeholder")}
          {...register("addressRegion")}
        />
        <TextField
          error={!!errors.addressCountry}
          fullWidth
          helperText={errors.addressCountry?.message}
          label={tOrganizations("address.addressCountry.label")}
          placeholder={tOrganizations("address.addressCountry.placeholder")}
          {...register("addressCountry")}
        />
      </Box>
      <TextField
        error={!!errors.postOfficeBoxNumber}
        fullWidth
        helperText={errors.postOfficeBoxNumber?.message}
        label={tOrganizations("address.postOfficeBoxNumber.label")}
        placeholder={tOrganizations("address.postOfficeBoxNumber.placeholder")}
        {...register("postOfficeBoxNumber")}
      />
      <Controller
        control={control}
        name="isOpen"
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            }
            label={tOrganizations("isOpen.label")}
            sx={{ alignSelf: "flex-start" }}
          />
        )}
      />
    </StyledBox>
  );
};

export default UpdateOrganizationDialog;
