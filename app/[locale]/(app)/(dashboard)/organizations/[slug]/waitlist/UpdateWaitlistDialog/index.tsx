"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import {
  type UpdateWaitlistForm,
  getMinPartySize,
  useWaitlistFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberField from "@/components/NumberField";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { Add, DeleteOutlined } from "@mui/icons-material";
import {
  Button,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  UpdateWaitlistSettingsDto,
  WaitlistSettingsResponse,
} from "@/types/waitlist";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { getWaitlistErrorCode } from "@/utils/waitlist";

const CUTOFF_MINUTES_MAX = 240;
const GRACE_MINUTES_MAX = 60;
const GROUPS_MAX = 26;
const HOLD_MINUTES_MAX = 60;
const PARTY_SIZE_MAX = 99;

const GroupRowStack = styled(Stack)(({ theme }) => ({
  alignItems: "flex-start",
  gap: theme.spacing(1),
}));

const PrefixTextField = styled(TextField)(({ theme }) => ({
  flexShrink: 0,
  width: theme.spacing(10),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

interface UpdateWaitlistDialogProps {
  onSaved: (settings: WaitlistSettingsResponse) => void;
  organizationName: string;
  organizationSlug: string;
  settings: WaitlistSettingsResponse;
}

const UpdateWaitlistDialog = ({
  onSaved,
  organizationName,
  organizationSlug,
  settings,
}: UpdateWaitlistDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tOrganizations = useTranslations("organizations");
  const tWaitlist = useTranslations("waitlist");

  const waitlistFormSchema = useWaitlistFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<UpdateWaitlistForm>({
    defaultValues: {
      cutoffMinutes: String(settings.cutoffMinutes),
      enabled: settings.enabled,
      graceMinutes: String(settings.graceMinutes),
      groups: settings.groups.map(({ maxPartySize }) => ({
        maxPartySize: String(maxPartySize),
      })),
      holdMinutes: String(settings.holdMinutes),
    },
    resolver: zodResolver(waitlistFormSchema),
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "groups",
  });

  const [cutoffMinutes, enabled, graceMinutes, groups, holdMinutes] = useWatch({
    control,
    name: ["cutoffMinutes", "enabled", "graceMinutes", "groups", "holdMinutes"],
  });

  const handleMaxPartySizeChange = (index: number, value: number | null) => {
    setValue(
      `groups.${index}.maxPartySize`,
      value != null ? String(value) : "",
      { shouldValidate: isSubmitted },
    );

    if (value == null) return;

    let previousMax = value;

    for (let next = index + 1; next < groups.length; next++) {
      const { maxPartySize } = groups[next];

      if (!maxPartySize || Number(maxPartySize) > previousMax) break;

      previousMax += 1;

      setValue(`groups.${next}.maxPartySize`, String(previousMax), {
        shouldValidate: isSubmitted,
      });
    }
  };

  const onSubmitHandler = async (values: UpdateWaitlistForm) => {
    try {
      setDialog({ confirmLoading: true });

      const saved = await fetcher<WaitlistSettingsResponse>(
        `/api/organizations/${organizationSlug}/waitlist/settings`,
        {
          body: JSON.stringify({
            cutoffMinutes: Number(values.cutoffMinutes),
            enabled: values.enabled,
            graceMinutes: Number(values.graceMinutes),
            groups: values.groups.map(({ maxPartySize }, index) => ({
              maxPartySize: Number(maxPartySize),
              minPartySize: getMinPartySize(values.groups, index),
            })),
            holdMinutes: Number(values.holdMinutes),
          } satisfies UpdateWaitlistSettingsDto),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        },
      );

      enqueueSnackbar(
        tOrganizations("waitlist.actions.updateWaitlist.success", {
          name: organizationName,
        }),
        { variant: "success" },
      );

      closeDialog();

      onSaved(saved);
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
    <FormBox id="update-waitlist-form" onSubmit={onSubmit}>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(_event, checked) => setValue("enabled", checked)}
          />
        }
        label={tOrganizations("waitlist.enabled.label")}
      />
      <NumberSpinner
        error={!!errors.holdMinutes}
        fullWidth
        helperText={
          errors.holdMinutes?.message ||
          tOrganizations("waitlist.holdMinutes.helperText")
        }
        label={tOrganizations("waitlist.holdMinutes.label")}
        max={HOLD_MINUTES_MAX}
        min={1}
        onValueChange={(value) =>
          setValue("holdMinutes", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tOrganizations("waitlist.holdMinutes.placeholder")}
        value={holdMinutes !== "" ? Number(holdMinutes) : null}
      />
      <NumberSpinner
        error={!!errors.graceMinutes}
        fullWidth
        helperText={
          errors.graceMinutes?.message ||
          tOrganizations("waitlist.graceMinutes.helperText")
        }
        label={tOrganizations("waitlist.graceMinutes.label")}
        max={GRACE_MINUTES_MAX}
        min={0}
        onValueChange={(value) =>
          setValue("graceMinutes", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tOrganizations("waitlist.graceMinutes.placeholder")}
        value={graceMinutes !== "" ? Number(graceMinutes) : null}
      />
      <NumberSpinner
        error={!!errors.cutoffMinutes}
        fullWidth
        helperText={
          errors.cutoffMinutes?.message ||
          tOrganizations("waitlist.cutoffMinutes.helperText")
        }
        label={tOrganizations("waitlist.cutoffMinutes.label")}
        max={CUTOFF_MINUTES_MAX}
        min={0}
        onValueChange={(value) =>
          setValue("cutoffMinutes", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tOrganizations("waitlist.cutoffMinutes.placeholder")}
        value={cutoffMinutes !== "" ? Number(cutoffMinutes) : null}
      />
      <FormLabel component="legend">
        {tOrganizations("waitlist.groups.label")}
      </FormLabel>
      {fields.map(({ id }, index) => {
        const minPartySize = getMinPartySize(groups, index);

        return (
          <GroupRowStack direction="row" key={id}>
            <PrefixTextField
              disabled
              label={tOrganizations("waitlist.groups.prefix.label")}
              value={String.fromCharCode(65 + index)}
            />
            <TextField
              disabled
              fullWidth
              label={tOrganizations("waitlist.groups.minPartySize.label")}
              value={Number.isNaN(minPartySize) ? "" : minPartySize}
            />
            <NumberField
              error={!!errors.groups?.[index]?.maxPartySize}
              fullWidth
              helperText={errors.groups?.[index]?.maxPartySize?.message}
              label={tOrganizations("waitlist.groups.maxPartySize.label")}
              max={PARTY_SIZE_MAX}
              min={Number.isNaN(minPartySize) ? 1 : minPartySize}
              onValueChange={(value) => handleMaxPartySizeChange(index, value)}
              required
              value={
                groups[index]?.maxPartySize
                  ? Number(groups[index].maxPartySize)
                  : null
              }
            />
            <StyledIconButton
              aria-label={tOrganizations("waitlist.groups.remove")}
              color="error"
              disabled={fields.length === 1}
              onClick={() => remove(index)}
              size="small"
            >
              <DeleteOutlined fontSize="small" />
            </StyledIconButton>
          </GroupRowStack>
        );
      })}
      <FormHelperText>
        {tOrganizations("waitlist.groups.helperText")}
      </FormHelperText>
      <Button
        disabled={fields.length >= GROUPS_MAX}
        onClick={() => append({ maxPartySize: "" })}
        startIcon={<Add />}
        variant="outlined"
      >
        {tOrganizations("waitlist.groups.add")}
      </Button>
    </FormBox>
  );
};

export default UpdateWaitlistDialog;
