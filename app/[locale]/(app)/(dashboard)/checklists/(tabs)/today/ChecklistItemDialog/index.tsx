"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { MEASUREMENT_LIMIT } from "../../templates/ChecklistTemplateDialog/definitions";
import {
  type ChecklistItemForm,
  useChecklistItemFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberField from "@/components/NumberField";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  ChecklistRunItem,
  FillChecklistItemDto,
} from "@/types/checklists";

import { getErrorMessage } from "@/utils/errors";
import type { FetchError } from "@/utils/fetcher";

export const CHECKLIST_ITEM_FORM_ID = "checklist-item-form";

interface ChecklistItemDialogProps {
  item: ChecklistRunItem;
  onSubmit: (dto: FillChecklistItemDto) => Promise<void>;
  rangeText: string | null;
}

const ChecklistItemDialog = ({
  item,
  onSubmit,
  rangeText,
}: ChecklistItemDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tChecklists = useTranslations("checklists");

  const checklistItemFormSchema = useChecklistItemFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<ChecklistItemForm>({
    defaultValues: {
      actionNote: item.actionNote ?? "",
      value: item.value === null ? "" : String(item.value),
    },
    resolver: zodResolver(checklistItemFormSchema),
  });

  const value = useWatch({ control, name: "value" });

  const onSubmitHandler = async ({ actionNote, value }: ChecklistItemForm) => {
    try {
      setDialog({ confirmLoading: true });

      await onSubmit({ actionNote: actionNote || null, value: Number(value) });

      closeDialog();
    } catch (error) {
      if ((error as FetchError).info?.code === "checklistActionNoteRequired")
        setError("actionNote", { message: getErrorMessage(error) });
      else enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      if ((error as FetchError).info?.code === "checklistBusinessDateChanged")
        closeDialog();
      else setDialog({ confirmLoading: false });
    }
  };

  const onSubmitForm = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id={CHECKLIST_ITEM_FORM_ID} onSubmit={onSubmitForm}>
      <NumberField
        error={!!errors.value}
        fullWidth
        helperText={errors.value?.message ?? rangeText ?? undefined}
        label={tChecklists("templates.items.type.number")}
        max={MEASUREMENT_LIMIT}
        min={-MEASUREMENT_LIMIT}
        onValueChange={(value) =>
          setValue("value", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        required
        value={value ? Number(value) : null}
      />
      <TextField
        error={!!errors.actionNote}
        fullWidth
        helperText={
          errors.actionNote?.message ?? tChecklists("runs.actionNoteHint")
        }
        label={tChecklists("runs.actionNote")}
        multiline
        slotProps={{ htmlInput: { maxLength: 200 } }}
        {...register("actionNote")}
      />
    </FormBox>
  );
};

export default ChecklistItemDialog;
