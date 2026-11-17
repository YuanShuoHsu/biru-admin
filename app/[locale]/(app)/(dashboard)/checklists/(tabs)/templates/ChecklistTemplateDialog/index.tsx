"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import {
  type ChecklistTemplateForm,
  ITEMS_MAX,
  MEASUREMENT_LIMIT,
  useChecklistTemplateFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberField from "@/components/NumberField";

import { zodResolver } from "@hookform/resolvers/zod";

import { Add, DeleteOutlined } from "@mui/icons-material";
import {
  Button,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { checklistItemTypeValues, checklistTimingValues } from "@/types/api";
import type {
  ChecklistTemplate,
  CreateChecklistTemplateDto,
} from "@/types/checklists";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ItemRowStack = styled(Stack)(({ theme }) => ({
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const toMeasurement = (value: string) => (value ? Number(value) : null);

interface ChecklistTemplateDialogProps {
  mutate: () => Promise<unknown>;
  organizationSlug: string;
  template?: ChecklistTemplate;
}

const ChecklistTemplateDialog = ({
  mutate,
  organizationSlug,
  template,
}: ChecklistTemplateDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tChecklists = useTranslations("checklists.templates");

  const checklistTemplateFormSchema = useChecklistTemplateFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ChecklistTemplateForm>({
    defaultValues: {
      enabled: template?.enabled ?? true,
      items:
        template?.items.map(
          ({ id, label, maxValue, minValue, type, unit }) => ({
            itemId: id,
            label,
            maxValue: maxValue === null ? "" : String(maxValue),
            minValue: minValue === null ? "" : String(minValue),
            type,
            unit: unit ?? "",
          }),
        ) ?? [],
      name: template?.name ?? "",
      timing: template?.timing ?? "opening",
    },
    resolver: zodResolver(checklistTemplateFormSchema),
  });

  const { append, fields, remove } = useFieldArray({ control, name: "items" });

  const [enabled, items, timing] = useWatch({
    control,
    name: ["enabled", "items", "timing"],
  });

  const onSubmitHandler = async (values: ChecklistTemplateForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<ChecklistTemplate>(
        `/api/organizations/${organizationSlug}/checklists/templates${template ? `/${template.id}` : ""}`,
        {
          body: JSON.stringify({
            enabled: values.enabled,
            items: values.items.map(
              ({ itemId, label, maxValue, minValue, type, unit }) => ({
                id: itemId,
                label,
                maxValue: toMeasurement(maxValue),
                minValue: toMeasurement(minValue),
                type,
                unit: unit || null,
              }),
            ),
            name: values.name,
            timing: values.timing,
          } satisfies CreateChecklistTemplateDto),
          headers: { "Content-Type": "application/json" },
          method: template ? "PATCH" : "POST",
        },
      );

      enqueueSnackbar(
        tChecklists(
          template ? "actions.update.success" : "actions.create.success",
        ),
        { variant: "success" },
      );

      closeDialog();

      await mutate();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  const measurementField = (index: number, name: "maxValue" | "minValue") => (
    <NumberField
      error={!!errors.items?.[index]?.[name]}
      helperText={errors.items?.[index]?.[name]?.message}
      label={tChecklists(`items.${name}`)}
      max={MEASUREMENT_LIMIT}
      min={-MEASUREMENT_LIMIT}
      onValueChange={(value) =>
        setValue(`items.${index}.${name}`, value != null ? String(value) : "", {
          shouldValidate: isSubmitted,
        })
      }
      value={toMeasurement(items[index]?.[name] ?? "")}
    />
  );

  return (
    <FormBox id="checklist-template-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tChecklists("name")}
        required
        {...register("name")}
      />
      <TextField
        fullWidth
        label={tChecklists("timing.label")}
        onChange={(event) =>
          setValue(
            "timing",
            event.target.value as ChecklistTemplateForm["timing"],
          )
        }
        select
        value={timing}
      >
        {checklistTimingValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tChecklists(`timing.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(_event, checked) => setValue("enabled", checked)}
          />
        }
        label={tChecklists("enabled")}
      />
      <FormLabel component="legend">{tChecklists("items.label")}</FormLabel>
      {fields.map(({ id }, index) => (
        <ItemRowStack direction="row" key={id}>
          <TextField
            error={!!errors.items?.[index]?.label}
            helperText={errors.items?.[index]?.label?.message}
            label={tChecklists("items.itemLabel")}
            required
            {...register(`items.${index}.label`)}
          />
          <TextField
            label={tChecklists("items.type.label")}
            onChange={(event) =>
              setValue(
                `items.${index}.type`,
                event.target
                  .value as ChecklistTemplateForm["items"][number]["type"],
                { shouldValidate: isSubmitted },
              )
            }
            select
            value={items[index]?.type ?? "check"}
          >
            {checklistItemTypeValues.map((value) => (
              <MenuItem key={value} value={value}>
                {tChecklists(`items.type.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          {items[index]?.type === "number" && (
            <>
              <TextField
                label={tChecklists("items.unit")}
                slotProps={{ htmlInput: { maxLength: 10 } }}
                {...register(`items.${index}.unit`)}
              />
              {measurementField(index, "minValue")}
              {measurementField(index, "maxValue")}
            </>
          )}
          <StyledIconButton
            aria-label={tChecklists("items.remove")}
            color="error"
            onClick={() => remove(index)}
            size="small"
          >
            <DeleteOutlined fontSize="small" />
          </StyledIconButton>
        </ItemRowStack>
      ))}
      <Button
        disabled={fields.length >= ITEMS_MAX}
        onClick={() =>
          append({
            label: "",
            maxValue: "",
            minValue: "",
            type: "check",
            unit: "",
          })
        }
        startIcon={<Add />}
        variant="outlined"
      >
        {tChecklists("items.add")}
      </Button>
    </FormBox>
  );
};

export default ChecklistTemplateDialog;
