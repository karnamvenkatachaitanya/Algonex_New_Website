import { test, expect } from "@playwright/test";
import { antMessage } from "../helpers/selectors.js";

test.describe("Multi-Step Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("step indicator shows 3 steps", async ({ page }) => {
    await expect(page.locator(".ant-steps")).toBeVisible();
    await expect(page.locator(".ant-steps-item")).toHaveCount(3);
    await expect(page.locator(".ant-steps-item-active")).toBeVisible();
  });

  test("step 1 renders all fields", async ({ page }) => {
    await expect(page.getByPlaceholder("First name")).toBeVisible();
    await expect(page.getByPlaceholder("Last name")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("+91 98765 43210")).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue/ })).toBeVisible();
  });

  test("step 1 validation: empty required fields", async ({ page }) => {
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Please enter your first name")).toBeVisible();
    await expect(page.getByText("Please enter your last name")).toBeVisible();
    await expect(page.getByText("Please enter your email")).toBeVisible();
    await expect(page.getByText("Please enter your phone number")).toBeVisible();
  });

  test("step 1 validation: invalid email", async ({ page }) => {
    await page.getByPlaceholder("you@example.com").fill("bademail");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Please enter a valid email")).toBeVisible();
  });

  test("step 1 → step 2 progression", async ({ page }) => {
    const email = `auth_reg_${Date.now()}@test.com`;
    await page.getByPlaceholder("First name").fill("RegTest");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");

    await page.getByRole("button", { name: /Continue/ }).click();

    // Wait for step 2 to appear
    await expect(page.getByRole("heading", { name: "Profile Details" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("Bangalore")).toBeVisible({ timeout: 5000 });
  });

  test("step 2 renders all fields", async ({ page }) => {
    // Fill step 1 first
    const email = `auth_reg2_${Date.now()}@test.com`;
    await page.getByPlaceholder("First name").fill("RegTest");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Help us match you")).toBeVisible({ timeout: 10000 });

    // Verify step 2 fields
    await expect(page.getByPlaceholder("123 Main Street")).toBeVisible();
    await expect(page.getByPlaceholder("Bangalore")).toBeVisible();
    await expect(page.getByPlaceholder("Karnataka")).toBeVisible();
    await expect(page.getByPlaceholder("India")).toBeVisible();
    await expect(page.getByPlaceholder("560001")).toBeVisible();
    await expect(page.getByPlaceholder("Indian Institute of Technology")).toBeVisible();
    await expect(page.getByPlaceholder("Computer Science")).toBeVisible();
    await expect(page.getByText("Degree Level")).toBeVisible();
    await expect(page.getByText("Employment Status")).toBeVisible();
    await expect(page.getByText("What are you interested in?")).toBeVisible();
  });

  test("step 2 'Back' returns to step 1 with data preserved", async ({ page }) => {
    const email = `auth_regback_${Date.now()}@test.com`;
    await page.getByPlaceholder("First name").fill("BackTest");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Help us match you")).toBeVisible({ timeout: 10000 });

    // Click Back
    await page.getByRole("button", { name: /Back/ }).click();
    await expect(page.getByPlaceholder("First name")).toBeVisible();
    await expect(page.getByPlaceholder("First name")).toHaveValue("BackTest");
  });

  test("step 2 validation: required fields", async ({ page }) => {
    const email = `auth_regval_${Date.now()}@test.com`;
    await page.getByPlaceholder("First name").fill("ValTest");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Help us match you")).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Complete Registration/ }).click();
    await expect(page.getByText("Please enter your city")).toBeVisible();
    await expect(page.getByText("Please enter your state")).toBeVisible();
    await expect(page.getByText("Please enter your college")).toBeVisible();
  });

  test("step 2: terms checkbox required", async ({ page }) => {
    const email = `auth_regterms_${Date.now()}@test.com`;
    await page.getByPlaceholder("First name").fill("TermsTest");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Help us match you")).toBeVisible({ timeout: 10000 });

    // Fill all required but skip terms
    await page.getByPlaceholder("Bangalore").fill("Mumbai");
    await page.getByPlaceholder("Karnataka").fill("Maharashtra");
    await page.getByPlaceholder("Indian Institute of Technology").fill("IIT Bombay");
    await page.getByPlaceholder("Computer Science").fill("CS");
    await page.locator("#degree_level").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /Bachelor/ }).click();
    await page.locator("#graduation_year").fill("2026");
    await page.locator("#employment_status").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /^Student$/ }).click();
    await page.locator("#interest_category").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /^Course$/ }).click();

    await page.getByRole("button", { name: /Complete Registration/ }).click();
    await expect(page.getByText("You must agree to the terms")).toBeVisible();
  });

  test("complete full registration flow", async ({ page }) => {
    const email = `auth_regfull_${Date.now()}@test.com`;

    // Step 1
    await page.getByPlaceholder("First name").fill("FullTest");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Help us match you")).toBeVisible({ timeout: 10000 });

    // Step 2
    await page.getByPlaceholder("Bangalore").fill("Delhi");
    await page.getByPlaceholder("Karnataka").fill("Delhi");
    await page.getByPlaceholder("Indian Institute of Technology").fill("IIT Delhi");
    await page.getByPlaceholder("Computer Science").fill("ECE");
    await page.locator("#degree_level").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /Bachelor/ }).click();
    await page.locator("#graduation_year").fill("2027");
    await page.locator("#employment_status").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /^Student$/ }).click();
    await page.locator("#interest_category").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /^Course$/ }).click();
    await page.locator("#terms_agreed").check();

    await page.getByRole("button", { name: /Complete Registration/ }).click();

    // Success screen
    await expect(page.getByText("Registration Complete!")).toBeVisible({ timeout: 15000 });
  });

  test("success screen: 'Set Up Password' → /signin", async ({ page }) => {
    const email = `auth_regpw_${Date.now()}@test.com`;

    // Quick flow through
    await page.getByPlaceholder("First name").fill("PwTest");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("1234567890");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Help us match you")).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder("Bangalore").fill("Chennai");
    await page.getByPlaceholder("Karnataka").fill("TN");
    await page.getByPlaceholder("Indian Institute of Technology").fill("IIT M");
    await page.getByPlaceholder("Computer Science").fill("ME");
    await page.locator("#degree_level").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /Master/ }).click();
    await page.locator("#graduation_year").fill("2026");
    await page.locator("#employment_status").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /^Student$/ }).click();
    await page.locator("#interest_category").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /^Course$/ }).click();
    await page.locator("#terms_agreed").check();
    await page.getByRole("button", { name: /Complete Registration/ }).click();
    await expect(page.getByText("Registration Complete!")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /Set Up Password/ }).click();
    await page.waitForURL(/signin/);
  });

  test("success screen: 'Browse Programs' → /programs", async ({ page }) => {
    const email = `auth_regprog_${Date.now()}@test.com`;

    await page.getByPlaceholder("First name").fill("ProgTest");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("1234567890");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Help us match you")).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder("Bangalore").fill("Pune");
    await page.getByPlaceholder("Karnataka").fill("MH");
    await page.getByPlaceholder("Indian Institute of Technology").fill("COEP");
    await page.getByPlaceholder("Computer Science").fill("IT");
    await page.locator("#degree_level").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /Bachelor/ }).click();
    await page.locator("#graduation_year").fill("2026");
    await page.locator("#employment_status").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /^Student$/ }).click();
    await page.locator("#interest_category").click();
    await page.locator(".ant-select-item-option").filter({ hasText: /^Course$/ }).click();
    await page.locator("#terms_agreed").check();
    await page.getByRole("button", { name: /Complete Registration/ }).click();
    await expect(page.getByText("Registration Complete!")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Browse Programs" }).click();
    await page.waitForURL(/programs/);
  });

  test("pre-selected program via ?program=slug", async ({ page }) => {
    // Get a program slug
    const res = await page.request.get("http://localhost:8000/api/v1/programs/");
    const data = await res.json();
    const programs = data.data?.results || data.results || [];
    const programSlug = programs[0]?.slug;
    test.skip(!programSlug, "No seeded programs");

    await page.goto(`/register?program=${programSlug}`);
    // Should show "Register for {program name}" in the header
    await expect(page.getByText("Register for")).toBeVisible({ timeout: 5000 });
  });
});
