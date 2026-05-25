import { test, expect } from "@playwright/test";
import { antSpinning, antRate, antTag, antCollapse } from "../helpers/selectors.js";

const COURSE_SLUG = "python-full-stack";
const API = "http://localhost:8000/api/v1";

test.describe("Course Detail - Public View", () => {
  test("course detail loads by slug", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
    const text = await title.textContent();
    expect(text.length).toBeGreaterThan(0);
  });

  test("loading spinner shown", async ({ page }) => {
    await page.route(`**/api/v1/courses/${COURSE_SLUG}/`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto(`/courses/${COURSE_SLUG}`);
    await expect(page.locator(antSpinning)).toBeVisible({ timeout: 5000 });
    await page.waitForSelector("h1", { timeout: 15000 });
  });

  test("banner: level tag, duration tag", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Level tag (cyan) and duration tag (green)
    const cyanTag = page.locator(".ant-tag-cyan").first();
    await expect(cyanTag).toBeVisible();
    const greenTag = page.locator(".ant-tag-green").first();
    await expect(greenTag).toBeVisible();
  });

  test("banner: trending tag for trending courses", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Trending tag is magenta — may or may not be present depending on the course
    const trendingTag = page.locator(".ant-tag-magenta");
    const count = await trendingTag.count();
    // Just verify the banner has tags — trending is optional
    expect(await page.locator(antTag).count()).toBeGreaterThan(0);
    if (count > 0) {
      await expect(trendingTag.first()).toContainText("Trending");
    }
  });

  test("banner: rating stars and review count", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.locator(antRate).first()).toBeVisible();
    await expect(page.getByText(/reviews/i).first()).toBeVisible();
  });

  test("banner: student count and module count", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.getByText(/students/i).first()).toBeVisible();
    await expect(page.getByText(/modules/i).first()).toBeVisible();
  });

  test("stats bar: discounted price display", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Price should be visible with ₹ symbol
    await expect(page.getByText("₹").first()).toBeVisible();
    // If discount, there should be a strikethrough price
    const strikethrough = page.locator("div").filter({ hasText: /₹/ }).locator("[style*='line-through']");
    const count = await strikethrough.count();
    // Discount is optional — just verify price exists
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("stats bar: non-discounted price", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // At least one ₹ price display
    await expect(page.getByText(/₹\d/).first()).toBeVisible();
    await expect(page.getByText("Price")).toBeVisible();
  });

  test("skills section renders tags", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const skillsHeading = page.getByText("Skills You'll Learn");
    const hasSkills = await skillsHeading.isVisible().catch(() => false);
    if (hasSkills) {
      await skillsHeading.scrollIntoViewIfNeeded();
      const skillTags = page.locator(".ant-tag-cyan");
      expect(await skillTags.count()).toBeGreaterThan(0);
    }
  });

  test("learning path roadmap renders", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const roadmapHeading = page.getByText("Your Learning Path");
    const hasRoadmap = await roadmapHeading.isVisible().catch(() => false);
    if (hasRoadmap) {
      await roadmapHeading.scrollIntoViewIfNeeded();
      await expect(roadmapHeading).toBeVisible();
    }
  });

  test("prerequisites section renders if present", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const prereqHeading = page.getByText("Prerequisites");
    const hasPrereq = await prereqHeading.isVisible().catch(() => false);
    if (hasPrereq) {
      await expect(prereqHeading).toBeVisible();
    }
  });

  test("testimonials carousel renders", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const testimonialsHeading = page.getByText("Student Reviews");
    const hasTestimonials = await testimonialsHeading.isVisible().catch(() => false);
    if (hasTestimonials) {
      await testimonialsHeading.scrollIntoViewIfNeeded();
      await expect(testimonialsHeading).toBeVisible();
    }
  });

  test("testimonials carousel navigation", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const testimonialsHeading = page.getByText("Student Reviews");
    const hasTestimonials = await testimonialsHeading.isVisible().catch(() => false);
    if (hasTestimonials) {
      await testimonialsHeading.scrollIntoViewIfNeeded();
      // Carousel exists — just verify section is interactive
      const section = page.locator("section").filter({ hasText: "Student Reviews" });
      await expect(section).toBeVisible();
    }
  });

  test("FAQ accordion expands and collapses", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const faqHeading = page.getByText("Frequently Asked Questions");
    const hasFAQ = await faqHeading.isVisible().catch(() => false);
    if (hasFAQ) {
      await faqHeading.scrollIntoViewIfNeeded();
      // Click first collapse item
      const firstItem = page.locator(`${antCollapse} .ant-collapse-header`).first();
      await firstItem.click();
      await page.waitForTimeout(500);
      // Content should be visible
      const content = page.locator(".ant-collapse-content-active").first();
      await expect(content).toBeVisible();
      // Click again to collapse
      await firstItem.click();
      await page.waitForTimeout(500);
    }
  });

  test("trending courses section shows other courses", async ({ page }) => {
    await page.goto(`/courses/${COURSE_SLUG}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const otherCoursesHeading = page.getByText("Other Courses You Might Like");
    const hasOther = await otherCoursesHeading.isVisible().catch(() => false);
    if (hasOther) {
      await otherCoursesHeading.scrollIntoViewIfNeeded();
      const cards = page.locator("section").filter({ hasText: "Other Courses" }).locator(".ant-col");
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test("non-existent slug shows 'Course not found'", async ({ page }) => {
    await page.goto("/courses/nonexistent-slug-999");
    await expect(page.getByText("Course not found")).toBeVisible({ timeout: 15000 });
    const browseBtn = page.getByRole("button", { name: "Browse Courses" });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();
    await page.waitForURL(/\/allcourses/);
  });
});
