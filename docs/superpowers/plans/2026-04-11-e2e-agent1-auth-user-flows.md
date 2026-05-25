# E2E Test Plan — Agent 1: Auth & User Flows

> **Scope:** All authenticated user journeys, auth pages, protected routes, and user-owned data pages.
> **Test prefix:** `auth_` (e.g., `auth_user_1744000@test.com`)
> **Directory:** `algonex-frontend/e2e/auth/`
> **Depends on:** Running backend with seeded data (`python3.11 manage.py seed_courses && seed_events && seed_careers && seed_programs && seed_showcase`)

## Prerequisites

- Backend running at `http://localhost:8000`
- Frontend running at `http://localhost:5173`
- Database seeded with test data
- Existing `e2e/auth.spec.js` and enrollment part of `e2e/courses.spec.js` will be **deleted** (absorbed into this agent's richer tests)

## Shared Infrastructure (Agent 1 owns)

### Step 1: Create `e2e/helpers/auth.helper.js`

Reusable auth utilities for both agents:

```js
// registerUser(page, { prefix, firstName, lastName }) → creates account, returns { email, password }
// loginUser(page, { email, password }) → logs in, waits for navbar avatar
// logoutUser(page) → clicks avatar dropdown → Logout
// getAuthTokens(page) → returns { access, refresh } from localStorage
// clearAuth(page) → clears localStorage tokens
```

- All emails use format: `{prefix}_{Date.now()}@test.com`
- Default password: `SecurePass123!`
- `registerUser` fills signup form, submits, waits for redirect to `/`
- `loginUser` fills signin form, submits, waits for redirect
- Both return the credentials used

### Step 2: Create `e2e/helpers/selectors.js`

Shared selectors for Ant Design components:

```js
// antMessage → '.ant-message'
// antSpin → '.ant-spin'
// antModal → '.ant-modal'
// antEmpty → '.ant-empty'
// antDropdown → '.ant-dropdown'
// antTag(color) → `.ant-tag-${color}`
// antSteps → '.ant-steps'
// navbarAvatar → navbar avatar element
// drawerMenu → '.ant-drawer'
```

### Step 3: Update `playwright.config.js`

Add project-based filtering so agents can run independently:

```js
projects: [
  {
    name: "setup",
    testMatch: /global-setup\.js/,
  },
  {
    name: "agent1-auth",
    testDir: "./e2e/auth",
    use: { browserName: "chromium" },
    dependencies: ["setup"],
  },
  {
    name: "agent2-public",
    testDir: "./e2e/public",
    use: { browserName: "chromium" },
    dependencies: ["setup"],
  },
]
```

Add `e2e/global-setup.js` that verifies:
- Backend is reachable at `/api/v1/courses/`
- At least 1 course, 1 event, 1 job exists in seed data

Also add video recording on failure:
```js
use: {
  video: "retain-on-failure",
}
```

### Step 4: Delete old test files

Remove the files that this agent's tests replace:
- `e2e/auth.spec.js` → replaced by `e2e/auth/signup.spec.js`, `signin.spec.js`, `password.spec.js`, `protected-routes.spec.js`
- `e2e/courses.spec.js` → enrollment test replaced by `e2e/auth/course-enrollment.spec.js`, page-load test replaced by Agent 2's `e2e/public/courses-list.spec.js`
- `e2e/navigation.spec.js` → replaced by Agent 2's `e2e/public/navigation.spec.js`

---

## Test Files

### Step 5: `e2e/auth/signup.spec.js` (~10 tests)

```
describe("Signup")

1. "signup page renders all elements"
   → goto /signup
   → assert: First name, Last name, Email, Password, Confirm password fields visible
   → assert: "Create Account" button visible
   → assert: Google and GitHub OAuth buttons visible
   → assert: "Sign in" link visible

2. "successful registration redirects to home"
   → fill valid data with auth_ prefix
   → click Create Account
   → waitForURL("/")
   → assert: navbar shows avatar (not Sign In button)

3. "validation: empty fields prevent submission"
   → click Create Account without filling
   → assert: required error on first_name, last_name, email, password, confirm_password

4. "validation: invalid email format"
   → fill email "notanemail"
   → click Create Account
   → assert: email format error message

5. "validation: password too short"
   → fill password "Ab1!"
   → click Create Account
   → assert: minimum 8 characters error

6. "validation: mismatched passwords"
   → fill password "SecurePass123!"
   → fill confirm "DifferentPass456!"
   → click Create Account
   → assert: passwords don't match error

7. "validation: weak/common password"
   → fill password "password123"
   → submit form
   → assert: backend error about common password shown

8. "duplicate email shows backend error"
   → register with auth_ prefix email
   → goto /signup again
   → register with SAME email
   → assert: error message about email already existing

9. "OAuth buttons show warning when env vars missing"
   → (if env vars not set) click Google button
   → assert: warning toast or disabled state
   Note: This test may need to be conditional based on environment

10. "'Sign in' link navigates to /signin"
    → click "Sign in" link
    → assert: URL is /signin
```

**Verify:** Run `npx playwright test e2e/auth/signup.spec.js` — all 10 pass.

---

### Step 6: `e2e/auth/signin.spec.js` (~9 tests)

```
describe("Signin")

1. "signin page renders all elements"
   → goto /signin
   → assert: Email, Password fields visible
   → assert: "Sign In" button, OAuth buttons, "Forgot password?" link, "Sign up" link

2. "successful login redirects to home"
   → register user first (helper)
   → logout
   → goto /signin
   → fill email + password
   → click Sign In
   → waitForURL("/")
   → assert: navbar shows avatar with user first_name

3. "wrong password shows error"
   → register user
   → logout
   → goto /signin, fill email with wrong password
   → click Sign In
   → assert: ant-message error visible

4. "non-existent email shows error"
   → fill nonexistent_auth_999@test.com + any password
   → click Sign In
   → assert: error message

5. "empty fields prevent submission"
   → click Sign In without filling
   → assert: required errors on email and password

6. "invalid email format rejected"
   → fill "bademail" in email
   → assert: validation error

7. "'Forgot password?' navigates to /forgot-password"
   → click Forgot password link
   → assert: URL is /forgot-password

8. "'Sign up' link navigates to /signup"
   → click Sign up link
   → assert: URL is /signup

9. "login redirects back to intended protected page"
   → goto /profile (unauthenticated)
   → redirected to /signin
   → login with valid credentials
   → assert: URL is /profile (or /)
```

**Verify:** Run `npx playwright test e2e/auth/signin.spec.js` — all 9 pass.

---

### Step 7: `e2e/auth/password.spec.js` (~8 tests)

```
describe("Password Management")

1. "forgot password page renders"
   → goto /forgot-password
   → assert: email field, "Send Reset Link" button, "Back to Sign In" link

2. "submit valid email shows success screen"
   → fill valid email
   → click Send Reset Link
   → assert: "Check Your Email" text visible
   → assert: success Result component rendered

3. "'Back to Sign In' link works from form"
   → goto /forgot-password
   → click "Back to Sign In"
   → assert: URL is /signin

4. "'Back to Sign In' link works from success screen"
   → submit forgot password
   → click "Back to Sign In" on success screen
   → assert: URL is /signin

5. "submit invalid email format shows error"
   → fill "notanemail"
   → click Send Reset Link
   → assert: validation error

6. "set password page: missing token/uid shows error"
   → goto /auth/set-password (no query params)
   → assert: "Invalid Link" error Result visible
   → assert: "Go to Sign In" button visible

7. "set password page: valid params show form"
   → goto /auth/set-password?token=faketoken&uid=fakeuid
   → assert: password + confirm password fields visible
   → assert: "Set Password" button visible

8. "set password: mismatched passwords show error"
   → goto /auth/set-password?token=t&uid=u
   → fill password "SecurePass123!"
   → fill confirm "DifferentPass!"
   → click Set Password
   → assert: mismatch validation error
```

**Verify:** Run `npx playwright test e2e/auth/password.spec.js` — all 8 pass.

---

### Step 8: `e2e/auth/oauth-callback.spec.js` (~5 tests)

```
describe("OAuth Callback")

1. "missing code/state shows error page"
   → goto /auth/callback (no params)
   → assert: error message visible
   → assert: "Back to Sign In" button visible

2. "missing code with valid state shows error"
   → goto /auth/callback?state=google
   → assert: error message

3. "invalid state parameter shows error"
   → goto /auth/callback?code=abc&state=invalid
   → assert: error message

4. "loading spinner shown during token exchange"
   → intercept /auth/google/ to delay 2s
   → goto /auth/callback?code=abc&state=google
   → assert: "Completing login..." spinner visible

5. "failed token exchange shows error with back button"
   → intercept /auth/google/ to return 400
   → goto /auth/callback?code=abc&state=google
   → assert: error page visible
   → click "Back to Sign In"
   → assert: URL is /signin
```

**Verify:** Run `npx playwright test e2e/auth/oauth-callback.spec.js` — all 5 pass.

---

### Step 9: `e2e/auth/protected-routes.spec.js` (~7 tests)

```
describe("Protected Routes")

1. "/profile redirects unauthenticated to /signin"
   → clear auth
   → goto /profile
   → waitForURL(/signin/)

2. "/my-courses redirects unauthenticated to /signin"
   → clear auth
   → goto /my-courses
   → waitForURL(/signin/)

3. "/my-events redirects unauthenticated to /signin"
   → clear auth
   → goto /my-events
   → waitForURL(/signin/)

4. "/my-applications redirects unauthenticated to /signin"
   → clear auth
   → goto /my-applications
   → waitForURL(/signin/)

5. "loading spinner shown while checking auth"
   → intercept /auth/user/ to delay 1s
   → set fake token in localStorage
   → goto /profile
   → assert: Spin component visible briefly

6. "after login, redirect back to /my-courses"
   → goto /my-courses → redirected to /signin
   → login with valid auth_ user
   → assert: URL is /my-courses (or /)

7. "after login, redirect back to /my-events"
   → goto /my-events → redirected to /signin
   → login with valid auth_ user
   → assert: URL is /my-events (or /)
```

**Verify:** Run `npx playwright test e2e/auth/protected-routes.spec.js` — all 7 pass.

---

### Step 10: `e2e/auth/profile.spec.js` (~8 tests)

```
describe("Profile Page")
beforeEach: register + login with auth_ prefix

1. "profile page loads with user data"
   → goto /profile
   → assert: avatar visible (UserOutlined or image)
   → assert: user's first_name + last_name visible
   → assert: email displayed

2. "form pre-populated with registration data"
   → assert: first_name input has registered first name
   → assert: last_name input has registered last name

3. "update first name and last name"
   → clear + fill first_name "UpdatedFirst"
   → clear + fill last_name "UpdatedLast"
   → click Save Changes
   → assert: "Profile updated!" success toast
   → reload page
   → assert: first_name input has "UpdatedFirst"

4. "update phone and bio"
   → fill phone "9876543210"
   → fill bio "Test bio content"
   → click Save Changes
   → assert: success toast
   → reload
   → assert: phone has "9876543210", bio has "Test bio content"

5. "email field is read-only"
   → assert: email input is disabled or readonly

6. "save with no changes succeeds"
   → click Save Changes without edits
   → assert: success toast (no error)

7. "loading state on Save button"
   → intercept PATCH /auth/user/ to delay 1s
   → click Save Changes
   → assert: button shows loading spinner

8. "navbar updates after profile save"
   → update first_name to "NavTest"
   → click Save Changes
   → assert: navbar avatar dropdown shows "NavTest"
```

**Verify:** Run `npx playwright test e2e/auth/profile.spec.js` — all 8 pass.

---

### Step 11: `e2e/auth/course-enrollment.spec.js` (~9 tests)

```
describe("Course Enrollment")
beforeEach: register + login with auth_ prefix

1. "'Enroll Now' shows confirmation modal"
   → goto /courses/{seeded-course-slug}
   → click "Enroll Now"
   → assert: modal visible with course duration text
   → assert: "Confirm Enrollment" button in modal

2. "confirm enrollment succeeds"
   → click "Confirm Enrollment" in modal
   → assert: "Successfully enrolled!" toast
   → assert: button changes to green "Enrolled" with check icon

3. "enrolled button is disabled"
   → after enrollment, assert "Enrolled" button is disabled

4. "enrolled course appears in My Courses"
   → goto /my-courses
   → assert: card with seeded course name visible
   → assert: "active" status tag (green)
   → assert: "Enrolled:" date shown

5. "'View Course' link in My Courses works"
   → click "View Course" on enrolled course card
   → assert: URL matches /courses/{slug}

6. "'Drop' removes enrollment"
   → goto /my-courses
   → click "Drop" on the enrolled course
   → assert: "Enrollment dropped." toast
   → assert: course card gone from list

7. "double enrollment shows error"
   → enroll in a course
   → navigate away and back to same course
   → (button should show "Enrolled", but if we force another enroll call)
   → assert: ALREADY_ENROLLED error handled

8. "unauthenticated 'Enroll Now' shows sign-in modal"
   → logout
   → goto /courses/{seeded-course-slug}
   → click "Enroll Now"
   → assert: "Sign in required" modal visible
   → click "Sign In" in modal
   → assert: URL is /signin

9. "enrollment modal loading state"
   → intercept POST /courses/{slug}/enroll/ to delay 1s
   → click "Enroll Now" → "Confirm Enrollment"
   → assert: modal button shows loading/confirmLoading
```

**Verify:** Run `npx playwright test e2e/auth/course-enrollment.spec.js` — all 9 pass.

---

### Step 12: `e2e/auth/event-registration.spec.js` (~12 tests)

```
describe("Event Registration")
beforeEach: register + login with auth_ prefix

1. "'Register Now' on available event succeeds"
   → goto /events/{seeded-event-slug}
   → click "Register Now"
   → assert: regStatus confirmed or waitlisted

2. "confirmed registration shows green tag"
   → assert: "Registered — Confirmed" green tag visible

3. "success toast shown"
   → assert: "Successfully registered!" or "Added to waitlist!" toast

4. "confirmed registration shows meeting link if available"
   → if event has meeting_link: assert link visible with LinkOutlined icon

5. "registration appears in My Events"
   → goto /my-events
   → assert: card with event title, status tag, date, location

6. "'Cancel Registration' from event detail"
   → goto /events/{slug}
   → click "Cancel Registration"
   → assert: "Registration cancelled." toast
   → assert: button returns to "Register Now"

7. "'Cancel Registration' from My Events page"
   → goto /my-events
   → click "Cancel Registration" on event card
   → assert: success toast
   → assert: card removed (or status changed)

8. "full event shows 'Join Waitlist' button"
   → (requires event at capacity — may need route intercept)
   → assert: "Join Waitlist" button text instead of "Register Now"

9. "waitlisted registration shows orange tag"
   → assert: "On Waitlist" orange tag

10. "'Leave Waitlist' button works"
    → click "Leave Waitlist"
    → assert: toast, status cleared

11. "past event shows disabled 'Event has ended' button"
    → (navigate to a past event)
    → assert: button text "Event has ended", button disabled

12. "unauthenticated register redirects to signin"
    → logout
    → goto /events/{slug}
    → click "Register Now"
    → assert: redirected to /signin
```

**Verify:** Run `npx playwright test e2e/auth/event-registration.spec.js` — all 12 pass.

---

### Step 13: `e2e/auth/job-application.spec.js` (~11 tests)

```
describe("Job Application")
beforeEach: register + login with auth_ prefix

1. "'Apply Now' opens application modal"
   → goto /careers/{seeded-job-slug}
   → click "Apply Now"
   → assert: modal title "Apply for {title}"
   → assert: Resume upload field visible
   → assert: Cover Letter textarea visible

2. "submit with PDF resume succeeds"
   → upload a test PDF file to resume field
   → click "Submit Application"
   → assert: "Application submitted!" toast
   → assert: modal closes
   → assert: button changes to green "Application Submitted"

3. "submitted button is disabled"
   → assert: "Application Submitted" button disabled

4. "application appears in My Applications"
   → goto /my-applications
   → assert: card with job title, "applied" tag (blue), applied date

5. "application status pipeline renders"
   → assert: Steps component with: applied → reviewed → interview → hired
   → assert: first step (applied) is current

6. "rejected status shows message instead of steps"
   → (intercept GET /applications/ to return rejected status)
   → assert: "Application was not selected" text visible
   → assert: steps NOT visible

7. "'View Job Details' link works"
   → click "View Job Details" on application card
   → assert: URL matches /careers/{slug}

8. "submit without resume shows validation error"
   → open apply modal
   → click "Submit Application" without uploading
   → assert: "Resume is required" or similar validation error

9. "error keeps modal open for retry"
   → intercept POST /careers/{slug}/apply/ to return 400
   → upload file + submit
   → assert: error toast shown
   → assert: modal still open

10. "cover letter is optional"
    → upload resume only (no cover letter)
    → click Submit
    → assert: success (no validation error on cover_letter)

11. "unauthenticated 'Apply Now' redirects to signin"
    → logout
    → goto /careers/{slug}
    → click "Apply Now"
    → assert: URL is /signin
```

**Verify:** Run `npx playwright test e2e/auth/job-application.spec.js` — all 11 pass.

Note: Create a small test PDF file at `e2e/fixtures/test-resume.pdf` for upload tests.

---

### Step 14: `e2e/auth/registration-flow.spec.js` (~13 tests)

```
describe("Multi-Step Registration Flow")

1. "step indicator shows 3 steps"
   → goto /register
   → assert: "Basic Info", "Profile Details", "Done" steps visible
   → assert: step 1 is active

2. "step 1 renders all fields"
   → assert: first_name, last_name, email, phone fields visible
   → assert: "Continue" button visible

3. "step 1 validation: empty required fields"
   → click Continue without filling
   → assert: errors on all 4 fields

4. "step 1 validation: invalid email"
   → fill email "bademail"
   → click Continue
   → assert: email format error

5. "step 1 → step 2 progression"
   → fill valid step 1 data with auth_ prefix
   → click Continue
   → assert: step 2 form visible (city, college fields)
   → assert: step indicator shows step 2 active

6. "step 2 renders all fields"
   → assert: street_address, city, state, country, pincode, college, branch, degree_level, graduation_year, employment_status, interest_category, specific_interests, terms_agreed visible

7. "step 2 'Back' returns to step 1 with data preserved"
   → click Back
   → assert: step 1 form visible
   → assert: previously filled data still present

8. "step 2 validation: required fields"
   → goto step 2
   → click "Complete Registration" without filling
   → assert: errors on city, state, college, branch, degree_level, employment_status, interest_category, terms_agreed

9. "step 2: terms checkbox required"
   → fill all fields except terms
   → click Complete Registration
   → assert: terms validation error

10. "complete full registration flow"
    → fill step 1 → Continue
    → fill step 2 (city, state, country, college, branch, degree=bachelors, graduation_year=2026, employment=student, interest=course, terms checked)
    → click Complete Registration
    → assert: success screen with Result component
    → assert: step indicator shows "Done" active

11. "success screen: 'Set Up Password' button → /signin"
    → click "Set Up Password & Sign In"
    → assert: URL is /signin

12. "success screen: 'Browse Programs' button → /programs"
    → (re-run flow or use separate test)
    → click "Browse Programs"
    → assert: URL is /programs

13. "pre-selected program via ?program=slug"
    → goto /register?program=some-program-slug
    → assert: program name shown in header or interest pre-filled
```

**Verify:** Run `npx playwright test e2e/auth/registration-flow.spec.js` — all 13 pass.

---

### Step 15: `e2e/auth/navbar-auth.spec.js` (~10 tests)

```
describe("Navbar Authentication States")

1. "unauthenticated: Sign In and Sign Up buttons shown"
   → goto /
   → assert: "Sign In" button visible
   → assert: "Sign Up" button visible

2. "authenticated: avatar dropdown shown"
   → register + login with auth_ prefix
   → goto /
   → assert: avatar element visible
   → assert: user first_name visible in navbar

3. "dropdown: Profile link → /profile"
   → click avatar dropdown
   → click "Profile"
   → assert: URL is /profile

4. "dropdown: My Courses link → /my-courses"
   → click avatar → "My Courses"
   → assert: URL is /my-courses

5. "dropdown: My Events link → /my-events"
   → click avatar → "My Events"
   → assert: URL is /my-events

6. "dropdown: My Applications link → /my-applications"
   → click avatar → "My Applications"
   → assert: URL is /my-applications

7. "dropdown: Logout clears session"
   → click avatar → "Logout"
   → assert: "Sign In" button visible again
   → assert: localStorage access_token is null

8. "after logout, protected routes redirect"
   → logout
   → goto /profile
   → waitForURL(/signin/)

9. "mobile: drawer shows auth links when logged in"
   → set viewport to mobile (375x667)
   → login
   → click hamburger
   → assert: Profile, My Courses, My Events, My Applications, Logout visible in drawer

10. "mobile: logout from drawer"
    → mobile viewport
    → login → click hamburger → click Logout
    → assert: drawer closed, Sign In button visible
```

**Verify:** Run `npx playwright test e2e/auth/navbar-auth.spec.js` — all 10 pass.

---

### Step 16: `e2e/auth/token-refresh.spec.js` (~4 tests)

```
describe("Token Refresh & Session Management")

1. "expired access token auto-refreshes on API call"
   → login
   → manually set access_token to expired/invalid value in localStorage
   → keep valid refresh_token
   → goto /my-courses (triggers GET /enrollments/)
   → assert: page loads (no redirect to signin)
   → assert: new access_token in localStorage

2. "expired refresh token redirects to signin"
   → set both tokens to invalid values
   → goto /my-courses
   → assert: redirected to /signin
   → assert: localStorage tokens cleared

3. "app load with valid token loads user"
   → register + login
   → reload page
   → assert: navbar shows avatar (user restored from token)

4. "app load with invalid token gracefully logs out"
   → set access_token to "garbage" and clear refresh_token
   → reload page
   → assert: navbar shows Sign In (no crash, graceful fallback)
```

**Verify:** Run `npx playwright test e2e/auth/token-refresh.spec.js` — all 4 pass.

---

### Step 17: `e2e/auth/empty-states.spec.js` (~3 tests)

```
describe("Empty States for User Data Pages")
beforeEach: register fresh user + login (no enrollments/registrations/applications)

1. "My Courses: empty state with CTA"
   → goto /my-courses
   → assert: "You haven't enrolled in any courses yet." text
   → assert: "Browse Courses" button visible
   → click "Browse Courses"
   → assert: URL is /allcourses

2. "My Events: empty state with CTA"
   → goto /my-events
   → assert: "You haven't registered for any events yet."
   → assert: "Browse Events" button visible
   → click "Browse Events"
   → assert: URL is /events

3. "My Applications: empty state with CTA"
   → goto /my-applications
   → assert: "You haven't applied to any positions yet."
   → assert: "Browse Jobs" button visible
   → click "Browse Jobs"
   → assert: URL is /careers
```

**Verify:** Run `npx playwright test e2e/auth/empty-states.spec.js` — all 3 pass.

---

### Step 18: `e2e/auth/step2-alerts.spec.js` (~3 tests)

```
describe("Registration Step 2 Alert Banners")

1. "existing user with password shows warning alert"
   → register full account via /signup (has password)
   → goto /register
   → fill step 1 with SAME email
   → Continue → step 2
   → assert: warning alert "You already have an account with a password"
   → assert: "sign in" link in alert

2. "existing user without password shows info alert"
   → (register via /register step 1 only — no password set)
   → goto /register again with same email
   → fill step 1 → Continue
   → assert: info alert "Welcome back! We found your email"

3. "alert sign-in link navigates to /signin"
   → (from test 1 or 2) click sign-in link in alert
   → assert: URL is /signin
```

**Verify:** Run `npx playwright test e2e/auth/step2-alerts.spec.js` — all 3 pass.

---

### Step 19: Create test fixtures

Create `e2e/fixtures/` directory with:
- `test-resume.pdf` — small valid PDF for job application uploads

---

### Step 20: Run full Agent 1 suite

```bash
npx playwright test --project=agent1-auth
```

Assert: All ~112 tests pass. Fix any failures before declaring done.

---

## Summary

| File | Tests |
|------|-------|
| `signup.spec.js` | 10 |
| `signin.spec.js` | 9 |
| `password.spec.js` | 8 |
| `oauth-callback.spec.js` | 5 |
| `protected-routes.spec.js` | 7 |
| `profile.spec.js` | 8 |
| `course-enrollment.spec.js` | 9 |
| `event-registration.spec.js` | 12 |
| `job-application.spec.js` | 11 |
| `registration-flow.spec.js` | 13 |
| `navbar-auth.spec.js` | 10 |
| `token-refresh.spec.js` | 4 |
| `empty-states.spec.js` | 3 |
| `step2-alerts.spec.js` | 3 |
| **Total** | **112** |
