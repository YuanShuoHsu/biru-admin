import { type Locator, expect, test } from "@playwright/test";

import { storageStateOf } from "./auth";

test.use({ storageState: storageStateOf("OWNER") });

const LANGUAGE_TABS = [
  "Traditional Chinese",
  "English",
  "Japanese",
  "Korean",
  "Simplified Chinese",
];

const fillItemName = async (dialog: Locator, name: string) => {
  for (const tab of LANGUAGE_TABS) {
    await dialog.getByRole("tab", { name: tab }).click();
    await dialog.getByRole("textbox", { name: "Item name" }).fill(name);
  }
};

test("adds, renames and deletes a menu item", async ({ page }, testInfo) => {
  test.slow();

  const name = `E2E item ${testInfo.project.name}`;
  const renamed = `${name} renamed`;

  await page.goto("/en/menus/sections");
  await page
    .getByRole("row", { name: /Coffee/ })
    .getByRole("button", { name: "View items" })
    .click();

  await page.getByRole("button", { name: "Add item" }).click();
  const addDialog = page.getByRole("dialog", { name: "Add item" });
  await fillItemName(addDialog, name);
  await addDialog
    .getByRole("textbox", { name: "Price", exact: true })
    .fill("80");
  await addDialog.getByRole("button", { name: "Confirm" }).click();
  await expect(addDialog).toBeHidden();

  const row = (itemName: string) =>
    page.getByRole("row").filter({
      has: page.getByRole("gridcell", { name: itemName, exact: true }),
    });
  await expect(row(name)).toBeVisible();

  await row(name).getByRole("button", { name: "Edit item" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit item" });
  await fillItemName(editDialog, renamed);
  await editDialog.getByRole("button", { name: "Confirm" }).click();
  await expect(editDialog).toBeHidden();
  await expect(row(renamed)).toBeVisible();

  await row(renamed).getByRole("button", { name: "Delete item" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm" })
    .click();
  await expect(row(renamed)).toHaveCount(0);
});
