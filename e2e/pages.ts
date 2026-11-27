import { type Page, expect } from "@playwright/test";

export const expectNoErrorScreen = async (page: Page) => {
  await expect(page.getByText("Failed to load")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toHaveCount(0);
};
