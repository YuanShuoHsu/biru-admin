import { expect, test } from "@playwright/test";

import { type Role, signIn, storageStateOf } from "./auth";
import { expectNoErrorScreen } from "./pages";

const OWNER_ONLY_PAGE = "/en/reports/operating-costs";
const PLATFORM_ADMIN_ONLY_PAGE = "/en/admins";

const testCannotOpen = (role: Role, path: string) =>
  test.describe(() => {
    test.use({ storageState: storageStateOf(role) });

    test(`${role.toLowerCase()} cannot open ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(
        page.getByRole("heading", { name: "Page not found" }),
      ).toBeVisible();
    });
  });

testCannotOpen("MEMBER", OWNER_ONLY_PAGE);
testCannotOpen("ADMIN", OWNER_ONLY_PAGE);
testCannotOpen("OWNER", PLATFORM_ADMIN_ONLY_PAGE);

test.describe(() => {
  test.use({ storageState: storageStateOf("OWNER") });

  test(`owner opens ${OWNER_ONLY_PAGE}`, async ({ page }) => {
    await page.goto(OWNER_ONLY_PAGE);

    await expect(
      page.getByRole("button", { name: "Add fixed cost" }),
    ).toBeVisible();
    await expectNoErrorScreen(page);
  });
});

test.describe(() => {
  test.use({ storageState: storageStateOf("PLATFORM_ADMIN") });

  test(`platform admin opens ${PLATFORM_ADMIN_ONLY_PAGE}`, async ({ page }) => {
    await page.goto(PLATFORM_ADMIN_ONLY_PAGE);

    await expect(page.getByRole("button", { name: "Add user" })).toBeVisible();
    await expectNoErrorScreen(page);
  });
});

test.describe(() => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a customer in no store gets the no-access page", async ({ page }) => {
    await signIn(page, "CUSTOMER");

    await expect(page).toHaveURL("/en/auth/no-access");
    await expect(
      page.getByRole("heading", { name: "No admin access" }),
    ).toBeVisible();

    await page.goto("/en/dashboard");
    await expect(page).toHaveURL("/en/auth/no-access?redirectTo=%2Fdashboard");
  });
});
