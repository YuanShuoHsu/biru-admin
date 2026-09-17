"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type GenerateForm, useGenerateFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface GenerateDialogProps {
  mutate: () => void;
  organizationSlug: string;
  templateId: string;
}

const GenerateDialog = ({
  mutate,
  organizationSlug,
  templateId,
}: GenerateDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const generateFormSchema = useGenerateFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<GenerateForm>({
    defaultValues: {
      from: dayjs().tz(STORE_TIMEZONE).startOf("day").toISOString(),
      to: dayjs()
        .tz(STORE_TIMEZONE)
        .add(28, "day")
        .startOf("day")
        .toISOString(),
    },
    resolver: zodResolver(generateFormSchema),
  });

  const [from, to] = useWatch({ control, name: ["from", "to"] });

  const onSubmitHandler = async (values: GenerateForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(
          organizationSlug,
          "all",
          `templates/${templateId}/generate`,
        ),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: dayjs(values.from).tz(STORE_TIMEZONE).format("YYYY-MM-DD"),
            to: dayjs(values.to).tz(STORE_TIMEZONE).format("YYYY-MM-DD"),
          }),
        },
      );

      enqueueSnackbar(tAttendance("success"), { variant: "success" });

      closeDialog();

      mutate();
    } catch (error) {
      enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="attendance-template-generate-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("templateHint")}</Alert>
      <DatePicker
        label={tAttendance("from")}
        maxDate={to ? dayjs(to) : undefined}
        onChange={(date) =>
          setValue("from", date?.isValid() ? date.toISOString() : "", {
            shouldValidate: isSubmitted,
          })
        }
        slotProps={{
          textField: {
            error: !!errors.from,
            fullWidth: true,
            helperText: errors.from?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={from ? dayjs(from) : null}
      />
      <DatePicker
        label={tAttendance("to")}
        minDate={from ? dayjs(from) : undefined}
        onChange={(date) =>
          setValue("to", date?.isValid() ? date.toISOString() : "", {
            shouldValidate: isSubmitted,
          })
        }
        slotProps={{
          textField: {
            error: !!errors.to,
            fullWidth: true,
            helperText: errors.to?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={to ? dayjs(to) : null}
      />
    </FormBox>
  );
};

export default GenerateDialog;
