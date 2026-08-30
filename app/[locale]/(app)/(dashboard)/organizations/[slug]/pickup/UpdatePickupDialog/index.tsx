"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type UpdatePickupForm, usePickupFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrganizationResponse } from "@/types/organizations";

interface UpdatePickupDialogProps {
  fetchOrganization: () => void;
  organization: OrganizationResponse;
}

const UpdatePickupDialog = ({
  fetchOrganization,
  organization,
}: UpdatePickupDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tOrganizations = useTranslations("organizations");

  const pickupFormSchema = usePickupFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<UpdatePickupForm>({
    defaultValues: {
      enabled: organization.pickupSchedulingEnabled,
      pickupCutoffMinutes: String(organization.pickupCutoffMinutes),
      pickupLeadMinutes: String(organization.pickupLeadMinutes),
      pickupMaxAdvanceDays: String(organization.pickupMaxAdvanceDays),
    },
    resolver: zodResolver(pickupFormSchema),
  });

  const [
    enabled,
    pickupCutoffMinutes,
    pickupLeadMinutes,
    pickupMaxAdvanceDays,
  ] = useWatch({
    control,
    name: [
      "enabled",
      "pickupCutoffMinutes",
      "pickupLeadMinutes",
      "pickupMaxAdvanceDays",
    ],
  });

  const onSubmitHandler = async (values: UpdatePickupForm) => {
    await authClient.organization.update(
      {
        organizationId: organization.id,
        data: {
          pickupSchedulingEnabled: values.enabled,
          pickupCutoffMinutes: Number(
            values.pickupCutoffMinutes || organization.pickupCutoffMinutes,
          ),
          pickupLeadMinutes: Number(
            values.pickupLeadMinutes || organization.pickupLeadMinutes,
          ),
          pickupMaxAdvanceDays: Number(
            values.pickupMaxAdvanceDays || organization.pickupMaxAdvanceDays,
          ),
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
          const message = tOrganizations("pickup.actions.updatePickup.success");
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
    <FormBox id="update-pickup-form" onSubmit={onSubmit}>
      <FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(_, checked) => setValue("enabled", checked)}
            />
          }
          label={tOrganizations("pickup.enabled.label")}
          sx={{ alignSelf: "flex-start" }}
        />
        <FormHelperText>
          {tOrganizations("pickup.enabled.helperText")}
        </FormHelperText>
      </FormControl>
      <NumberSpinner
        disabled={!enabled}
        error={!!errors.pickupLeadMinutes}
        fullWidth
        helperText={
          errors.pickupLeadMinutes?.message ||
          tOrganizations("pickup.pickupLeadMinutes.helperText")
        }
        label={tOrganizations("pickup.pickupLeadMinutes.label")}
        min={0}
        onValueChange={(value) =>
          setValue("pickupLeadMinutes", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tOrganizations("pickup.pickupLeadMinutes.placeholder")}
        value={pickupLeadMinutes !== "" ? Number(pickupLeadMinutes) : null}
      />
      <NumberSpinner
        disabled={!enabled}
        error={!!errors.pickupMaxAdvanceDays}
        fullWidth
        helperText={
          errors.pickupMaxAdvanceDays?.message ||
          tOrganizations("pickup.pickupMaxAdvanceDays.helperText")
        }
        label={tOrganizations("pickup.pickupMaxAdvanceDays.label")}
        min={0}
        onValueChange={(value) =>
          setValue("pickupMaxAdvanceDays", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tOrganizations("pickup.pickupMaxAdvanceDays.placeholder")}
        value={
          pickupMaxAdvanceDays !== "" ? Number(pickupMaxAdvanceDays) : null
        }
      />
      <NumberSpinner
        disabled={!enabled}
        error={!!errors.pickupCutoffMinutes}
        fullWidth
        helperText={
          errors.pickupCutoffMinutes?.message ||
          tOrganizations("pickup.pickupCutoffMinutes.helperText")
        }
        label={tOrganizations("pickup.pickupCutoffMinutes.label")}
        min={0}
        onValueChange={(value) =>
          setValue("pickupCutoffMinutes", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tOrganizations("pickup.pickupCutoffMinutes.placeholder")}
        value={pickupCutoffMinutes !== "" ? Number(pickupCutoffMinutes) : null}
      />
    </FormBox>
  );
};

export default UpdatePickupDialog;
