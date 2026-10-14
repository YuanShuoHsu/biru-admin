"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type UpdateMenuSectionForm,
  useUpdateMenuSectionFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

interface UpdateMenuSectionDialogProps {
  mutate: () => void;
  section: MenuSection;
}

const UpdateMenuSectionDialog = ({
  mutate,
  section,
}: UpdateMenuSectionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const uploadKey = `update-menu-section-image-${section.id}`;
  const imageSrc = useUploadAvatarSrc(uploadKey, section.image);

  const updateMenuSectionFormSchema = useUpdateMenuSectionFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<UpdateMenuSectionForm>({
    defaultValues: {
      name: section.name ?? {},
      description: section.description ?? {},
    },
    resolver: zodResolver(updateMenuSectionFormSchema),
  });

  const nameValue = useWatch({ control, name: "name" });
  const descriptionValue = useWatch({ control, name: "description" });

  const onSubmitHandler = async ({
    name,
    description,
  }: UpdateMenuSectionForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(`/api/menu-sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          ...(imageSrc !== (section.image || null) && { image: imageSrc }),
        }),
      });

      const displayName = localize(name, locale);

      enqueueSnackbar(
        tMenus("sections.actions.updateSection.success", { name: displayName }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tMenus("sections.actions.updateSection.title"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="update-section-form" onSubmit={onSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        initialSrc={section.image}
        shape="square"
        uploadKey={uploadKey}
      />
      <LocalizedTextFields
        fields={(lang) => [
          {
            error: !!errors.name?.[lang],
            fullWidth: true,
            helperText: errors.name?.[lang]?.message,
            label: tMenus("sections.name.label"),
            onChange: (event) =>
              setValue("name", { ...nameValue, [lang]: event.target.value }),
            placeholder: tMenus("sections.name.placeholder"),
            required: true,
            value: nameValue?.[lang] || "",
          },
          {
            error: !!errors.description?.[lang],
            fullWidth: true,
            helperText: errors.description?.[lang]?.message,
            label: `${tMenus("sections.description.label")} ${tCommon("optional")}`,
            maxRows: 4,
            multiline: true,
            onChange: (event) =>
              setValue("description", {
                ...descriptionValue,
                [lang]: event.target.value,
              }),
            placeholder: tMenus("sections.description.placeholder"),
            slotProps: { htmlInput: { maxLength: 160 } },
            value: descriptionValue?.[lang] || "",
          },
        ]}
      />
    </FormBox>
  );
};

export default UpdateMenuSectionDialog;
