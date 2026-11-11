"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type SpecialHoursForm,
  useSpecialHoursFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import OpeningHoursField from "@/components/OpeningHoursField";

import { PLATFORM_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  FormControlLabel,
  FormHelperText,
  Switch,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  CreateSpecialHoursDto,
  SpecialHours,
} from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const toStoreDate = (date: string) =>
  date ? dayjs.tz(date, PLATFORM_TIMEZONE) : null;

interface SpecialHoursDialogProps {
  mutate: () => Promise<unknown>;
  organizationSlug: string;
  specialHours?: SpecialHours;
}

const SpecialHoursDialog = ({
  mutate,
  organizationSlug,
  specialHours,
}: SpecialHoursDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tOrganizations = useTranslations("organizations");

  const specialHoursFormSchema = useSpecialHoursFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<SpecialHoursForm>({
    defaultValues: {
      closed: specialHours ? specialHours.openingHours === null : true,
      note: specialHours?.note ?? "",
      openingHours: specialHours?.openingHours ?? "",
      validFrom: specialHours?.validFrom ?? "",
      validThrough: specialHours?.validThrough ?? "",
    },
    resolver: zodResolver(specialHoursFormSchema),
  });

  const [closed, openingHours, validFrom, validThrough] = useWatch({
    control,
    name: ["closed", "openingHours", "validFrom", "validThrough"],
  });

  const onSubmitHandler = async (values: SpecialHoursForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<SpecialHours>(
        `/api/organizations/${organizationSlug}/special-hours${specialHours ? `/${specialHours.id}` : ""}`,
        {
          body: JSON.stringify({
            note: values.note || null,
            openingHours: values.closed ? null : values.openingHours,
            validFrom: values.validFrom,
            validThrough: values.validThrough,
          } satisfies CreateSpecialHoursDto),
          headers: { "Content-Type": "application/json" },
          method: specialHours ? "PATCH" : "POST",
        },
      );

      enqueueSnackbar(
        tOrganizations(
          specialHours
            ? "specialHours.actions.update.success"
            : "specialHours.actions.create.success",
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

  return (
    <FormBox id="special-hours-form" onSubmit={onSubmit}>
      <DatePicker
        label={tOrganizations("specialHours.validFrom.label")}
        onChange={(value) =>
          setValue(
            "validFrom",
            value?.isValid() ? value.format("YYYY-MM-DD") : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.validFrom,
            fullWidth: true,
            helperText: errors.validFrom?.message,
            required: true,
          },
        }}
        timezone={PLATFORM_TIMEZONE}
        value={toStoreDate(validFrom)}
      />
      <DatePicker
        disablePast
        label={tOrganizations("specialHours.validThrough.label")}
        minDate={toStoreDate(validFrom) ?? undefined}
        onChange={(value) =>
          setValue(
            "validThrough",
            value?.isValid() ? value.format("YYYY-MM-DD") : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.validThrough,
            fullWidth: true,
            helperText: errors.validThrough?.message,
            required: true,
          },
        }}
        timezone={PLATFORM_TIMEZONE}
        value={toStoreDate(validThrough)}
      />
      <FormControlLabel
        control={
          <Switch
            checked={closed}
            onChange={(_event, checked) =>
              setValue("closed", checked, { shouldValidate: isSubmitted })
            }
          />
        }
        label={tOrganizations("specialHours.closed.label")}
      />
      {!closed && (
        <>
          <OpeningHoursField
            error={!!errors.openingHours}
            fullWidth
            label={tOrganizations("specialHours.openingHours.label")}
            onChange={(value) =>
              setValue("openingHours", value, { shouldValidate: isSubmitted })
            }
            value={openingHours}
          />
          <FormHelperText error={!openingHours && !!errors.openingHours}>
            {!openingHours && errors.openingHours
              ? errors.openingHours.message
              : tOrganizations("specialHours.openingHours.helperText")}
          </FormHelperText>
        </>
      )}
      <TextField
        error={!!errors.note}
        fullWidth
        helperText={errors.note?.message}
        label={`${tOrganizations("specialHours.note.label")} ${tCommon("optional")}`}
        placeholder={tOrganizations("specialHours.note.placeholder")}
        {...register("note")}
      />
    </FormBox>
  );
};

export default SpecialHoursDialog;
