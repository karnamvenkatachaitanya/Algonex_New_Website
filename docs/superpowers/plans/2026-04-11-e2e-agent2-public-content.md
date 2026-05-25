# E2E Test Plan — Agent 2: Public Content & Discovery

> **Scope:** All public-facing pages, navigation, search/filter, content rendering, contact form, quiz, static pages, footer.
> **Test prefix:** `pub_` (e.g., `pub_contact_1744000@test.com`)
> **Directory:** `algonex-frontend/e2e/public/`
> **Depends on:** Running backend with seeded data (`python3.11 manage.py seed_courses && seed_events && seed_careers && seed_programs && seed_showcase`)
> **Note:** Agent 1 owns shared infrastructure (helpers, config, fixtures). Agent 2 uses them but does not create them.

## Prerequisites

- Backend running at `http://localhost:8000`
- Frontend running at `http://localhost:5173`
- Database seeded with test data
- Shared helpers from Agent 1 available: `e2e/helpers/auth.helper.js`, `e2e/helpers/selectors.js`
- Existing `e2e/navigation.spec.js` will be **deleted** by Agent 1 (replaced by this agent's richer `navigation.spec.js`)
- Playwright config updated by Agent 1 with `agent2-public` project

## Important Notes

- These tests should NOT require login. The only exception is `contact.spec.js` which submits a form (no auth needed for that endpoint).
- All tests verify the **public visitor experience**.
- Use `pub_` prefix for any data submitted (contact form emails, etc.).
- If an API fails, many pages fall back to static data — test both paths where relevant.

---

## Test Files

### Step 1: `e2e/public/home.spec.js` (~18 tests)

```
describe("Homepage")

1. "homepage loads without error"
   → goto /
   → assert: no error boundary, page renders

2. "hero carousel renders first slide"
   → assert: MainHeroSlide content visible (stats: 5,000+ Students, etc.)

3. "hero carousel auto-rotates"
   → wait ~7s
   → assert: slide content changed (different slide visible)

4. "hero carousel arrow navigation"
   → click right arrow
   → assert: next slide visible
   → click left arrow
   → assert: previous slide visible

5. "MainHeroSlide: 'Explore Courses' → /allcourses"
   → ensure MainHeroSlide is active
   → click "Explore Courses"
   → assert: URL is /allcourses or /courses

6. "MainHeroSlide: 'Book Free Demo' → /contact"
   → goto /
   → click "Book Free Demo"
   → assert: URL is /contact

7. "MainHeroSlide: stats displayed"
   → assert: "5,000+" visible, "50+" visible, "95%" visible, "4.8" visible

8. "CourseSlide: trending course data rendered"
   → navigate to CourseSlide (arrow or wait)
   → assert: "Trending Course" tag visible
   → assert: duration, price (₹), skills displayed

9. "CourseSlide: skills truncation with '+N more'"
   → if course has >6 skills: assert "+N more" text visible

10. "CourseSlide: 'View Course' navigates to course detail"
    → click "View Course"
    → assert: URL matches /courses/ or /stack/

11. "EventSlide: upcoming event rendered"
    → navigate to EventSlide
    → assert: "Upcoming Event" tag, date, location visible

12. "EventSlide: spots left color-coded"
    → assert: spots left tag has color (orange if ≤10, else default)

13. "EventSlide: 'Register Now' navigates"
    → click "Register Now"
    → assert: URL matches /events/ or event detail

14. "ProgramSlide: featured program rendered"
    → navigate to ProgramSlide
    → assert: program type tag (purple), duration, stipend visible

15. "ProgramSlide: 'Register Now' → /register with program param"
    → click "Register Now"
    → assert: URL matches /register?program=

16. "trending courses section shows cards"
    → scroll to trending section
    → assert: at least 1 course card visible
    → assert: "View All Courses" link visible

17. "'View All Courses' link → /allcourses"
    → click "View All Courses"
    → assert: URL is /allcourses or /courses

18. "CTA buttons: 'Get Started Free' → /signup, 'Contact Us' → /contact"
    → scroll to bottom CTA section
    → assert: both buttons visible
    → click "Get Started Free" → URL is /signup
    → go back, click "Contact Us" → URL is /contact
```

**Verify:** Run `npx playwright test e2e/public/home.spec.js` — all 18 pass.

---

### Step 2: `e2e/public/courses-list.spec.js` (~12 tests)

```
describe("Course Listing")

1. "courses page loads with course cards"
   → goto /courses (or /allcourses)
   → assert: at least 1 course card visible

2. "loading spinner shown before data"
   → intercept GET /courses/ to delay 1s
   → goto /courses
   → assert: Spin visible
   → wait for data
   → assert: Spin gone, cards visible

3. "search by course name"
   → type "Python" in search
   → assert: only courses with "Python" in name shown
   → assert: count text updated

4. "search by description"
   → type a keyword from a course description
   → assert: matching courses shown

5. "search is case-insensitive"
   → type "python" (lowercase)
   → assert: "Python" course still shown

6. "clear search restores all courses"
   → type "Python" → clear (allowClear button)
   → assert: full course list restored

7. "filter by level: Beginner"
   → click "Beginner" segment
   → assert: only beginner courses shown

8. "filter by level: Intermediate"
   → click "Intermediate"
   → assert: only intermediate courses

9. "filter by level: Advanced"
   → click "Advanced"
   → assert: only advanced courses

10. "filter by Trending"
    → click "Trending" segment
    → assert: only trending courses (fewer or equal to total)

11. "combined search + filter"
    → type search term + select level
    → assert: both filters applied (intersection)

12. "no results shows empty state"
    → type "xyznonexistent999"
    → assert: "No courses match your filters" text visible
```

**Verify:** Run `npx playwright test e2e/public/courses-list.spec.js` — all 12 pass.

---

### Step 3: `e2e/public/course-detail.spec.js` (~16 tests)

```
describe("Course Detail - Public View")

1. "course detail loads by slug"
   → goto /courses/{seeded-course-slug}
   → assert: course title visible

2. "loading spinner shown"
   → intercept to delay
   → assert: Spin visible initially

3. "banner: level tag, duration tag"
   → assert: level tag (e.g., "Beginner"), duration tag visible

4. "banner: trending tag shown for trending courses"
   → (navigate to a trending course)
   → assert: "Trending" tag visible

5. "banner: rating stars and review count"
   → assert: Rate component visible (disabled stars)
   → assert: review count text

6. "banner: student count and module count"
   → assert: student count and module count stats visible

7. "stats bar: discounted price display"
   → (if course has discount) assert: strikethrough original price + discounted price

8. "stats bar: non-discounted price"
   → (if no discount) assert: single price value

9. "skills section renders tags"
   → assert: at least 1 cyan tag in skills section
   → assert: each skill tag visible

10. "learning path roadmap renders"
    → assert: CourseRoadmap section visible
    → assert: module names listed

11. "prerequisites section renders if present"
    → if course has prior_knowledge: assert card with content visible

12. "testimonials carousel renders"
    → if course has testimonials: assert carousel visible
    → assert: at least 1 testimonial with name, role, rating

13. "testimonials carousel navigation"
    → click carousel arrows or wait for auto-play
    → assert: different testimonial visible

14. "FAQ accordion expands and collapses"
    → if course has FAQ: click first FAQ item
    → assert: answer content visible
    → click again
    → assert: answer hidden

15. "trending courses section shows 'Other Courses'"
    → scroll to bottom
    → assert: course cards visible (excluding current)

16. "non-existent slug shows 'Course not found'"
    → goto /courses/nonexistent-slug-999
    → assert: "Course not found" or Empty component
    → assert: "Browse Courses" button visible
    → click → URL is /allcourses
```

**Verify:** Run `npx playwright test e2e/public/course-detail.spec.js` — all 16 pass.

---

### Step 4: `e2e/public/events-list.spec.js` (~11 tests)

```
describe("Events Listing")

1. "events page loads with event cards"
   → goto /events
   → assert: at least 1 event card visible

2. "loading spinner shown"
   → intercept to delay
   → assert: Spin visible

3. "search by event title"
   → type event keyword
   → assert: filtered results

4. "filter by type: Workshop"
   → click "Workshop" segment
   → assert: only workshop events

5. "filter by type: Webinar"
   → click "Webinar"
   → assert: only webinar events

6. "filter by type: Hackathon"
   → click "Hackathon"
   → assert: only hackathons

7. "no results shows empty state"
   → type "xyznonexistent"
   → assert: "No events match your search"

8. "event card: type tag color-coded"
   → assert: tag color matches event type (e.g., cyan for workshop)

9. "event card: spots left tag color-coded"
   → assert: spots left tag visible with appropriate color

10. "'View Details' navigates to /events/{slug}"
    → click "View Details" on first event
    → assert: URL matches /events/{slug}

11. "past events section renders"
    → scroll to past events
    → assert: past event cards visible with date and type tag
```

**Verify:** Run `npx playwright test e2e/public/events-list.spec.js` — all 11 pass.

---

### Step 5: `e2e/public/event-detail.spec.js` (~12 tests)

```
describe("Event Detail - Public View")

1. "event detail loads by slug"
   → goto /events/{seeded-event-slug}
   → assert: event title visible

2. "loading spinner shown"
   → assert: Spin visible initially

3. "banner: type tag with correct color"
   → assert: type tag visible, color matches TYPE_COLORS

4. "banner: date and time formatted"
   → assert: date with weekday format visible
   → assert: time range if both start/end dates

5. "banner: location and capacity"
   → assert: location text, capacity number visible

6. "spots left tag color-coded"
   → assert: tag color based on spots (red ≤0, orange ≤5, green >5)

7. "'Past Event' tag for ended events"
   → (navigate to past event if available)
   → assert: gray "Past Event" tag

8. "description renders markdown"
   → assert: formatted description content visible (not raw markdown)

9. "details grid: 4 info cards"
   → assert: Type, Location, Capacity, Spots Left cards visible

10. "back button navigates to previous page"
    → goto /events → click event → click Back
    → assert: URL is /events

11. "non-existent slug shows not found"
    → goto /events/nonexistent-slug-999
    → assert: "Event not found" text
    → assert: "Browse Events" button
    → click → URL is /events

12. "past event: 'Event has ended' disabled"
    → (navigate to past event)
    → assert: button text "Event has ended"
    → assert: button is disabled
```

**Verify:** Run `npx playwright test e2e/public/event-detail.spec.js` — all 12 pass.

---

### Step 6: `e2e/public/programs-list.spec.js` (~11 tests)

```
describe("Programs Listing")

1. "programs page loads with cards"
   → goto /programs
   → assert: at least 1 program card

2. "loading spinner shown"
   → assert: Spin visible initially

3. "search by program name"
   → type keyword → assert filtered

4. "filter by type: Fellowship"
   → click "Fellowship" → assert: only fellowship programs (purple tags)

5. "filter by type: Internship"
   → click "Internship" → assert: only internships (blue tags)

6. "no results shows empty state"
   → type "xyznonexistent"
   → assert: "No programs match your search"

7. "program card: type and featured tags"
   → assert: type tag (purple/blue) visible
   → if featured: assert gold "Featured" tag

8. "program card: duration, stipend, location, deadline"
   → assert: all info fields displayed on card

9. "'Closed' tag for expired programs"
   → if any program !isAccepting: assert red "Closed" tag

10. "'View Details' navigates to /programs/{slug}"
    → click "View Details"
    → assert: URL matches /programs/{slug}

11. "CTA: 'Register Now' → /register"
    → scroll to CTA section
    → click "Register Now"
    → assert: URL is /register
```

**Verify:** Run `npx playwright test e2e/public/programs-list.spec.js` — all 11 pass.

---

### Step 7: `e2e/public/program-detail.spec.js` (~12 tests)

```
describe("Program Detail")

1. "program detail loads by slug"
   → goto /programs/{seeded-slug}
   → assert: title visible

2. "loading spinner shown"
   → assert: Spin initially

3. "banner: type, featured, accepting tags"
   → assert: type tag color correct
   → if featured: gold tag
   → assert: "Accepting Applications" green or "Closed" red tag

4. "banner: spots left tag color-coded"
   → if spots_left: assert orange ≤5, green otherwise

5. "banner: duration, stipend, location, deadline"
   → assert: all info displayed

6. "registration CTA: → /register?program={slug}"
   → if accepting: click Register button
   → assert: URL matches /register?program={slug}

7. "closed program: disabled button"
   → (navigate to closed program or intercept)
   → assert: "Applications Closed" button disabled

8. "details grid renders conditionally"
   → assert: only fields with data shown (Duration, Location, etc.)

9. "description renders markdown"
   → assert: formatted text (not raw markdown syntax)

10. "eligibility section with criteria and tags"
    → if eligibility_criteria: assert section visible
    → assert: degree level tag (blue), branch tags

11. "bottom CTA with deadline"
    → if accepting: scroll to bottom
    → assert: "Don't miss out!" card with deadline date
    → assert: Register button

12. "non-existent slug shows not found"
    → goto /programs/nonexistent-999
    → assert: "Program not found"
    → assert: "Browse Programs" button → /programs
```

**Verify:** Run `npx playwright test e2e/public/program-detail.spec.js` — all 12 pass.

---

### Step 8: `e2e/public/careers-list.spec.js` (~11 tests)

```
describe("Careers / Job Listing")

1. "careers page loads with job cards"
   → goto /careers
   → assert: at least 1 job card

2. "loading spinner shown"
   → assert: Spin initially

3. "search by job title"
   → type keyword → assert: filtered

4. "filter by department: Engineering"
   → click "Engineering" → assert: only engineering jobs

5. "filter by job type: Full Time"
   → click "Full Time" → assert: only full-time

6. "filter by job type: Internship"
   → click "Internship" → assert: only internships

7. "combined department + type filter"
   → select Engineering + Full Time
   → assert: both filters applied

8. "no results shows empty state"
   → type "xyznonexistent"
   → assert: "No jobs match your filters" or similar

9. "job card: department, type, remote tags"
   → assert: blue department tag, cyan type tag
   → if remote: green "Remote" tag

10. "job card: salary range formatted"
    → assert: "₹" prefix with salary range visible

11. "job card links to /careers/{slug}"
    → click job card
    → assert: URL matches /careers/{slug}
```

**Verify:** Run `npx playwright test e2e/public/careers-list.spec.js` — all 11 pass.

---

### Step 9: `e2e/public/job-detail.spec.js` (~10 tests)

```
describe("Job Detail - Public View")

1. "job detail loads by slug"
   → goto /careers/{seeded-slug}
   → assert: title visible

2. "loading spinner shown"
   → assert: Spin initially

3. "banner: department, type, remote tags"
   → assert: tags with correct colors

4. "banner: location with icon"
   → assert: EnvironmentOutlined icon + location text

5. "banner: salary range formatted"
   → assert: "₹X–Y LPA" format (if salary_min exists)

6. "description renders markdown"
   → assert: formatted content visible

7. "requirements section renders if present"
   → if job has requirements: assert "Requirements" heading + content

8. "requirements section hidden if absent"
   → (if no requirements field) assert: no requirements heading

9. "back button navigates"
   → goto /careers → click job → click Back
   → assert: URL is /careers

10. "non-existent slug shows not found"
    → goto /careers/nonexistent-999
    → assert: "Job not found"
    → assert: "Browse Jobs" button → /careers
```

**Verify:** Run `npx playwright test e2e/public/job-detail.spec.js` — all 10 pass.

---

### Step 10: `e2e/public/portfolio-list.spec.js` (~6 tests)

```
describe("Portfolio / Case Studies Listing")

1. "portfolio page loads"
   → goto /products
   → assert: page renders without error

2. "loading spinner shown"
   → assert: Spin initially

3. "case study card: thumbnail, industry tag, tech tags"
   → if data: assert: image, blue industry tag, up to 3 tech tags

4. "case study card links to /products/{slug}"
   → click card
   → assert: URL matches /products/{slug}

5. "empty state when no case studies"
   → (intercept to return empty) assert: "No case studies yet. Coming soon!"

6. "cards have hover effect"
   → hover over card
   → assert: visual change (shadow or border)
```

**Verify:** Run `npx playwright test e2e/public/portfolio-list.spec.js` — all 6 pass.

---

### Step 11: `e2e/public/portfolio-detail.spec.js` (~10 tests)

```
describe("Case Study Detail")

1. "case study detail loads by slug"
   → goto /products/{seeded-slug}
   → assert: title visible

2. "loading spinner shown"
   → assert: Spin initially

3. "banner image renders if present"
   → if banner: assert: image element visible

4. "tags: industry, client, tech"
   → assert: industry tag (blue), tech tags (cyan)
   → if client_name: assert visible

5. "problem section renders markdown"
   → if problem: assert: "Problem" card with formatted content

6. "solution section renders markdown"
   → if solution: assert: "Solution" card with formatted content

7. "results section renders markdown"
   → if results: assert: "Results" card with formatted content

8. "screenshots with lightbox"
   → if screenshots: assert: images visible
   → click image → assert: preview overlay opens (Image.PreviewGroup)

9. "back button navigates"
   → click Back → assert: URL is /products

10. "non-existent slug shows not found"
    → goto /products/nonexistent-999
    → assert: "Case study not found"
    → assert: "Browse Portfolio" button
```

**Verify:** Run `npx playwright test e2e/public/portfolio-detail.spec.js` — all 10 pass.

---

### Step 12: `e2e/public/alumni.spec.js` (~14 tests)

```
describe("Alumni & Projects")

1. "alumni page loads"
   → goto /alumni
   → assert: title + description visible

2. "loading spinner shown"
   → assert: Spin initially

3. "tab switcher: Alumni and Projects"
   → assert: segmented control with "Alumni" and "Projects" labels

4. "alumni tab: cards render"
   → assert: at least 1 alumni card with avatar, name, role, company

5. "alumni card: package range tag (green)"
   → assert: green tag with package info

6. "alumni card: course + batch tags"
   → assert: course tag and batch year tag visible

7. "click alumni card → detail modal"
   → click card → assert: modal opens
   → assert: modal has full name, role, company, avatar

8. "alumni modal: LinkedIn button"
   → if alumni has linkedin_url: assert: LinkedIn button with external link

9. "search alumni by name"
   → type name in search → assert: filtered results

10. "search alumni by company"
    → type company name → assert: filtered results

11. "switch to Projects tab"
    → click "Projects" segment
    → assert: project cards visible with thumbnail, title, tech tags

12. "project card navigates to /alumni/projects/{slug}"
    → click project card
    → assert: URL matches /alumni/projects/{slug}

13. "search projects by title"
    → type project title → assert: filtered

14. "empty search results"
    → type "xyznonexistent"
    → assert: "No alumni found" or "No projects found"
```

**Verify:** Run `npx playwright test e2e/public/alumni.spec.js` — all 14 pass.

---

### Step 13: `e2e/public/project-detail.spec.js` (~8 tests)

```
describe("Student Project Detail")

1. "project detail loads by slug"
   → goto /alumni/projects/{seeded-slug}
   → assert: title visible

2. "loading spinner shown"
   → assert: Spin initially

3. "thumbnail renders if present"
   → if thumbnail: assert: image visible (100% width)

4. "tech tags displayed"
   → assert: cyan styled tags for technologies

5. "student name, course, batch year"
   → assert: all info displayed

6. "'Live Demo' button links externally"
   → if demo_url: assert: button with href, target="_blank"

7. "'View Code' button links externally"
   → if github_url: assert: button with href, target="_blank"

8. "non-existent slug shows not found"
   → goto /alumni/projects/nonexistent-999
   → assert: "Project not found"
   → assert: "Back to Alumni" button → /alumni
```

**Verify:** Run `npx playwright test e2e/public/project-detail.spec.js` — all 8 pass.

---

### Step 14: `e2e/public/contact.spec.js` (~10 tests)

```
describe("Contact Page")

1. "contact page loads"
   → goto /contact
   → assert: form + info cards visible

2. "contact info cards: email, phone, address, hours"
   → assert: 4 cards with icons and text

3. "submit valid form → success toast + form reset"
   → fill: full_name "Pub Test", email "pub_test@test.com", subject "Test", message "Hello"
   → click Send
   → assert: "Message sent!" toast
   → assert: all form fields empty (reset)

4. "validation: empty required fields"
   → click Send without filling
   → assert: errors on full_name, email, subject, message

5. "validation: invalid email format"
   → fill email "notanemail"
   → click Send
   → assert: email validation error

6. "phone is optional"
   → fill name, email, subject, message (no phone)
   → click Send
   → assert: success (no phone validation error)

7. "error toast on API failure"
   → intercept POST /contact/submit-form/ to return 500
   → fill + submit
   → assert: "Failed to send message" error toast

8. "loading state on submit button"
   → intercept to delay 1s
   → fill + click Send
   → assert: button shows loading spinner

9. "Google Maps embed renders"
   → assert: iframe with google maps src visible

10. "form fields are 'large' size"
    → assert: input elements have ant-input-lg class
```

**Verify:** Run `npx playwright test e2e/public/contact.spec.js` — all 10 pass.

---

### Step 15: `e2e/public/about.spec.js` (~9 tests)

```
describe("About Us Page")

1. "about page loads"
   → goto /aboutus
   → assert: page title visible

2. "tab navigation: Mission → Vision → Story"
   → click "Our Mission" → assert: mission content visible
   → click "Our Vision" → assert: vision content visible
   → click "Our Story" → assert: story content visible

3. "default tab is Mission"
   → on load, assert: mission content visible

4. "stats section: 4 stat cards"
   → assert: "5,000+" Students, "95%" Placement, "50+" Partners, "4.8" Rating

5. "values section: 6 cards"
   → assert: Innovation, Community, Excellence, Integrity, Impact, Accessibility titles visible

6. "timeline: milestones"
   → assert: at least 5 milestone items with year + title

7. "team section: member cards"
   → assert: at least 3 team member cards with avatar, name, role

8. "'Browse Courses' CTA → /allcourses"
   → click "Browse Courses"
   → assert: URL is /allcourses or /courses

9. "'Contact Us' CTA → /contact"
   → click "Contact Us"
   → assert: URL is /contact
```

**Verify:** Run `npx playwright test e2e/public/about.spec.js` — all 9 pass.

---

### Step 16: `e2e/public/quiz.spec.js` (~10 tests)

```
describe("Skill Quiz")

1. "quiz page loads with first question"
   → goto /quiz
   → assert: question title visible, options visible

2. "progress bar shows step 1 of N"
   → assert: progress bar visible, "Step 1 of N" text

3. "'Next' disabled until option selected"
   → assert: Next button disabled
   → select an option
   → assert: Next button enabled

4. "selecting option shows visual highlight"
   → click an option
   → assert: blue border, background change, CheckCircleOutlined visible

5. "'Next' advances to next question"
   → select option → click Next
   → assert: new question title, progress incremented

6. "'Back' returns to previous question with selection preserved"
   → go to question 2 → click Back
   → assert: question 1 visible, previous selection still highlighted

7. "'Back' disabled on first question"
   → on question 1, assert: Back button disabled

8. "complete all questions → result screen"
   → answer all questions sequentially
   → click "See My Result" on last question
   → assert: trophy icon, "Your Perfect Course" heading

9. "result shows match percentage, course name, and link"
   → assert: "X% match" tag visible
   → assert: course name, tagline, duration, price
   → assert: "View Course Details" button visible

10. "'Retake Quiz' resets to first question"
    → click "Retake Quiz"
    → assert: question 1 visible, progress reset
```

**Verify:** Run `npx playwright test e2e/public/quiz.spec.js` — all 10 pass.

---

### Step 17: `e2e/public/static-pages.spec.js` (~8 tests)

```
describe("Static Pages")

1. "privacy page loads"
   → goto /privacy
   → assert: "Privacy Policy" title visible

2. "privacy: all 6 sections rendered"
   → assert: "Information We Collect", "How We Use", "Data Security", "Cookies", "Your Rights", "Contact" headings

3. "privacy: last updated date"
   → assert: "April 2026" visible

4. "terms page loads"
   → goto /terms
   → assert: "Terms of Service" title visible

5. "terms: all 8 sections rendered"
   → assert: "Acceptance", "Account Responsibilities", "Course Enrollment", "Event Registration", "Job Applications", "Intellectual Property", "Limitation of Liability", "Contact" headings

6. "404 page on invalid URL"
   → goto /this-page-does-not-exist
   → assert: "Page Not Found" visible

7. "404: 'Go Home' → /"
   → click "Go Home"
   → assert: URL is /

8. "404: 'Browse Courses' → /allcourses"
   → goto /nonexistent-page
   → click "Browse Courses"
   → assert: URL is /allcourses or /courses
```

**Verify:** Run `npx playwright test e2e/public/static-pages.spec.js` — all 8 pass.

---

### Step 18: `e2e/public/navigation.spec.js` (~14 tests)

```
describe("Navigation & Navbar")

1. "logo navigates to /"
   → goto /aboutus
   → click logo
   → assert: URL is /

2. "desktop: all 8 nav links present"
   → assert: Home, Courses, Programs, Events, Careers, About, Alumni, Contact links visible

3. "desktop: active link highlighted"
   → goto /courses
   → assert: "Courses" link has cyan color / active styling

4. "desktop: Home link → /"
   → click Home → assert: URL is /

5. "desktop: Courses link → /courses"
   → click Courses → assert: URL matches /courses

6. "desktop: Programs link → /programs"
   → click Programs → assert: URL is /programs

7. "desktop: Events link → /events"
   → click Events → assert: URL is /events

8. "desktop: Careers link → /careers"
   → click Careers → assert: URL is /careers

9. "desktop: About link → /aboutus"
   → click About → assert: URL is /aboutus

10. "desktop: Alumni link → /alumni"
    → click Alumni → assert: URL is /alumni

11. "desktop: Contact link → /contact"
    → click Contact → assert: URL is /contact

12. "navbar is sticky on scroll"
    → scroll down 500px
    → assert: navbar still visible at top

13. "desktop: unauthenticated shows Sign In/Up"
    → assert: "Sign In" and "Sign Up" buttons visible

14. "mobile: hamburger → drawer → navigate → close"
    → set viewport 375x667
    → assert: hamburger icon visible, nav links hidden
    → click hamburger
    → assert: drawer opens with all 8 links
    → click "Events" in drawer
    → assert: URL is /events, drawer closed
```

**Verify:** Run `npx playwright test e2e/public/navigation.spec.js` — all 14 pass.

---

### Step 19: `e2e/public/footer.spec.js` (~9 tests)

```
describe("Footer")

1. "footer renders on page"
   → goto /
   → scroll to bottom
   → assert: "Algonex" branding visible

2. "social links: LinkedIn, GitHub, Twitter"
   → assert: 3 social icon links with href attributes

3. "quick links: 5 navigation links"
   → assert: Home, Courses, Events, About Us, Contact links

4. "popular courses: 4 course links"
   → assert: Python Full Stack, MERN Stack, Data Analytics, Java Full Stack

5. "contact info: address, phone, email"
   → assert: all 3 contact items with icons

6. "copyright year is current"
   → assert: "2026" (or current year) in copyright text

7. "'Privacy Policy' → /privacy"
   → click "Privacy Policy"
   → assert: URL is /privacy

8. "'Terms of Service' → /terms"
   → click "Terms of Service"
   → assert: URL is /terms

9. "quick links navigate correctly"
   → click "Courses" in footer
   → assert: URL matches /courses
```

**Verify:** Run `npx playwright test e2e/public/footer.spec.js` — all 9 pass.

---

### Step 20: Run full Agent 2 suite

```bash
npx playwright test --project=agent2-public
```

Assert: All ~201 tests pass. Fix any failures before declaring done.

---

## Summary

| File | Tests |
|------|-------|
| `home.spec.js` | 18 |
| `courses-list.spec.js` | 12 |
| `course-detail.spec.js` | 16 |
| `events-list.spec.js` | 11 |
| `event-detail.spec.js` | 12 |
| `programs-list.spec.js` | 11 |
| `program-detail.spec.js` | 12 |
| `careers-list.spec.js` | 11 |
| `job-detail.spec.js` | 10 |
| `portfolio-list.spec.js` | 6 |
| `portfolio-detail.spec.js` | 10 |
| `alumni.spec.js` | 14 |
| `project-detail.spec.js` | 8 |
| `contact.spec.js` | 10 |
| `about.spec.js` | 9 |
| `quiz.spec.js` | 10 |
| `static-pages.spec.js` | 8 |
| `navigation.spec.js` | 14 |
| `footer.spec.js` | 9 |
| **Total** | **201** |
