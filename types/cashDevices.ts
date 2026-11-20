import {
  cashDeviceFilterFieldValues,
  cashDeviceSortFieldValues,
  type components,
} from "@/types/api";

export type CashDevice = components["schemas"]["CashDeviceResponseDto"];
export type CashDeviceListResponse =
  components["schemas"]["CashDeviceListResponseDto"];
export type CreateCashDeviceDto = components["schemas"]["CreateCashDeviceDto"];
export type UpdateCashDeviceDto = components["schemas"]["UpdateCashDeviceDto"];

export type CashDeviceFilterField =
  (typeof cashDeviceFilterFieldValues)[number];
export type CashDeviceSortField = (typeof cashDeviceSortFieldValues)[number];
