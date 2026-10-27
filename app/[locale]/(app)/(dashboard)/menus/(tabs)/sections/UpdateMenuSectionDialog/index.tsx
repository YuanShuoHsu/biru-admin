"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type UpdateMenuSectionForm,
  useUpdateMenuSectionFormSchema,
} from "./definitions";

import OrderTicketPrinterField from "@/app/[locale]/(app)/(dashboard)/menus/OrderTicketPrinterField";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { apiClient } from "@/lib/api-client";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuSection } from "@/types/menus";

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
      orderTicketPrinterId: section.orderTicketPrinterId,
    },
    resolver: zodResolver(updateMenuSectionFormSchema),
  });

  const nameValue = useWatch({ control, name: "name" });
  const descriptionValue = useWatch({ control, name: "description" });
  const orderTicketPrinterId = useWatch({
    control,
    name: "orderTicketPrinterId",
  });

  const onSubmitHandler = async ({
    name,
    description,
    orderTicketPrinterId,
  }: UpdateMenuSectionForm) => {
    try {
      setDialog({ confirmLoading: true });

      await apiClient.PATCH("/api/menu-sections/{sectionId}", {
        params: { path: { sectionId: section.id } },
        body: {
          name,
          description,
          ...(imageSrc !== (section.image || null) && { image: imageSrc }),
          orderTicketPrinterId,
        },
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
      <OrderTicketPrinterField
        menuId={section.menuId}
        onChange={(value) => setValue("orderTicketPrinterId", value)}
        scope="section"
        value={orderTicketPrinterId}
      />
    </FormBox>
  );
};

export default UpdateMenuSectionDialog;
