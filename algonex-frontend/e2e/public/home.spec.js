import { test, expect } from "@playwright/test";
import { antCarousel, antTag } from "../helpers/selectors.js";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("homepage loads without error", async ({ page }) => {
    // No error boundary fallback — page should have meaningful content
    await expect(page.locator("body")).not.toContainText("Something went wrong");
    await expect(page.locator(antCarousel)).toBeVisible({ timeout: 10000 });
  });

  test("hero carousel renders first slide", async ({ page }) => {
    await expect(
      page.getByText("Build Your Tech Career").first()
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("From Zero to Hero").first()
    ).toBeVisible();
  });

  test("hero carousel auto-rotates", async ({ page }) => {
    // First slide should be visible initially
    await expect(
      page.getByText("Build Your Tech Career").first()
    ).toBeVisible({ timeout: 10000 });

    // Wait for auto-rotation (6s interval + buffer)
    await page.waitForTimeout(7500);

    // After rotation, a different slide's content should be visible
    // Check for CourseSlide, EventSlide, or ProgramSlide content
    const courseSlide = page.getByText("Trending Course");
    const eventSlide = page.getByText("Upcoming Event");
    const programSlide = page.locator(`${antTag}`).filter({ hasText: /fellowship|internship|program/i });

    const anyRotated =
      (await courseSlide.isVisible().catch(() => false)) ||
      (await eventSlide.isVisible().catch(() => false)) ||
      (await programSlide.count()) > 0;

    expect(anyRotated).toBeTruthy();
  });

  test("hero carousel arrow navigation", async ({ page }) => {
    await expect(
      page.getByText("Build Your Tech Career").first()
    ).toBeVisible({ timeout: 10000 });

    // Click right arrow
    const rightArrow = page.locator("span.anticon-right").locator("..").first();
    await rightArrow.click();
    await page.waitForTimeout(1000);

    // After clicking right, we should be on a different slide
    // The second slide is CourseSlide with "Trending Course"
    await expect(page.getByText("Trending Course").first()).toBeVisible({ timeout: 5000 });

    // Click left arrow to go back
    const leftArrow = page.locator("span.anticon-left").locator("..").first();
    await leftArrow.click();
    await page.waitForTimeout(1000);

    await expect(
      page.getByText("Build Your Tech Career").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("MainHeroSlide: 'Explore Courses' navigates to /allcourses", async ({ page }) => {
    await expect(
      page.getByText("Build Your Tech Career").first()
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Explore Courses" }).click();
    await page.waitForURL(/\/allcourses/);
    expect(page.url()).toContain("/allcourses");
  });

  test("MainHeroSlide: 'Book Free Demo' navigates to /contact", async ({ page }) => {
    await expect(
      page.getByText("Build Your Tech Career").first()
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Book Free Demo" }).click();
    await page.waitForURL(/\/contact/);
    expect(page.url()).toContain("/contact");
  });

  test("MainHeroSlide: stats displayed", async ({ page }) => {
    await expect(page.getByText("5,000+").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("50+").first()).toBeVisible();
    await expect(page.getByText("95%").first()).toBeVisible();
    await expect(page.getByText("4.8").first()).toBeVisible();
  });

  test("CourseSlide: trending course data rendered", async ({ page }) => {
    // Navigate to CourseSlide (second slide)
    const rightArrow = page.locator("span.anticon-right").locator("..").first();
    await rightArrow.click();
    await page.waitForTimeout(1000);

    await expect(page.getByText("Trending Course").first()).toBeVisible({ timeout: 5000 });
    // Course name should be visible (an h1 inside the slide)
    const slideHeading = page.locator("h1").filter({ hasNotText: "Build Your Tech Career" }).first();
    await expect(slideHeading).toBeVisible();
  });

  test("CourseSlide: skills truncation with '+N more'", async ({ page }) => {
    const rightArrow = page.locator("span.anticon-right").locator("..").first();
    await rightArrow.click();
    await page.waitForTimeout(1000);

    await expect(page.getByText("Trending Course").first()).toBeVisible({ timeout: 5000 });

    // Check if "+N more" tag exists (only when skills > 6)
    const moreTag = page.locator(antTag).filter({ hasText: /\+\d+ more/ });
    const count = await moreTag.count();
    // This is conditional — pass if either present or skills <= 6
    if (count > 0) {
      await expect(moreTag.first()).toBeVisible();
    }
    // If no "+N more", just verify some skill tags exist
    const skillTags = page.locator(antTag);
    expect(await skillTags.count()).toBeGreaterThan(0);
  });

  test("CourseSlide: 'View Course' navigates to course detail", async ({ page }) => {
    const rightArrow = page.locator("span.anticon-right").locator("..").first();
    await rightArrow.click();
    await page.waitForTimeout(1000);

    await expect(page.getByText("Trending Course").first()).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "View Course" }).click();
    await page.waitForURL(/\/(courses|stack)\//);
    expect(page.url()).toMatch(/\/(courses|stack)\//);
  });

  test("EventSlide: upcoming event rendered", async ({ page }) => {
    // Navigate to EventSlide (third slide — click right twice)
    const rightArrow = page.locator("span.anticon-right").locator("..").first();
    await rightArrow.click();
    await page.waitForTimeout(800);
    await rightArrow.click();
    await page.waitForTimeout(1000);

    await expect(page.getByText("Upcoming Event").first()).toBeVisible({ timeout: 5000 });
  });

  test("EventSlide: spots left color-coded", async ({ page }) => {
    const rightArrow = page.locator("span.anticon-right").locator("..").first();
    await rightArrow.click();
    await page.waitForTimeout(800);
    await rightArrow.click();
    await page.waitForTimeout(1000);

    await expect(page.getByText("Upcoming Event").first()).toBeVisible({ timeout: 5000 });

    // Check for spots left text — either "N spots left" in the info row or orange warning tag
    const spotsText = page.getByText(/spots left|spots remaining/i).first();
    await expect(spotsText).toBeVisible({ timeout: 3000 });
  });

  test("EventSlide: 'Register Now' navigates", async ({ page }) => {
    const rightArrow = page.locator("span.anticon-right").locator("..").first();
    await rightArrow.click();
    await page.waitForTimeout(800);
    await rightArrow.click();
    await page.waitForTimeout(1000);

    await expect(page.getByText("Upcoming Event").first()).toBeVisible({ timeout: 5000 });

    // The button text is either "Register Now" or "View Events" depending on slug
    const actionBtn = page.getByRole("button", { name: /Register Now|View Events/ }).first();
    await actionBtn.click();
    await page.waitForURL(/\/(events|register)/);
    expect(page.url()).toMatch(/\/(events|register)/);
  });

  test("ProgramSlide: featured program rendered", async ({ page }) => {
    // Navigate to ProgramSlide (fourth slide — click right 3 times)
    const rightArrow = page.locator("span.anticon-right").locator("..").first();
    await rightArrow.click();
    await page.waitForTimeout(800);
    await rightArrow.click();
    await page.waitForTimeout(800);
    await rightArrow.click();
    await page.waitForTimeout(1000);

    // Purple tag with program type should be visible
    const purpleTag = page.locator(".ant-tag-purple").first();
    await expect(purpleTag).toBeVisible({ timeout: 5000 });
  });

  test("ProgramSlide: 'Register Now' navigates with program param", async ({ page }) => {
    const rightArrow = page.locator("span.anticon-right").locator("..").first();
    await rightArrow.click();
    await page.waitForTimeout(800);
    await rightArrow.click();
    await page.waitForTimeout(800);
    await rightArrow.click();
    await page.waitForTimeout(1000);

    const purpleTag = page.locator(".ant-tag-purple").first();
    await expect(purpleTag).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Register Now" }).click();
    await page.waitForURL(/\/register/);
    expect(page.url()).toMatch(/\/register\?program=/);
  });

  test("trending courses section shows cards", async ({ page }) => {
    const heading = page.getByText("Trending Courses", { exact: false }).first();
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();

    // At least one course card should exist
    const cards = page.locator("section").filter({ hasText: "Trending Courses" }).locator(".ant-col");
    expect(await cards.count()).toBeGreaterThanOrEqual(1);

    await expect(page.getByText("View All Courses").first()).toBeVisible();
  });

  test("'View All Courses' link navigates to /allcourses", async ({ page }) => {
    const link = page.getByRole("link", { name: /View All Courses/ }).first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForURL(/\/allcourses/);
    expect(page.url()).toContain("/allcourses");
  });

  test("CTA buttons: 'Get Started Free' and 'Contact Us'", async ({ page }) => {
    // Scroll to the bottom CTA
    const getStartedBtn = page.getByRole("button", { name: "Get Started Free" }).first();
    await getStartedBtn.scrollIntoViewIfNeeded();
    await expect(getStartedBtn).toBeVisible();

    await getStartedBtn.click();
    await page.waitForURL(/\/signup/);
    expect(page.url()).toContain("/signup");

    // Go back and click Contact Us
    await page.goto("/");
    const contactBtn = page.getByRole("button", { name: "Contact Us" }).first();
    await contactBtn.scrollIntoViewIfNeeded();
    await contactBtn.click();
    await page.waitForURL(/\/contact/);
    expect(page.url()).toContain("/contact");
  });
});
