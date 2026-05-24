"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

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
  TextField,
  styled,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization } from "@/types/organizations";

import AddressFields from "../AddressFields";
import LocalBusinessFields from "../LocalBusinessFields";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface UpdateOrganizationDialogProps {
  mutateOrganizations: () => void;
  organization: Organization;
}

const UpdateOrganizationDialog = ({
  mutateOrganizations,
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
    getValues,
    handleSubmit,
    register,
    setValue,
  } = useForm<UpdateOrganizationForm>({
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
      addressCountry: organization.addressCountry || "",
      addressLocality: organization.addressLocality || "",
      addressRegion: organization.addressRegion || "",
      extendedAddress: organization.extendedAddress || "",
      postalCode: organization.postalCode || "",
      streetAddress: organization.streetAddress || "",
      hasMap: organization.hasMap || "",
      openingHours: organization.openingHours || "",
      telephone: organization.telephone || "",
    },
    resolver: zodResolver(updateOrganizationFormSchema),
  });

  const onSubmitHandler = async ({
    name,
    slug,
    addressCountry,
    addressLocality,
    addressRegion,
    extendedAddress,
    postalCode,
    streetAddress,
    hasMap,
    openingHours,
    telephone,
  }: UpdateOrganizationForm) => {
    await authClient.organization.update(
      {
        organizationId: organization.id,
        data: {
          logo,
          name,
          slug,
          addressCountry,
          addressLocality,
          addressRegion,
          extendedAddress,
          postalCode,
          streetAddress,
          hasMap,
          openingHours,
          telephone,
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
        <Chip label={tOrganizations("address.label")} size="small" />
      </Divider>
      <AddressFields
        control={control}
        errors={errors}
        getValues={getValues}
        register={register}
        setValue={setValue}
      />
      <Divider flexItem>
        <Chip label={tOrganizations("localBusiness.label")} size="small" />
      </Divider>
      <LocalBusinessFields
        control={control}
        errors={errors}
        register={register}
      />
    </StyledBox>
  );
};

export default UpdateOrganizationDialog;
