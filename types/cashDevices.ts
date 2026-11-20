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
export type CashDenominations = components["schemas"]["CashDenominationsDto"];
export type CashDeviceEvent =
  components["schemas"]["CashDeviceEventResponseDto"];
export type CashDeviceEventListResponse =
  components["schemas"]["CashDeviceEventListResponseDto"];
export type CreateCashDeviceRefillDto =
  components["schemas"]["CreateCashDeviceRefillDto"];
export type CreateCashDeviceCollectionDto =
  components["schemas"]["CreateCashDeviceCollectionDto"];

export type CashDeviceFilterField =
  (typeof cashDeviceFilterFieldValues)[number];
export type CashDeviceSortField = (typeof cashDeviceSortFieldValues)[number];
