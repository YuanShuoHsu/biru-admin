"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type CreateMenuSectionForm,
  useCreateMenuSectionFormSchema,
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

const CREATE_MENU_SECTION_IMAGE_KEY = "create-menu-section-image";

interface CreateMenuSectionDialogProps {
  menuId: string;
  mutate: () => void;
}

const CreateMenuSectionDialog = ({
  menuId,
  mutate,
}: CreateMenuSectionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const imageSrc = useUploadAvatarSrc(CREATE_MENU_SECTION_IMAGE_KEY);

  const createMenuSectionFormSchema = useCreateMenuSectionFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<CreateMenuSectionForm>({
    defaultValues: { name: {}, description: {} },
    resolver: zodResolver(createMenuSectionFormSchema),
  });

  const nameValue = useWatch({ control, name: "name" });
  const descriptionValue = useWatch({ control, name: "description" });

  const onSubmitHandler = async ({
    name,
    description,
  }: CreateMenuSectionForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<MenuSection>(`/api/menus/${menuId}/menu-sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          ...(imageSrc && { image: imageSrc }),
        }),
      });

      enqueueSnackbar(
        tMenus("sections.actions.createSection.success", {
          name: localize(name, locale),
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tMenus("sections.actions.createSection.error"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="create-section-form" onSubmit={onSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        shape="square"
        uploadKey={CREATE_MENU_SECTION_IMAGE_KEY}
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

export default CreateMenuSectionDialog;
