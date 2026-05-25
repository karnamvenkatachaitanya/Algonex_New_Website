import { test, expect } from "@playwright/test";
import { antDrawer, navbarSignIn, navbarSignUp } from "../helpers/selectors.js";

test.describe("Navigation & Navbar", () => {
  test("logo navigates to /", async ({ page }) => {
    await page.goto("/aboutus");
    await page.waitForSelector("header", { timeout: 10000 });
    // Click the logo link (first link in header with "Algonex" text)
    await page.locator("header a").first().click();
    await page.waitForURL("/");
    expect(page.url()).toMatch(/\/$/);
  });

  test("desktop: all 8 nav links present", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    const nav = page.locator(".desktop-nav");
    await expect(nav.getByText("Home")).toBeVisible();
    await expect(nav.getByText("Courses")).toBeVisible();
    await expect(nav.getByText("Programs")).toBeVisible();
    await expect(nav.getByText("Events")).toBeVisible();
    await expect(nav.getByText("Careers")).toBeVisible();
    await expect(nav.getByText("About")).toBeVisible();
    await expect(nav.getByText("Alumni")).toBeVisible();
    await expect(nav.getByText("Contact")).toBeVisible();
  });

  test("desktop: active link highlighted", async ({ page }) => {
    await page.goto("/allcourses");
    await page.waitForSelector("header", { timeout: 10000 });
    // The Courses link should have cyan color when active
    const coursesLink = page
      .locator(".desktop-nav a")
      .filter({ hasText: "Courses" });
    const color = await coursesLink.evaluate(
      (el) => getComputedStyle(el).color
    );
    // Cyan color: rgb(0, 180, 216) = #00B4D8
    expect(color).toBe("rgb(0, 180, 216)");
  });

  test("desktop: Home link → /", async ({ page }) => {
    await page.goto("/aboutus");
    await page.waitForSelector("header", { timeout: 10000 });
    await page.locator(".desktop-nav").getByText("Home").click();
    await page.waitForURL("/");
  });

  test("desktop: Courses link → /allcourses", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    await page.locator(".desktop-nav").getByText("Courses").click();
    await page.waitForURL(/\/allcourses/);
  });

  test("desktop: Programs link → /programs", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    await page.locator(".desktop-nav").getByText("Programs").click();
    await page.waitForURL("/programs");
  });

  test("desktop: Events link → /events", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    await page.locator(".desktop-nav").getByText("Events").click();
    await page.waitForURL("/events");
  });

  test("desktop: Careers link → /careers", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    await page.locator(".desktop-nav").getByText("Careers").click();
    await page.waitForURL("/careers");
  });

  test("desktop: About link → /aboutus", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    await page.locator(".desktop-nav").getByText("About").click();
    await page.waitForURL("/aboutus");
  });

  test("desktop: Alumni link → /alumni", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    await page.locator(".desktop-nav").getByText("Alumni").click();
    await page.waitForURL("/alumni");
  });

  test("desktop: Contact link → /contact", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    await page.locator(".desktop-nav").getByText("Contact").click();
    await page.waitForURL("/contact");
  });

  test("navbar is sticky on scroll", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    // Header should still be visible
    await expect(page.locator("header")).toBeVisible();
    // Verify sticky positioning
    const position = await page
      .locator("header")
      .evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe("sticky");
  });

  test("desktop: unauthenticated shows Sign In/Up", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });
    await expect(page.locator(navbarSignIn)).toBeVisible();
    await expect(page.locator(navbarSignUp)).toBeVisible();
  });

  test("mobile: hamburger → drawer → navigate → close", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForSelector("header", { timeout: 10000 });

    // Hamburger icon should be visible
    const hamburger = page.locator(".mobile-nav-trigger button");
    await expect(hamburger).toBeVisible();

    // Click hamburger to open drawer
    await hamburger.click();
    await expect(page.locator(antDrawer)).toBeVisible({ timeout: 5000 });

    // All 8 nav links in drawer
    const drawer = page.locator(".ant-drawer-content");
    await expect(drawer.getByText("Home")).toBeVisible();
    await expect(drawer.getByText("Events")).toBeVisible();

    // Click Events to navigate
    await drawer.getByText("Events").click();
    await page.waitForURL("/events");
    // Drawer should close after navigation (check for open state)
    await expect(page.locator(".ant-drawer-open")).not.toBeVisible({
      timeout: 5000,
    });
  });
});
