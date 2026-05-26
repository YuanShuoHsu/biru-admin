"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type UpdateLocationForm,
  useUpdateLocationFormSchema,
} from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, Chip, Divider, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import AddressFields from "@/app/[locale]/(app)/(dashboard)/organizations/AddressFields";
import LocalBusinessFields from "@/app/[locale]/(app)/(dashboard)/organizations/LocalBusinessFields";

import type { Organization } from "@/types/organizations";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface UpdateLocationDialogProps {
  fetchOrganization: () => void;
  organization: Organization;
}

const UpdateLocationDialog = ({
  fetchOrganization,
  organization,
}: UpdateLocationDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tOrganizations = useTranslations("organizations");

  const updateLocationFormSchema = useUpdateLocationFormSchema();
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    setValue,
  } = useForm<UpdateLocationForm>({
    defaultValues: {
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
    resolver: zodResolver(updateLocationFormSchema),
  });

  const onSubmitHandler = async ({
    addressCountry,
    addressLocality,
    addressRegion,
    extendedAddress,
    postalCode,
    streetAddress,
    hasMap,
    openingHours,
    telephone,
  }: UpdateLocationForm) => {
    await authClient.organization.update(
      {
        organizationId: organization.id,
        data: {
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
          const message = tOrganizations(
            "location.actions.updateLocation.success",
          );
          enqueueSnackbar(message, { variant: "success" });

          closeDialog();

          fetchOrganization();
        },
      },
    );
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox
      component="form"
      id="update-location-form"
      onSubmit={onSubmit}
    >
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
        setValue={setValue}
      />
    </StyledBox>
  );
};

export default UpdateLocationDialog;
