"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { Controller, useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { useDialogStore } from "@/providers/dialog-store-provider";

import { Button, DialogActions, Stack, TextField } from "@mui/material";

interface CreateOrgForm {
  name: string;
  slug: string;
}

const CreateOrgDialogContent = () => {
  const tOrganizations = useTranslations("organizations");
  const router = useRouter();
  const { resetDialog } = useDialogStore((s) => s);

  const { control, handleSubmit, setValue, formState } =
    useForm<CreateOrgForm>({
      defaultValues: { name: "", slug: "" },
    });

  const handleNameChange = (name: string) => {
    setValue("name", name);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setValue("slug", slug);
  };

  const handleCreateSubmit = async (values: CreateOrgForm) => {
    const result = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
    });
    if (result.error) {
      enqueueSnackbar(tOrganizations("create.error"), { variant: "error" });
      return;
    }
    enqueueSnackbar(tOrganizations("create.success"), { variant: "success" });
    resetDialog();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(handleCreateSubmit)}>
      <Stack gap={2} pt={1}>
        <Controller
          name="name"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextField
              {...field}
              onChange={(e) => handleNameChange(e.target.value)}
              label={tOrganizations("create.fields.name")}
              size="small"
              fullWidth
              required
            />
          )}
        />
        <Controller
          name="slug"
          control={control}
          rules={{
            required: true,
            pattern: /^[a-z0-9-]+$/,
          }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={tOrganizations("create.fields.slug")}
              size="small"
              fullWidth
              required
              error={!!fieldState.error}
              helperText={
                fieldState.error
                  ? "只能使用小寫英文、數字與連字號"
                  : undefined
              }
            />
          )}
        />
      </Stack>
      <DialogActions>
        <Button onClick={resetDialog}>取消</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={formState.isSubmitting}
        >
          {tOrganizations("actions.create")}
        </Button>
      </DialogActions>
    </form>
  );
};

export default CreateOrgDialogContent;
