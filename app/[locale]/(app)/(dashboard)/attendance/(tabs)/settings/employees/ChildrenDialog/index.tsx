"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { closeSnackbar, enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import { type ChildForm, useChildFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { MAX_PAGE_SIZE } from "@/constants/pagination";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Delete, Edit } from "@mui/icons-material";
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceParentalChild,
  AttendanceParentalChildPage,
} from "@/types/attendance";

import { attendancePath } from "@/utils/attendance";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const defaultValues = (): ChildForm => ({
  birthDate: dayjs().tz(STORE_TIMEZONE).startOf("day").toISOString(),
  label: "",
  reference: "",
});

interface ChildrenDialogProps {
  canDelete: boolean;
  canUpdate: boolean;
  employee: { email: string; id: string; name: string };
  mutate: () => void;
  organizationSlug: string;
}

const ChildrenDialog = ({
  canDelete,
  canUpdate,
  employee,
  mutate,
  organizationSlug,
}: ChildrenDialogProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const [editingId, setEditingId] = useState<string>();

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const childFormSchema = useChildFormSchema();

  const base = attendancePath(organizationSlug, "org", "children");

  const { data: { data: children } = { data: [] }, mutate: mutateChildren } =
    useSWR(
      `${base}?${new URLSearchParams({
        filterField: "employeeEmail",
        filterOperator: "equals",
        filterValue: employee.email,
        limit: String(MAX_PAGE_SIZE),
      }).toString()}`,
      (url: string) => fetcher<AttendanceParentalChildPage>(url),
    );

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<ChildForm>({
    defaultValues: defaultValues(),
    resolver: zodResolver(childFormSchema),
  });

  const birthDate = useWatch({ control, name: "birthDate" });

  const refresh = () => {
    mutateChildren();
    mutate();
  };

  const childBody = (values: ChildForm) => ({
    ...values,
    birthDate: dayjs(values.birthDate)
      .tz(STORE_TIMEZONE)
      .startOf("day")
      .toISOString(),
  });

  const create = (values: ChildForm) =>
    fetcher(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...childBody(values), employeeId: employee.id }),
    });

  const edit = (child?: AttendanceParentalChild) => {
    setEditingId(child?.id);

    reset(
      child
        ? {
            birthDate: child.birthDate,
            label: child.label,
            reference: child.reference,
          }
        : defaultValues(),
    );

    setDialog({
      confirmText: tAttendance(
        child ? "save" : "parentalChildren.actions.create",
      ),
    });
  };

  const handleDelete = async ({
    birthDate,
    id,
    label,
    reference,
  }: AttendanceParentalChild) => {
    try {
      await fetcher(`${base}/${id}`, { method: "DELETE" });

      if (id === editingId) edit();

      enqueueSnackbar(tAttendance("parentalChildren.deleted", { label }), {
        action: (key) => (
          <Button
            color="inherit"
            onClick={async () => {
              closeSnackbar(key);

              try {
                await create({ birthDate, label, reference });
              } catch (error) {
                enqueueSnackbar(getErrorMessage(error), { variant: "error" });
              }

              refresh();
            }}
            size="small"
          >
            {tAttendance("parentalChildren.undo")}
          </Button>
        ),
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    }

    refresh();
  };

  const onSubmitHandler = async (values: ChildForm) => {
    try {
      setDialog({ confirmLoading: true });

      if (editingId)
        await fetcher(`${base}/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(childBody(values)),
        });
      else await create(values);

      enqueueSnackbar(
        tAttendance(
          editingId ? "parentalChildren.updated" : "parentalChildren.created",
          { name: employee.name },
        ),
        { variant: "success" },
      );

      edit();

      refresh();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    }

    setDialog({ confirmLoading: false });
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="attendance-child-form" onSubmit={onSubmit}>
      {children.length > 0 && (
        <List dense disablePadding>
          {children.map((child) => (
            <ListItem
              disableGutters
              key={child.id}
              secondaryAction={
                <>
                  {canUpdate && (
                    <Tooltip
                      title={tAttendance(
                        editingId === child.id
                          ? "parentalChildren.actions.cancelEdit"
                          : "parentalChildren.actions.update",
                      )}
                    >
                      <IconButton
                        color={editingId === child.id ? "primary" : "default"}
                        onClick={() =>
                          edit(editingId === child.id ? undefined : child)
                        }
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDelete && child.deletable && (
                    <Tooltip
                      title={tAttendance("parentalChildren.actions.delete")}
                    >
                      <IconButton
                        color="error"
                        edge="end"
                        onClick={() => handleDelete(child)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              }
            >
              <ListItemText
                primary={child.label}
                secondary={`${child.reference} · ${format.dateTime(new Date(child.birthDate), "date")}`}
              />
            </ListItem>
          ))}
        </List>
      )}
      <TextField
        error={!!errors.reference}
        fullWidth
        helperText={
          errors.reference?.message ?? tAttendance("parentalChildHint")
        }
        label={tAttendance("childReference")}
        required
        {...register("reference")}
      />
      <TextField
        error={!!errors.label}
        fullWidth
        helperText={errors.label?.message}
        label={tAttendance("childLabel")}
        required
        {...register("label")}
      />
      <DatePicker
        label={tAttendance("childBirthDate")}
        onChange={(value) =>
          setValue(
            "birthDate",
            value?.isValid() ? value.startOf("day").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.birthDate,
            fullWidth: true,
            helperText: errors.birthDate?.message,
            required: true,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={birthDate ? dayjs(birthDate) : null}
      />
    </FormBox>
  );
};

export default ChildrenDialog;
