import { type Page, expect } from "@playwright/test";

export const ROLES = ["PLATFORM_ADMIN", "OWNER", "ADMIN", "MEMBER"] as const;

export type Role = (typeof ROLES)[number] | "CUSTOMER";

export const storageStateOf = (role: Role) =>
  `playwright/.auth/${role.toLowerCase()}.json`;

const credentialsOf = (role: Role) => {
  const email = process.env[`E2E_${role}_EMAIL`];
  const password = process.env[`E2E_${role}_PASSWORD`];
  if (!email || !password)
    throw new Error(`Missing E2E_${role}_EMAIL or E2E_${role}_PASSWORD`);

  return { email, password };
};

export const signIn = async (page: Page, role: Role) => {
  const { email, password } = credentialsOf(role);

  await page.goto("/en/auth/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);

  // 沒有 client IP 時 better-auth 的登入限流是全平台共用一桶，被擋就等它說的秒數再送
  for (;;) {
    const [response] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().endsWith("/api/auth/sign-in/email"),
      ),
      page.getByRole("button", { name: "Sign in", exact: true }).click(),
    ]);
    if (response.status() !== 429) {
      expect(response.ok()).toBe(true);
      break;
    }

    const retryAfter = Number(response.headers()["x-retry-after"]) || 10;
    await page.waitForTimeout(retryAfter * 1000);
  }
};
