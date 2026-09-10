"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type UpdateMenuForm, useUpdateMenuFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Menu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

interface UpdateMenuDialogProps {
  menu: Menu;
  mutate: () => void;
}

const UpdateMenuDialog = ({ menu, mutate }: UpdateMenuDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const uploadKey = `update-menu-image-${menu.id}`;
  const imageSrc = useUploadAvatarSrc(uploadKey, menu.image);

  const updateMenuFormSchema = useUpdateMenuFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<UpdateMenuForm>({
    defaultValues: {
      description: menu.description ?? {},
      image: menu.image ?? "",
      name: menu.name ?? {},
    },
    resolver: zodResolver(updateMenuFormSchema),
  });

  const nameValue = useWatch({ control, name: "name" });
  const descriptionValue = useWatch({ control, name: "description" });

  const onSubmitHandler = async ({ name, description }: UpdateMenuForm) => {
    const displayName = localize(name, locale);

    try {
      setDialog({ confirmLoading: true });

      await fetcher(`/api/menus/${menu.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          ...(imageSrc !== (menu.image || null) && { image: imageSrc }),
        }),
      });

      enqueueSnackbar(
        tMenus("settings.actions.save.success", { name: displayName }),
        { variant: "success" },
      );

      closeDialog();
      mutate();
    } catch {
      enqueueSnackbar(
        tMenus("settings.actions.save.error", { name: displayName }),
        { variant: "error" },
      );

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="update-menu-form" onSubmit={onSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        initialSrc={menu.image ?? undefined}
        shape="square"
        uploadKey={uploadKey}
      />
      <LocalizedTextFields
        fields={(lang) => [
          {
            error: !!errors.name?.[lang],
            fullWidth: true,
            helperText: errors.name?.[lang]?.message,
            label: tMenus("name.label"),
            onChange: (event) =>
              setValue("name", { ...nameValue, [lang]: event.target.value }),
            placeholder: tMenus("name.placeholder"),
            required: true,
            value: nameValue?.[lang] || "",
          },
          {
            error: !!errors.description?.[lang],
            fullWidth: true,
            helperText: errors.description?.[lang]?.message,
            label: `${tMenus("description.label")} ${tCommon("optional")}`,
            maxRows: 4,
            multiline: true,
            onChange: (event) =>
              setValue("description", {
                ...descriptionValue,
                [lang]: event.target.value,
              }),
            placeholder: tMenus("description.placeholder"),
            slotProps: { htmlInput: { maxLength: 160 } },
            value: descriptionValue?.[lang] || "",
          },
        ]}
      />
    </FormBox>
  );
};

export default UpdateMenuDialog;
