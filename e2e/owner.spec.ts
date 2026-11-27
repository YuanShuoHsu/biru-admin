import { expect, test } from "@playwright/test";

import { storageStateOf } from "./auth";
import { expectNoErrorScreen } from "./pages";

test.use({ storageState: storageStateOf("OWNER") });

test("shows the dashboard", async ({ page }) => {
  await page.goto("/en/dashboard");
  await page.waitForURL(/organization=e2e-store/);

  await expect(page.getByRole("combobox", { name: "Organization" })).toHaveText(
    "E2E Store",
  );
  await expect(
    page.getByRole("heading", { name: "Total Orders" }),
  ).toBeVisible();
  await expectNoErrorScreen(page);
});

const PAGES = [
  { path: "/en/orders/board", tab: "Order Board" },
  { path: "/en/orders/list", tab: "Order List" },
  { path: "/en/menus/sections", tab: "Sections", text: "Coffee" },
  {
    path: "/en/inventory/ingredients",
    tab: "Ingredient",
    text: "Espresso beans",
  },
  { path: "/en/attendance/schedule/calendar", tab: "Roster" },
];

for (const { path, tab, text } of PAGES) {
  test(`loads ${path}`, async ({ page }) => {
    await page.goto(path);

    await expect(
      page.getByRole("tab", { name: tab, exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    if (text)
      await expect(page.getByRole("gridcell", { name: text })).toBeVisible();
    await expectNoErrorScreen(page);
  });
}
