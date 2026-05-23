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

import {
  Box,
  type BoxProps,
  Chip,
  Divider,
  TextField,
  styled,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import AddressFields from "../AddressFields";
import LocalBusinessFields from "../LocalBusinessFields";

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
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateOrganizationForm>({
    defaultValues: {
      name: "",
      slug: "",

      addressCountry: "TW",
      addressLocality: "",
      addressRegion: "",
      extendedAddress: "",
      postalCode: "",
      streetAddress: "",

      hasMap: "",
      mapEmbedUrl: "",
      openingHours: "",
      telephone: "",
    },
    resolver: zodResolver(createOrganizationFormSchema),
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
    mapEmbedUrl,
    openingHours,
    telephone,
  }: CreateOrganizationForm) => {
    await authClient.organization.create(
      {
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
        mapEmbedUrl,
        openingHours,
        telephone,
      },
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
      <Divider flexItem>
        <Chip label={tOrganizations("address.label")} size="small" />
      </Divider>
      <AddressFields control={control} errors={errors} register={register} />
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

export default CreateOrganizationDialog;
