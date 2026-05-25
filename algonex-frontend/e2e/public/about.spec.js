import { test, expect } from "@playwright/test";

test.describe("About Us Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aboutus");
    await page.waitForSelector("h1", { timeout: 15000 });
  });

  test("about page loads", async ({ page }) => {
    await expect(page.getByText("About Algonex")).toBeVisible();
  });

  test("tab navigation: Mission → Vision → Story", async ({ page }) => {
    // Click Mission (default)
    await page
      .getByRole("button", { name: "Our Mission" })
      .click();
    await expect(page.getByText(/bridge the gap/i)).toBeVisible();

    // Click Vision
    await page
      .getByRole("button", { name: "Our Vision" })
      .click();
    await expect(
      page.getByText(/most trusted tech training/i)
    ).toBeVisible();

    // Click Story
    await page
      .getByRole("button", { name: "Our Story" })
      .click();
    await expect(page.getByText(/started in 2020/i)).toBeVisible();
  });

  test("default tab is Mission", async ({ page }) => {
    await expect(page.getByText(/bridge the gap/i)).toBeVisible();
  });

  test("stats section: 4 stat cards", async ({ page }) => {
    await expect(page.getByText("5,000+").first()).toBeVisible();
    await expect(page.getByText("95%").first()).toBeVisible();
    await expect(page.getByText("50+").first()).toBeVisible();
    await expect(page.getByText("4.8/5").first()).toBeVisible();
  });

  test("values section: 6 cards", async ({ page }) => {
    const valuesSection = page.getByText("Our Core Values");
    await valuesSection.scrollIntoViewIfNeeded();
    await expect(page.getByText("Innovation").first()).toBeVisible();
    await expect(page.getByText("Community").first()).toBeVisible();
    await expect(page.getByText("Excellence").first()).toBeVisible();
    await expect(page.getByText("Integrity").first()).toBeVisible();
    await expect(page.getByText("Impact").first()).toBeVisible();
    await expect(page.getByText("Accessibility").first()).toBeVisible();
  });

  test("timeline: milestones", async ({ page }) => {
    const journeySection = page.getByText("Our Journey");
    await journeySection.scrollIntoViewIfNeeded();
    // Check for at least 5 milestone years
    await expect(page.getByText("2020").first()).toBeVisible();
    await expect(page.getByText("2021").first()).toBeVisible();
    await expect(page.getByText("2022").first()).toBeVisible();
    await expect(page.getByText("2023").first()).toBeVisible();
    await expect(page.getByText("2024").first()).toBeVisible();
    await expect(page.getByText("Founded").first()).toBeVisible();
  });

  test("team section: member cards", async ({ page }) => {
    const teamSection = page.getByText("Leadership Team");
    await teamSection.scrollIntoViewIfNeeded();
    // At least 3 team members
    await expect(page.getByText("Ganesh").first()).toBeVisible();
    await expect(page.getByText("Priya Reddy").first()).toBeVisible();
    await expect(page.getByText("Arjun Menon").first()).toBeVisible();
  });

  test("'Browse Courses' CTA → /allcourses", async ({ page }) => {
    const browseBtn = page
      .getByRole("button", { name: /Browse Courses/i })
      .first();
    await browseBtn.scrollIntoViewIfNeeded();
    await browseBtn.click();
    await page.waitForURL(/\/(allcourses|courses)/);
  });

  test("'Contact Us' CTA → /contact", async ({ page }) => {
    // The CTA section has a "Contact Us" button
    const contactBtn = page
      .getByRole("button", { name: /Contact Us/i })
      .first();
    await contactBtn.scrollIntoViewIfNeeded();
    await contactBtn.click();
    await page.waitForURL("/contact");
  });
});
