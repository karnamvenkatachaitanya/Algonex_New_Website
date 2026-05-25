import { test, expect } from "@playwright/test";
import { antProgress } from "../helpers/selectors.js";

test.describe("Skill Quiz", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/quiz");
    await page.waitForSelector("h2", { timeout: 15000 });
  });

  test("quiz page loads with first question", async ({ page }) => {
    await expect(page.getByText("What's your background?")).toBeVisible();
    // Options should be visible
    await expect(page.getByText("Fresher")).toBeVisible();
    await expect(page.getByText("Working Professional")).toBeVisible();
  });

  test("progress bar shows step 1 of N", async ({ page }) => {
    await expect(page.locator(antProgress)).toBeVisible();
    await expect(page.getByText("Step 1 of")).toBeVisible();
  });

  test("'Next' disabled until option selected", async ({ page }) => {
    const nextBtn = page.getByRole("button", { name: /Next/i });
    await expect(nextBtn).toBeDisabled();
    // Select an option
    await page.getByText("Fresher").click();
    await expect(nextBtn).toBeEnabled();
  });

  test("selecting option shows visual highlight", async ({ page }) => {
    const option = page.getByText("Fresher").locator("..").locator("..");
    await option.click();
    // The selected option should have a blue border (style change)
    const selectedDiv = page.locator("div[style*='border: 2px solid rgb(0, 180, 216)']");
    expect(await selectedDiv.count()).toBeGreaterThan(0);
  });

  test("'Next' advances to next question", async ({ page }) => {
    await page.getByText("Fresher").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(500);
    await expect(
      page.getByText("How much coding experience do you have?")
    ).toBeVisible();
    await expect(page.getByText("Step 2 of")).toBeVisible();
  });

  test("'Back' returns to previous question with selection preserved", async ({
    page,
  }) => {
    // Answer Q1
    await page.getByText("Fresher").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(500);
    // Now on Q2 — go back
    await page.getByRole("button", { name: /Back/i }).click();
    await page.waitForTimeout(500);
    // Q1 should be visible again
    await expect(page.getByText("What's your background?")).toBeVisible();
    // Previous selection should be preserved (Fresher highlighted)
    const selectedDiv = page.locator("div[style*='border: 2px solid rgb(0, 180, 216)']");
    expect(await selectedDiv.count()).toBeGreaterThan(0);
  });

  test("'Back' disabled on first question", async ({ page }) => {
    const backBtn = page.getByRole("button", { name: /Back/i });
    await expect(backBtn).toBeDisabled();
  });

  test("complete all questions → result screen", async ({ page }) => {
    // Q1: background
    await page.getByText("Fresher").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);

    // Q2: experience
    await page.getByText("None").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);

    // Q3: interest
    await page.getByText("Building Websites & Apps").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);

    // Q4: goal — last question, button text changes to "See My Result"
    await page.getByText("First Tech Job").click();
    await page.getByRole("button", { name: /See My Result/i }).click();
    await page.waitForTimeout(500);

    // Result screen
    await expect(page.getByText("Your Perfect Course")).toBeVisible();
  });

  test("result shows match percentage, course name, and link", async ({
    page,
  }) => {
    // Complete quiz
    await page.getByText("Fresher").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);
    await page.getByText("None").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);
    await page.getByText("Building Websites & Apps").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);
    await page.getByText("First Tech Job").click();
    await page.getByRole("button", { name: /See My Result/i }).click();
    await page.waitForTimeout(500);

    // Match percentage
    await expect(page.getByText(/\d+% match/)).toBeVisible();
    // Course name should be visible
    await expect(page.getByText("View Course Details")).toBeVisible();
  });

  test("'Retake Quiz' resets to first question", async ({ page }) => {
    // Complete quiz
    await page.getByText("Fresher").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);
    await page.getByText("None").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);
    await page.getByText("Building Websites & Apps").click();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);
    await page.getByText("First Tech Job").click();
    await page.getByRole("button", { name: /See My Result/i }).click();
    await page.waitForTimeout(500);

    // Click Retake
    await page.getByText("Retake Quiz").click();
    await page.waitForTimeout(500);

    // Should be back to Q1
    await expect(page.getByText("What's your background?")).toBeVisible();
    await expect(page.getByText("Step 1 of")).toBeVisible();
  });
});
