"use client";

import { type CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type AddWaitlistTicketForm,
  useAddWaitlistTicketFormSchema,
} from "./definitions";

import CountryAutocomplete from "@/components/CountryAutocomplete";
import FormBox from "@/components/FormBox";
import TextMaskCustom from "@/components/TextMaskCustom";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, Grid, MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AdminWaitlistTicket,
  CreateWaitlistTicketDto,
} from "@/types/waitlist";

import { getPhoneDefaults, getPhoneFormatting } from "@/utils/countries";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { getWaitlistErrorCode } from "@/utils/waitlist";

interface AddWaitlistTicketDialogProps {
  maxPartySize: number;
  onCreated: () => void;
  organizationSlug: string;
  unavailable: "closed" | "cutoff" | "paused" | null;
}

const AddWaitlistTicketDialog = ({
  maxPartySize,
  onCreated,
  organizationSlug,
  unavailable,
}: AddWaitlistTicketDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");
  const tWaitlist = useTranslations("waitlist");

  const addWaitlistTicketFormSchema = useAddWaitlistTicketFormSchema();

  const phoneDefaults = getPhoneDefaults(null, locale);

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<AddWaitlistTicketForm>({
    defaultValues: {
      countryCode: phoneDefaults.countryCode || "",
      email: "",
      name: "",
      partySize: "",
      telephone: "",
    },
    resolver: zodResolver(addWaitlistTicketFormSchema),
  });

  const [countryCode, partySize, telephone] = useWatch({
    control,
    name: ["countryCode", "partySize", "telephone"],
  });

  const { mask, placeholder } = getPhoneFormatting(countryCode);

  const onSubmitHandler = async ({
    countryCode,
    email,
    name,
    partySize,
    telephone,
  }: AddWaitlistTicketForm) => {
    try {
      setDialog({ confirmLoading: true });

      const ticket = await fetcher<AdminWaitlistTicket>(
        `/api/organizations/${organizationSlug}/waitlist/tickets/admin`,
        {
          body: JSON.stringify({
            email: email || undefined,
            name,
            partySize: Number(partySize),
            phoneNumber: parsePhoneNumberWithError(
              telephone,
              countryCode as CountryCode,
            ).number,
          } satisfies CreateWaitlistTicketDto),
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          method: "POST",
        },
      );

      enqueueSnackbar(
        tWaitlist("add.success", { ticketNumber: ticket.ticketNumber }),
        { variant: "success" },
      );

      closeDialog();

      onCreated();
    } catch (error) {
      const code = getWaitlistErrorCode(error);

      enqueueSnackbar(
        code ? tWaitlist(`errors.${code}`) : getErrorMessage(error),
        { variant: "error" },
      );

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="add-waitlist-ticket-form" noValidate onSubmit={onSubmit}>
      {unavailable && (
        <Alert severity="info">
          {tWaitlist(`add.unavailable.${unavailable}`)}
        </Alert>
      )}
      <TextField
        {...register("partySize")}
        error={!!errors.partySize}
        fullWidth
        helperText={errors.partySize?.message}
        label={tWaitlist("add.partySize.label")}
        required
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) =>
              selected ? (
                tWaitlist("add.partySize.value", { count: Number(selected) })
              ) : (
                <em>{tWaitlist("add.partySize.placeholder")}</em>
              ),
          },
        }}
        value={partySize}
      >
        {Array.from({ length: maxPartySize }, (_, index) => index + 1).map(
          (count) => (
            <MenuItem key={count} value={String(count)}>
              {tWaitlist("add.partySize.value", { count })}
            </MenuItem>
          ),
        )}
      </TextField>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tOrder("checkout.customer.name.label")}
        placeholder={tOrder("checkout.customer.name.placeholder")}
        required
        {...register("name")}
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CountryAutocomplete
            error={!!errors.countryCode}
            helperText={errors.countryCode?.message}
            label={tOrder("checkout.customer.countryCode.label")}
            mode="country"
            placeholder={tOrder("checkout.customer.countryCode.placeholder")}
            required
            value={countryCode}
            {...register("countryCode")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register("telephone")}
            error={!!errors.telephone}
            fullWidth
            helperText={errors.telephone?.message}
            label={tOrder("checkout.customer.telephone.label")}
            onChange={(e) =>
              setValue("telephone", e.target.value, {
                shouldValidate: isSubmitted,
              })
            }
            required
            slotProps={{
              input: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                inputComponent: TextMaskCustom as any,
                inputProps: { mask, placeholder },
              },
            }}
            type="tel"
            value={telephone}
          />
        </Grid>
      </Grid>
      <TextField
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={`${tOrder("checkout.customer.email.label")} ${tCommon("optional")}`}
        placeholder={tOrder("checkout.customer.email.placeholder")}
        type="email"
        {...register("email")}
      />
    </FormBox>
  );
};

export default AddWaitlistTicketDialog;
