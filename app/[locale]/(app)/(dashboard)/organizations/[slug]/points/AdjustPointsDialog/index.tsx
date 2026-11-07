"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  ADJUST_POINTS_LIMIT,
  type AdjustPointsForm,
  useAdjustPointsFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface AdjustPointsDialogProps {
  mutate: () => void;
  organizationSlug: string;
  ownerOnlyAbovePoints: number | null;
}

const AdjustPointsDialog = ({
  mutate,
  organizationSlug,
  ownerOnlyAbovePoints,
}: AdjustPointsDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tOrganizations = useTranslations("organizations");

  const adjustPointsFormSchema = useAdjustPointsFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<AdjustPointsForm>({
    defaultValues: { email: "", points: "", note: "" },
    resolver: zodResolver(adjustPointsFormSchema),
  });

  const points = useWatch({ control, name: "points" });

  const onSubmitHandler = async ({ email, points, note }: AdjustPointsForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        `/api/organizations/${organizationSlug}/point-transactions/adjustments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, points: Number(points), note }),
        },
      );

      enqueueSnackbar(tOrganizations("points.adjust.success", { email }), {
        variant: "success",
      });

      closeDialog();

      mutate();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="adjust-points-form" onSubmit={onSubmit}>
      {ownerOnlyAbovePoints !== null && (
        <Alert severity="info">
          {tOrganizations("points.adjust.ownerOnly", {
            points: ownerOnlyAbovePoints,
          })}
        </Alert>
      )}
      <TextField
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={tOrganizations("points.adjust.email.label")}
        placeholder={tOrganizations("points.adjust.email.placeholder")}
        required
        type="email"
        {...register("email")}
      />
      <NumberSpinner
        error={!!errors.points}
        fullWidth
        helperText={
          errors.points?.message || tOrganizations("points.adjust.points.hint")
        }
        label={tOrganizations("points.adjust.points.label")}
        max={ADJUST_POINTS_LIMIT}
        min={-ADJUST_POINTS_LIMIT}
        onValueChange={(value) =>
          setValue("points", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tOrganizations("points.adjust.points.placeholder")}
        required
        value={points !== "" ? Number(points) : null}
      />
      <TextField
        error={!!errors.note}
        fullWidth
        helperText={errors.note?.message}
        label={tOrganizations("points.adjust.note.label")}
        multiline
        placeholder={tOrganizations("points.adjust.note.placeholder")}
        required
        slotProps={{ htmlInput: { maxLength: 200 } }}
        {...register("note")}
      />
    </FormBox>
  );
};

export default AdjustPointsDialog;
