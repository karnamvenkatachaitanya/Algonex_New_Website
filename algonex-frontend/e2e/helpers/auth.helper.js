import { expect } from "@playwright/test";

const DEFAULT_PASSWORD = "SecurePass123!";

/**
 * Register a new user via the /signup form.
 * Returns { email, password, firstName, lastName }.
 */
export async function registerUser(page, options = {}) {
  const {
    prefix = "test",
    firstName = "Test",
    lastName = "User",
    password = DEFAULT_PASSWORD,
  } = options;

  const email = `${prefix}_${Date.now()}@test.com`;

  await page.goto("/signup");
  await page.getByPlaceholder("First name").fill(firstName);
  await page.getByPlaceholder("Last name").fill(lastName);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);
  await page.getByPlaceholder("Confirm password").fill(password);

  await page.getByRole("button", { name: "Create Account" }).click();

  // Wait for redirect — may go to "/" or stay if there's a toast
  await page.waitForURL((url) => !url.pathname.includes("/signup"), {
    timeout: 15000,
  });

  return { email, password, firstName, lastName };
}

/**
 * Log in an existing user via the /signin form.
 * Waits for redirect away from /signin.
 */
export async function loginUser(page, { email, password = DEFAULT_PASSWORD }) {
  await page.goto("/signin");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);

  await page.locator("form").getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/signin"), {
    timeout: 15000,
  });
}

/**
 * Log out the current user via the navbar avatar dropdown.
 */
export async function logoutUser(page) {
  // Open the avatar dropdown
  const avatar = page.locator(".ant-dropdown-trigger").first();
  await avatar.click();

  // Click Logout in the dropdown
  await page.getByText("Logout").click();

  // Wait for Sign In button to appear (confirms logged out)
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible({
    timeout: 5000,
  });
}

/**
 * Get auth tokens from localStorage.
 */
export async function getAuthTokens(page) {
  return page.evaluate(() => ({
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  }));
}

/**
 * Clear auth tokens from localStorage (force unauthenticated state).
 * Must navigate to the app first to access localStorage.
 */
export async function clearAuth(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  });
  await page.reload();
}

/**
 * Register + login helper. Returns credentials.
 * Useful for beforeEach blocks that need an authenticated user.
 */
export async function registerAndLogin(page, prefix = "auth") {
  const creds = await registerUser(page, { prefix });
  // Already logged in after registration, no need to login again
  return creds;
}
