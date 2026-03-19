"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm } from "react-hook-form";

import {
  type CreateOrganizationForm,
  useCreateOrganizationFormSchema,
} from "./definitions";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1),
}));

const CreateOrganizationDialogContent = () => {
  const { resetDialog, setDialog } = useDialogStore((s) => s);

  const locale = useLocale();

  const router = useRouter();

  const tOrganizations = useTranslations("organizations");

  const schema = useCreateOrganizationFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateOrganizationForm>({
    defaultValues: { name: "", slug: "" },
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(
    async ({ name, slug }: CreateOrganizationForm) => {
      await authClient.organization.create(
        { name, slug },
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
            router.refresh();
          },
        },
      );
    },
  );

  return (
    <StyledBox
      component="form"
      id="create-organization-form"
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

export default CreateOrganizationDialogContent;
