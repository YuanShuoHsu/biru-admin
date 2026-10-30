"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type CreateMenuSectionForm,
  useCreateMenuSectionFormSchema,
} from "./definitions";

import OrderTicketPrinterField from "@/app/[locale]/(app)/(dashboard)/menus/OrderTicketPrinterField";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { apiClient } from "@/lib/api-client";

import { useDialogStore } from "@/providers/dialog-store-provider";

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
    defaultValues: { name: {}, description: {}, orderTicketPrinterId: null },
    resolver: zodResolver(createMenuSectionFormSchema),
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
  }: CreateMenuSectionForm) => {
    try {
      setDialog({ confirmLoading: true });

      await apiClient.POST("/api/menus/{menuId}/menu-sections", {
        params: { path: { menuId } },
        body: {
          name,
          description,
          ...(imageSrc && { image: imageSrc }),
          orderTicketPrinterId,
        },
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
      <OrderTicketPrinterField
        menuId={menuId}
        onChange={(value) => setValue("orderTicketPrinterId", value)}
        scope="section"
        value={orderTicketPrinterId}
      />
    </FormBox>
  );
};

export default CreateMenuSectionDialog;
