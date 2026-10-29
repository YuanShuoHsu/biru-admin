"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type CreateOrganizationForm,
  useCreateOrganizationFormSchema,
} from "./definitions";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import FormBox from "@/components/FormBox";
import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { authClient } from "@/lib/auth-client";

import { Chip, Divider, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  type UpdateLocationForm,
  useUpdateLocationFormSchema,
} from "@/app/[locale]/(app)/(dashboard)/organizations/[slug]/location/UpdateLocationDialog/definitions";
import AddressFields from "@/app/[locale]/(app)/(dashboard)/organizations/AddressFields";

const CREATE_ORGANIZATION_AVATAR_KEY = "create-organization-avatar";

interface CreateOrganizationDialogProps {
  mutate: () => void;
}

const CreateOrganizationDialog = ({
  mutate,
}: CreateOrganizationDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);
  const logo = useUploadAvatarSrc(CREATE_ORGANIZATION_AVATAR_KEY);

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

  const locationFormSchema = useUpdateLocationFormSchema();
  const {
    control: locationControl,
    formState: { errors: locationErrors },
    getValues: getLocationValues,
    handleSubmit: handleLocationSubmit,
    register: registerLocation,
    setValue: setLocationValue,
  } = useForm<UpdateLocationForm>({
    defaultValues: {
      addressCountry: "",
      currency: "TWD",
      addressLocality: "",
      addressRegion: "",
      extendedAddress: "",
      postalCode: "",
      streetAddress: "",
      hasMap: "",
      openingHours: "",
      telephone: "",
    },
    resolver: zodResolver(locationFormSchema),
  });

  const onSubmitHandler = async (
    { name, slug }: CreateOrganizationForm,
    {
      addressCountry,
      currency,
      addressLocality,
      addressRegion,
      extendedAddress,
      postalCode,
      streetAddress,
    }: UpdateLocationForm,
  ) => {
    await authClient.organization.create(
      {
        logo,
        name,
        slug,
        addressCountry,
        currency,
        addressLocality,
        addressRegion,
        extendedAddress,
        postalCode,
        streetAddress,
      },
      {
        onError: ({ error: { message } }) => {
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

          mutate();
        },
      },
    );
  };

  const onSubmit = async (event: BaseSyntheticEvent) => {
    let location: UpdateLocationForm | undefined;
    await handleLocationSubmit((values) => {
      location = values;
    })(event);

    await handleSubmit(async (values) => {
      if (location) await onSubmitHandler(values, location);
    })(event);
  };

  return (
    <>
      <CustomizedDialogContent>
        <FormBox id="create-organization-form" onSubmit={onSubmit}>
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
          <AddressFields
            control={locationControl}
            errors={locationErrors}
            getValues={getLocationValues}
            register={registerLocation}
            setValue={setLocationValue}
          />
        </FormBox>
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default CreateOrganizationDialog;
