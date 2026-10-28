"use client";

import { useFormatter, useTranslations } from "next-intl";

import UpdatePointSettingDialog from "./UpdatePointSettingDialog";

import DetailsCard from "@/components/DetailsCard";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { PointSetting } from "@/types/points";

interface PointSettingsProps {
  pointSetting: PointSetting;
}

const PointSettings = ({ pointSetting }: PointSettingsProps) => {
  const format = useFormatter();

  const { setDialog } = useDialogStore((state) => state);

  const tPointSettings = useTranslations("pointSettings");

  const handleUpdate = () =>
    setDialog({
      content: <UpdatePointSettingDialog pointSetting={pointSetting} />,
      formId: "update-point-setting-form",
      open: true,
      title: tPointSettings("update.title"),
    });

  const {
    accountingValuePerPoint,
    amountPerPoint,
    pointsEnabledAt,
    pointsValidityYears,
  } = pointSetting;

  const items = [
    {
      key: "amountPerPoint",
      label: tPointSettings("amountPerPoint.label"),
      value:
        amountPerPoint != null
          ? tPointSettings("amountPerPoint.value", {
              value: Number(amountPerPoint),
            })
          : tPointSettings("amountPerPoint.empty"),
    },
    {
      key: "pointsValidityYears",
      label: tPointSettings("pointsValidityYears.label"),
      value:
        pointsValidityYears != null
          ? tPointSettings("pointsValidityYears.value", {
              value: pointsValidityYears,
            })
          : tPointSettings("pointsValidityYears.empty"),
    },
    {
      key: "pointsEnabledAt",
      label: tPointSettings("pointsEnabledAt.label"),
      value: pointsEnabledAt
        ? format.dateTime(new Date(pointsEnabledAt), "dateTime")
        : tPointSettings("pointsEnabledAt.empty"),
    },
    {
      key: "accountingValuePerPoint",
      label: tPointSettings("accountingValuePerPoint.label"),
      value:
        accountingValuePerPoint != null
          ? tPointSettings("accountingValuePerPoint.value", {
              value: Number(accountingValuePerPoint),
            })
          : tPointSettings("accountingValuePerPoint.empty"),
    },
  ];

  return (
    <DetailsCard
      action={{ label: tPointSettings("update.title"), onClick: handleUpdate }}
      items={items}
    />
  );
};

export default PointSettings;
