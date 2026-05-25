import { test, expect } from "@playwright/test";

test.describe("Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Scroll to footer
    await page.locator("footer").scrollIntoViewIfNeeded();
  });

  test("footer renders on page", async ({ page }) => {
    await expect(page.locator("footer")).toBeVisible();
    await expect(
      page.locator("footer").getByRole("heading", { name: "Algonex" })
    ).toBeVisible();
  });

  test("social links: LinkedIn, GitHub, Twitter", async ({ page }) => {
    const footer = page.locator("footer");
    // 3 social links with href attributes
    const socialLinks = footer.locator(
      'a[href*="linkedin"], a[href*="github"], a[href*="twitter"]'
    );
    expect(await socialLinks.count()).toBe(3);
  });

  test("quick links: 5 navigation links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByText("Quick Links")).toBeVisible();
    await expect(
      footer.getByRole("link", { name: "Home", exact: true })
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: "Courses", exact: true })
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: "Events", exact: true })
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: "About Us", exact: true })
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: "Contact", exact: true })
    ).toBeVisible();
  });

  test("popular courses: 4 course links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByText("Popular Courses")).toBeVisible();
    await expect(footer.getByText("Python Full Stack")).toBeVisible();
    await expect(footer.getByText("MERN Stack")).toBeVisible();
    await expect(footer.getByText("Data Analytics")).toBeVisible();
    await expect(footer.getByText("Java Full Stack")).toBeVisible();
  });

  test("contact info: address, phone, email", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByText("Marthahalli")).toBeVisible();
    await expect(footer.getByText("+91")).toBeVisible();
    await expect(footer.getByText("contact@algonex.in")).toBeVisible();
  });

  test("copyright year is current", async ({ page }) => {
    const footer = page.locator("footer");
    const year = new Date().getFullYear().toString();
    await expect(footer.getByText(year)).toBeVisible();
  });

  test("'Privacy Policy' navigates to /privacy", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.getByText("Privacy Policy").click();
    await page.waitForURL("/privacy");
  });

  test("'Terms of Service' navigates to /terms", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.getByText("Terms of Service").click();
    await page.waitForURL("/terms");
  });

  test("quick links navigate correctly", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.getByRole("link", { name: "Courses", exact: true }).click();
    await page.waitForURL(/\/(allcourses|courses)/);
  });
});
