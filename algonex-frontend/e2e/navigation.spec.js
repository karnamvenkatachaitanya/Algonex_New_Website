import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/aboutus");
    await expect(page).toHaveURL(/aboutus/);
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page).toHaveURL(/contact/);
  });

  test("events page loads", async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveURL(/events/);
  });

  test("careers page loads", async ({ page }) => {
    await page.goto("/careers");
    await expect(page).toHaveURL(/careers/);
  });

  test("products page loads", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/products/);
  });
});
