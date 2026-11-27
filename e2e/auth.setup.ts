// https://playwright.dev/docs/auth#multiple-signed-in-roles

import { test as setup } from "@playwright/test";

import { ROLES, signIn, storageStateOf } from "./auth";

for (const role of ROLES) {
  setup(`authenticate as ${role.toLowerCase()}`, async ({ page }) => {
    await signIn(page, role);
    await page.waitForURL(/\/en\/dashboard/);

    await page.context().storageState({ path: storageStateOf(role) });
  });
}
