"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type UpdateDineInTableCountForm,
  useDineInTableCountFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { DINE_IN_MAX_TABLE_COUNT } from "@/constants/dineIn";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@/lib/auth-client";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrganizationResponse } from "@/types/organizations";

interface UpdateDineInTableCountDialogProps {
  fetchOrganization: () => void;
  organization: OrganizationResponse;
}

const UpdateDineInTableCountDialog = ({
  fetchOrganization,
  organization,
}: UpdateDineInTableCountDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tOrganizations = useTranslations("organizations");

  const dineInTableCountFormSchema = useDineInTableCountFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<UpdateDineInTableCountForm>({
    defaultValues: {
      dineInTableCount:
        organization.dineInTableCount != null
          ? String(organization.dineInTableCount)
          : "",
    },
    resolver: zodResolver(dineInTableCountFormSchema),
  });

  const dineInTableCount = useWatch({ control, name: "dineInTableCount" });

  const onSubmitHandler = async (values: UpdateDineInTableCountForm) => {
    await authClient.organization.update(
      {
        organizationId: organization.id,
        data: { dineInTableCount: Number(values.dineInTableCount) },
      },
      {
        onError: ({ error: { message } }) => {
          enqueueSnackbar(message, { variant: "error" });

          setDialog({ confirmLoading: false });
        },
        onRequest: () => setDialog({ confirmLoading: true }),
        onSuccess: () => {
          const message = tOrganizations(
            "inStore.dineIn.actions.updateTableCount.success",
            { name: organization.name },
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
    <FormBox id="update-dine-in-table-count-form" onSubmit={onSubmit}>
      <NumberSpinner
        error={!!errors.dineInTableCount}
        fullWidth
        helperText={
          errors.dineInTableCount?.message ||
          tOrganizations("inStore.dineIn.tableCount.helperText", {
            max: DINE_IN_MAX_TABLE_COUNT,
          })
        }
        label={tOrganizations("inStore.dineIn.tableCount.label")}
        max={DINE_IN_MAX_TABLE_COUNT}
        min={1}
        onValueChange={(value) =>
          setValue("dineInTableCount", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tOrganizations("inStore.dineIn.tableCount.placeholder")}
        value={dineInTableCount !== "" ? Number(dineInTableCount) : null}
      />
    </FormBox>
  );
};

export default UpdateDineInTableCountDialog;
