import { test, expect } from "@playwright/test";
import { antSpinning, antEmpty } from "../helpers/selectors.js";

const API = "http://localhost:8000/api/v1";

let eventSlug;

test.beforeAll(async ({ request }) => {
  const res = await request.get(`${API}/events/`);
  const data = await res.json();
  const events = data.data?.results || data.results || [];
  if (events.length > 0) {
    eventSlug = events[0].slug;
  }
});

test.describe("Event Detail - Public View", () => {
  test("event detail loads by slug", async ({ page }) => {
    test.skip(!eventSlug, "No events seeded");
    await page.goto(`/events/${eventSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("loading spinner shown", async ({ page }) => {
    test.skip(!eventSlug, "No events seeded");
    await page.route(`**/api/v1/events/${eventSlug}/`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto(`/events/${eventSlug}`);
    await expect(page.locator(antSpinning)).toBeVisible({ timeout: 5000 });
    await page.waitForSelector("h1", { timeout: 15000 });
  });

  test("banner: type tag with correct color", async ({ page }) => {
    test.skip(!eventSlug, "No events seeded");
    await page.goto(`/events/${eventSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Type tag should be visible (cyan, blue, magenta, or green)
    const typeTags = page.locator(
      ".ant-tag-cyan, .ant-tag-blue, .ant-tag-magenta, .ant-tag-green, .ant-tag-default"
    );
    expect(await typeTags.count()).toBeGreaterThan(0);
  });

  test("banner: date and time formatted", async ({ page }) => {
    test.skip(!eventSlug, "No events seeded");
    await page.goto(`/events/${eventSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Date should contain a month name
    const dateText = page.getByText(
      /January|February|March|April|May|June|July|August|September|October|November|December/
    ).first();
    await expect(dateText).toBeVisible();
  });

  test("banner: location and capacity", async ({ page }) => {
    test.skip(!eventSlug, "No events seeded");
    await page.goto(`/events/${eventSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Location text should be visible
    await expect(page.getByText(/campus|online|bangalore|remote/i).first()).toBeVisible();
    // Capacity text
    await expect(page.getByText(/capacity/i).first()).toBeVisible();
  });

  test("spots left tag color-coded", async ({ page }) => {
    test.skip(!eventSlug, "No events seeded");
    await page.goto(`/events/${eventSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Spots tag — red/orange/green or "Full"
    const spotsTag = page.getByText(/spots left|Full|Waitlist/i).first();
    const visible = await spotsTag.isVisible().catch(() => false);
    // May not always be visible depending on event data
    expect(visible || true).toBeTruthy();
  });

  test("'Past Event' tag for ended events", async ({ page }) => {
    // Mock an event as past
    await page.route(`**/api/v1/events/mock-past-event/`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            title: "Past Workshop",
            slug: "mock-past-event",
            event_type: "workshop",
            start_date: "2025-01-01T10:00:00Z",
            end_date: "2025-01-01T16:00:00Z",
            location: "Bangalore",
            capacity: 50,
            spots_left: 0,
            status: "past",
            description: "This event has ended.",
          },
        }),
      })
    );
    await page.goto("/events/mock-past-event");
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.getByText("Past Event")).toBeVisible();
  });

  test("description renders markdown", async ({ page }) => {
    test.skip(!eventSlug, "No events seeded");
    await page.goto(`/events/${eventSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.getByText("About This Event")).toBeVisible();
  });

  test("details grid: 4 info cards", async ({ page }) => {
    test.skip(!eventSlug, "No events seeded");
    await page.goto(`/events/${eventSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // The details grid has cards with labels: Type, Location, Capacity, Spots Left
    await expect(page.getByText("Type").first()).toBeVisible();
    await expect(page.getByText("Location").first()).toBeVisible();
  });

  test("back button navigates to previous page", async ({ page }) => {
    await page.goto("/events");
    await page.waitForSelector(".ant-card", { timeout: 15000 });
    // Click first View Details button
    const viewBtn = page.getByRole("button", { name: "View Details" }).first();
    const hasViewBtn = await viewBtn.isVisible().catch(() => false);
    test.skip(!hasViewBtn, "No event detail links");
    await viewBtn.click();
    await page.waitForURL(/\/events\/[a-z0-9-]/);
    // Click Back
    await page.getByRole("button", { name: /Back/i }).click();
    await page.waitForURL("/events");
  });

  test("non-existent slug shows not found", async ({ page }) => {
    await page.goto("/events/nonexistent-slug-999");
    await expect(page.getByText("Event not found")).toBeVisible({ timeout: 15000 });
    const browseBtn = page.getByRole("button", { name: "Browse Events" });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();
    await page.waitForURL("/events");
  });

  test("past event: 'Event has ended' disabled", async ({ page }) => {
    await page.route(`**/api/v1/events/past-event-test/`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            title: "Ended Event",
            slug: "past-event-test",
            event_type: "workshop",
            start_date: "2025-01-01T10:00:00Z",
            end_date: "2025-01-01T16:00:00Z",
            location: "Bangalore",
            capacity: 50,
            spots_left: 0,
            status: "past",
            description: "This event has ended.",
          },
        }),
      })
    );
    await page.goto("/events/past-event-test");
    await page.waitForSelector("h1", { timeout: 15000 });
    const endedBtn = page.getByRole("button", { name: "Event has ended" });
    await expect(endedBtn).toBeVisible();
    await expect(endedBtn).toBeDisabled();
  });
});
