"use client";

import {
  type FieldPath,
  type FieldError,
  type UseFormReturn,
  get,
  useWatch,
} from "react-hook-form";

import { InputAdornment, MenuItem, TextField } from "@mui/material";

import type { BotFormValues } from "./definitions";

export type BotForm = UseFormReturn<BotFormValues>;

interface FieldProps {
  adornment?: string;
  form: BotForm;
  helperText?: React.ReactNode;
  label: string;
  name: FieldPath<BotFormValues>;
  required?: boolean;
}

const errorOf = (form: BotForm, name: string) =>
  get(form.formState.errors, name) as FieldError | undefined;

export const NumberField = ({
  adornment,
  form,
  helperText,
  label,
  name,
  required = false,
}: FieldProps) => {
  const value = useWatch({ control: form.control, name }) as string | undefined;
  const error = errorOf(form, name);

  return (
    <TextField
      {...form.register(name)}
      error={!!error}
      fullWidth
      helperText={error?.message ?? helperText}
      label={label}
      required={required}
      slotProps={{
        htmlInput: { inputMode: "decimal" },
        input: adornment
          ? {
              endAdornment: (
                <InputAdornment position="end">{adornment}</InputAdornment>
              ),
            }
          : undefined,
      }}
      value={value ?? ""}
    />
  );
};

interface SelectFieldProps extends Omit<FieldProps, "adornment"> {
  options: { label: string; value: string }[];
}

export const SelectField = ({
  form,
  helperText,
  label,
  name,
  options,
  required = false,
}: SelectFieldProps) => {
  const value = useWatch({ control: form.control, name }) as string;
  const error = errorOf(form, name);

  return (
    <TextField
      {...form.register(name)}
      error={!!error}
      fullWidth
      helperText={error?.message ?? helperText}
      label={label}
      required={required}
      select
      value={value}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};
