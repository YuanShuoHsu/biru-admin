"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  type UpdatePointsForm,
  useUpdatePointsFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization } from "@/types/organizations";

interface UpdatePointsDialogProps {
  fetchOrganization: () => void;
  organization: Organization;
}

const UpdatePointsDialog = ({
  fetchOrganization,
  organization,
}: UpdatePointsDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tOrganizations = useTranslations("organizations");

  const updatePointsFormSchema = useUpdatePointsFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<UpdatePointsForm>({
    defaultValues: {
      amountPerPoint:
        organization.amountPerPoint != null
          ? String(Number(organization.amountPerPoint))
          : "",
      pointsValidityYears:
        organization.pointsValidityYears != null
          ? String(organization.pointsValidityYears)
          : "",
    },
    resolver: zodResolver(updatePointsFormSchema),
  });

  const [amountPerPoint, pointsValidityYears] = useWatch({
    control,
    name: ["amountPerPoint", "pointsValidityYears"],
  });

  const onSubmitHandler = async (values: UpdatePointsForm) => {
    const enabled = values.amountPerPoint !== "";

    await authClient.organization.update(
      {
        organizationId: organization.id,
        data: {
          // required:false 欄位 server 端為 nullish，null 用來清除設定；client 型別未涵蓋 null
          amountPerPoint: (enabled
            ? Number(values.amountPerPoint)
            : null) as unknown as number | undefined,
          pointsValidityYears: (values.pointsValidityYears
            ? Number(values.pointsValidityYears)
            : null) as unknown as number | undefined,
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
          const message = tOrganizations("points.actions.updatePoints.success");
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
    <FormBox id="update-points-form" onSubmit={onSubmit}>
      <NumericFormat
        allowNegative={false}
        customInput={TextField}
        decimalScale={2}
        error={!!errors.amountPerPoint}
        fullWidth
        helperText={
          errors.amountPerPoint?.message ||
          tOrganizations("points.amountPerPoint.hint")
        }
        isAllowed={({ floatValue }) =>
          floatValue === undefined || floatValue <= 99999999.99
        }
        label={`${tOrganizations("points.amountPerPoint.label")} ${tCommon("optional")}`}
        name="amountPerPoint"
        onValueChange={({ value }) =>
          setValue("amountPerPoint", value, { shouldValidate: isSubmitted })
        }
        placeholder={tOrganizations("points.amountPerPoint.placeholder")}
        thousandSeparator=","
        value={amountPerPoint}
        valueIsNumericString
      />
      <NumberSpinner
        clearable
        error={!!errors.pointsValidityYears}
        fullWidth
        helperText={errors.pointsValidityYears?.message}
        label={`${tOrganizations("points.pointsValidityYears.label")} ${tCommon("optional")}`}
        min={1}
        onValueChange={(value) =>
          setValue("pointsValidityYears", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tOrganizations("points.pointsValidityYears.placeholder")}
        value={pointsValidityYears !== "" ? Number(pointsValidityYears) : null}
      />
    </FormBox>
  );
};

export default UpdatePointsDialog;
