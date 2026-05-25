import { test, expect } from "@playwright/test";
import { antMessageSuccess, antMessageError } from "../helpers/selectors.js";

test.describe("Contact Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
    await page.waitForSelector("form", { timeout: 15000 });
  });

  test("contact page loads", async ({ page }) => {
    await expect(page.getByText("Get in Touch")).toBeVisible();
    await expect(page.locator("form")).toBeVisible();
  });

  test("contact info cards: email, phone, address, hours", async ({
    page,
  }) => {
    await expect(page.getByText("Email Us")).toBeVisible();
    await expect(page.getByText("Call Us")).toBeVisible();
    await expect(page.getByText("Visit Us")).toBeVisible();
    await expect(page.getByText("Business Hours")).toBeVisible();
  });

  test("submit valid form → success toast + form reset", async ({ page }) => {
    // Fill form fields
    await page.getByLabel("Full Name").fill("Pub Test User");
    await page
      .getByLabel("Email")
      .fill(`pub_contact_${Date.now()}@test.com`);
    await page.getByLabel("Subject").fill("Test Subject");
    await page.getByLabel("Message").fill("Hello from E2E test");

    // Submit
    await page.getByRole("button", { name: /Send Message/i }).click();

    // Wait for success toast
    await expect(page.locator(antMessageSuccess)).toBeVisible({
      timeout: 10000,
    });

    // Form should be reset (fields empty)
    await expect(page.getByLabel("Full Name")).toHaveValue("");
    await expect(page.getByLabel("Message")).toHaveValue("");
  });

  test("validation: empty required fields", async ({ page }) => {
    // Click send without filling
    await page.getByRole("button", { name: /Send Message/i }).click();
    await page.waitForTimeout(500);
    // Validation errors should appear
    await expect(page.getByText("Please enter your name")).toBeVisible();
    await expect(page.getByText("Please enter your email")).toBeVisible();
    await expect(page.getByText("Please enter a subject")).toBeVisible();
    await expect(page.getByText("Please enter your message")).toBeVisible();
  });

  test("validation: invalid email format", async ({ page }) => {
    await page.getByLabel("Full Name").fill("Test");
    await page.getByLabel("Email").fill("notanemail");
    await page.getByLabel("Subject").fill("Test");
    await page.getByLabel("Message").fill("Test message");
    await page.getByRole("button", { name: /Send Message/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText("Please enter a valid email")).toBeVisible();
  });

  test("phone is optional", async ({ page }) => {
    await page.getByLabel("Full Name").fill("Pub Test No Phone");
    await page
      .getByLabel("Email")
      .fill(`pub_nophone_${Date.now()}@test.com`);
    await page.getByLabel("Subject").fill("Test No Phone");
    await page.getByLabel("Message").fill("Testing without phone");
    // Don't fill phone
    await page.getByRole("button", { name: /Send Message/i }).click();
    await expect(page.locator(antMessageSuccess)).toBeVisible({
      timeout: 10000,
    });
  });

  test("error toast on API failure", async ({ page }) => {
    await page.route("**/api/v1/contact/submit-form/", (route) =>
      route.fulfill({ status: 500 })
    );
    await page.getByLabel("Full Name").fill("Pub Error Test");
    await page
      .getByLabel("Email")
      .fill(`pub_error_${Date.now()}@test.com`);
    await page.getByLabel("Subject").fill("Error Test");
    await page.getByLabel("Message").fill("This should fail");
    await page.getByRole("button", { name: /Send Message/i }).click();
    await expect(page.locator(antMessageError)).toBeVisible({
      timeout: 10000,
    });
  });

  test("loading state on submit button", async ({ page }) => {
    await page.route("**/api/v1/contact/submit-form/", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success" }),
      });
    });
    await page.getByLabel("Full Name").fill("Pub Loading Test");
    await page
      .getByLabel("Email")
      .fill(`pub_loading_${Date.now()}@test.com`);
    await page.getByLabel("Subject").fill("Loading Test");
    await page.getByLabel("Message").fill("Testing loading state");
    await page.getByRole("button", { name: /Send Message/i }).click();
    // Button should show loading spinner
    const btn = page.getByRole("button", { name: /Send Message/i });
    await expect(btn.locator(".ant-btn-loading-icon")).toBeVisible({
      timeout: 3000,
    });
  });

  test("Google Maps embed renders", async ({ page }) => {
    const iframe = page.locator("iframe[title='Algonex Location']");
    await expect(iframe).toBeVisible();
  });

  test("form fields are 'large' size", async ({ page }) => {
    // Ant Design large inputs have ant-input-lg class
    const largeInputs = page.locator(".ant-input-lg, .ant-input-affix-wrapper-lg");
    expect(await largeInputs.count()).toBeGreaterThan(0);
  });
});
