import { test, expect } from "@playwright/test";
import { registerUser } from "../helpers/auth.helper.js";
import { antMessage } from "../helpers/selectors.js";

test.describe("Profile Page", () => {
  let creds;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    creds = await registerUser(page, { prefix: "auth_profile", firstName: "ProfileFirst", lastName: "ProfileLast" });
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/signin");
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Password").fill(creds.password);
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 15000 });
    await page.goto("/profile");
    await page.waitForSelector(".ant-card", { timeout: 10000 });
  });

  test("profile page loads with user data", async ({ page }) => {
    await expect(page.locator(".ant-card .ant-avatar")).toBeVisible();
    await expect(page.getByText("ProfileFirst ProfileLast")).toBeVisible();
    await expect(page.getByText(creds.email)).toBeVisible();
  });

  test("form pre-populated with registration data", async ({ page }) => {
    const firstNameInput = page.locator("#first_name");
    const lastNameInput = page.locator("#last_name");
    await expect(firstNameInput).toHaveValue("ProfileFirst");
    await expect(lastNameInput).toHaveValue("ProfileLast");
  });

  test("update first name and last name", async ({ page }) => {
    await page.locator("#first_name").clear();
    await page.locator("#first_name").fill("UpdatedFirst");
    await page.locator("#last_name").clear();
    await page.locator("#last_name").fill("UpdatedLast");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.locator(antMessage)).toBeVisible({ timeout: 5000 });

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector("#first_name", { timeout: 10000 });
    await expect(page.locator("#first_name")).toHaveValue("UpdatedFirst");
  });

  test("update phone and bio", async ({ page }) => {
    await page.locator("#phone").clear();
    await page.locator("#phone").fill("9876543210");
    await page.locator("#bio").clear();
    await page.locator("#bio").fill("Test bio content");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.locator(antMessage)).toBeVisible({ timeout: 5000 });

    await page.reload();
    await page.waitForSelector("#phone", { timeout: 10000 });
    await expect(page.locator("#phone")).toHaveValue("9876543210");
  });

  test("email field is read-only", async ({ page }) => {
    // Email is displayed as plain text, not an editable field
    await expect(page.getByText(creds.email)).toBeVisible();
    // There should be no editable email input in the form
    const emailInputs = page.locator('input[name="email"]');
    await expect(emailInputs).toHaveCount(0);
  });

  test("save with no changes succeeds", async ({ page }) => {
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.locator(antMessage)).toBeVisible({ timeout: 5000 });
  });

  test("loading state on Save button", async ({ page }) => {
    await page.route("**/api/v1/auth/user/", async (route) => {
      if (route.request().method() === "PATCH") {
        await new Promise((r) => setTimeout(r, 1500));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await page.getByRole("button", { name: "Save Changes" }).click();
    // Check button has loading state
    await expect(page.locator("button.ant-btn-loading")).toBeVisible({ timeout: 2000 });
  });

  test("navbar updates after profile save", async ({ page }) => {
    await page.locator("#first_name").clear();
    await page.locator("#first_name").fill("NavUpdate");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.locator(antMessage)).toBeVisible({ timeout: 5000 });

    // Check navbar dropdown trigger shows updated name
    await expect(page.locator("nav").getByText("NavUpdate")).toBeVisible({ timeout: 10000 });
  });
});
