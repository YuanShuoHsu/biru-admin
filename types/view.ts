import { ViewDirections, ViewGridSizes } from "@/constants/view";

export type ViewMode = keyof typeof ViewGridSizes;
export type ViewDirection = (typeof ViewDirections)[ViewMode];
