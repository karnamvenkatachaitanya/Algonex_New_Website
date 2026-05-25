import { test, expect } from "@playwright/test";

test.describe("Global Setup — Backend Health Check", () => {
  const API_BASE = process.env.VITE_API_URL || "http://localhost:8000/api/v1";

  test("backend is reachable and has seeded data", async ({ request }) => {
    // Check courses exist
    const coursesRes = await request.get(`${API_BASE}/courses/`);
    expect(coursesRes.ok()).toBeTruthy();
    const coursesData = await coursesRes.json();
    const courses = coursesData.data?.results || coursesData.results || [];
    expect(courses.length).toBeGreaterThan(0);

    // Check events exist
    const eventsRes = await request.get(`${API_BASE}/events/`);
    expect(eventsRes.ok()).toBeTruthy();
    const eventsData = await eventsRes.json();
    const events = eventsData.data?.results || eventsData.results || [];
    expect(events.length).toBeGreaterThan(0);

    // Check jobs exist
    const careersRes = await request.get(`${API_BASE}/careers/`);
    expect(careersRes.ok()).toBeTruthy();
    const careersData = await careersRes.json();
    const careers = careersData.data?.results || careersData.results || [];
    expect(careers.length).toBeGreaterThan(0);
  });
});
