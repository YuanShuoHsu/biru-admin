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

const GROUPS_MAX = 26;
const HOLD_MINUTES_MAX = 60;

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
  organizationSlug: string;
  settings: WaitlistSettingsResponse;
}

const UpdateWaitlistDialog = ({
  onSaved,
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
    register,
    setValue,
  } = useForm<UpdateWaitlistForm>({
    defaultValues: {
      enabled: settings.enabled,
      groups: settings.groups.map(({ maxPartySize, prefix }) => ({
        maxPartySize: String(maxPartySize),
        prefix,
      })),
      holdMinutes: String(settings.holdMinutes),
    },
    resolver: zodResolver(waitlistFormSchema),
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "groups",
  });

  const [enabled, groups, holdMinutes] = useWatch({
    control,
    name: ["enabled", "groups", "holdMinutes"],
  });

  const onSubmitHandler = async (values: UpdateWaitlistForm) => {
    try {
      setDialog({ confirmLoading: true });

      const saved = await fetcher<WaitlistSettingsResponse>(
        `/api/organizations/${organizationSlug}/waitlist/settings`,
        {
          body: JSON.stringify({
            enabled: values.enabled,
            groups: values.groups.map(({ maxPartySize, prefix }, index) => ({
              maxPartySize: Number(maxPartySize),
              minPartySize: getMinPartySize(values.groups, index),
              prefix,
            })),
            holdMinutes: Number(values.holdMinutes),
          } satisfies UpdateWaitlistSettingsDto),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        },
      );

      enqueueSnackbar(
        tOrganizations("waitlist.actions.updateWaitlist.success"),
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
      <FormLabel component="legend">
        {tOrganizations("waitlist.groups.label")}
      </FormLabel>
      {fields.map(({ id }, index) => {
        const minPartySize = getMinPartySize(groups, index);

        return (
          <GroupRowStack direction="row" key={id}>
            <PrefixTextField
              {...register(`groups.${index}.prefix`)}
              error={!!errors.groups?.[index]?.prefix}
              helperText={errors.groups?.[index]?.prefix?.message}
              label={tOrganizations("waitlist.groups.prefix.label")}
              onChange={(event) =>
                setValue(
                  `groups.${index}.prefix`,
                  event.target.value.toUpperCase(),
                  { shouldValidate: isSubmitted },
                )
              }
              required
              slotProps={{ htmlInput: { maxLength: 1 } }}
              value={groups[index]?.prefix || ""}
            />
            <TextField
              disabled
              fullWidth
              label={tOrganizations("waitlist.groups.minPartySize.label")}
              value={Number.isNaN(minPartySize) ? "" : minPartySize}
            />
            <TextField
              {...register(`groups.${index}.maxPartySize`)}
              error={!!errors.groups?.[index]?.maxPartySize}
              fullWidth
              helperText={errors.groups?.[index]?.maxPartySize?.message}
              label={tOrganizations("waitlist.groups.maxPartySize.label")}
              required
              slotProps={{ htmlInput: { max: 99, min: 1 } }}
              type="number"
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
        onClick={() =>
          append({
            maxPartySize: "",
            prefix: String.fromCharCode(65 + fields.length),
          })
        }
        startIcon={<Add />}
        variant="outlined"
      >
        {tOrganizations("waitlist.groups.add")}
      </Button>
    </FormBox>
  );
};

export default UpdateWaitlistDialog;
