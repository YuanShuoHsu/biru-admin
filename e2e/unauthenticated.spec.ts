import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("redirects to the sign-in page", async ({ page }) => {
  await page.goto("/en/orders/board");

  await expect(page).toHaveURL("/en/auth/sign-in?redirectTo=%2Forders%2Fboard");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});
