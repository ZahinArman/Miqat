# Miqat PWA V1: Product Brief and Build Specification

> **Product name:** Miqat (مِيقات)  
> **Product type:** Prayer-focused, installable Progressive Web App  
> **Version:** V1  
> **Design direction:** Quiet Focus, dark minimalist, muted sage  
> **Primary goal:** Help one person consistently see, record, and review the five daily prayers.

## 1. Instructions for the vibe-coding platform

Build the app described in this document. Treat the requirements below as the source of truth. Do not add features that are explicitly excluded.

Before implementing, inspect the three design references in `assets/`:
- `home-screen.svg`
- `history-screen.svg`
- `settings-screen.svg`
- `design-system.svg`

Use these as visual references, not as existing production screenshots. Recreate them as responsive, accessible application UI.

### Scope constraints
- Build a **PWA**, not a native Android app.
- A proper notification system would be great, but not a priority for v1.
- Do not pretend browser notifications are guaranteed when the app is closed.
- The core experience must work offline after the app has loaded and its required assets/data are available.


## 2. Product vision

Miqat is a quiet personal prayer companion. It should make it easy to answer:
1. What are today's five prayer times?
2. Which prayer is next, and how long until it begins?
3. Which prayers have I marked as completed?
4. How has my prayer consistency looked over time?
5. Which calculation settings and manual adjustments are being used?

The app should encourage consistency without guilt, streak pressure, leaderboards, or gamification.

### V1 success criteria
- The user can view all five daily prayer times.
- The next prayer and a live foreground countdown are clearly visible.
- The user can mark and unmark each prayer as completed with one tap.
- The user can review prior dates in a calendar/history view.
- The user can select a location and calculation preferences.
- The user can apply manual per-prayer minute adjustments.
- Settings and prayer logs persist locally.
- Previously available core data remains accessible offline.
- The app can be installed as a PWA on supported browsers.
- The UI is responsive, accessible, and visually consistent.

## 3. Brand and design system

### Name
**Miqat** (مِيقات). Use the wordmark `MIQAT` in the interface. Arabic may be used as a small secondary brand detail, but do not force decorative Arabic into every screen.

### Visual direction: Quiet Focus
- Calm, minimal, editorial, Apple-inspired.
- Dark charcoal surfaces with warm ivory text.
- Muted sage for selected states and positive completion indicators.
- Generous spacing, subtle separators, clear typography.
- No neon colors, excessive cards, busy ornaments, or decorative gradients.
- Avoid a generic dashboard appearance. The next prayer should be the main visual focus.

### Color tokens
- `--color-bg: #171A18`
- `--color-surface: #232924`
- `--color-surface-raised: #292F2A`
- `--color-text: #E9E5DA`
- `--color-text-muted: #A6B0A5`
- `--color-sage: #899C84`
- `--color-sage-soft: #B5C8A8`
- `--color-border: #343B35`
- `--color-warning: #C6A66B`
- `--color-danger: #C77B72`

Use warning and danger colors sparingly. Do not use color alone to convey completion or error.

### Typography
- Use a clean system font stack or a reliable bundled font.
- Prayer names and times should be highly legible.
- Use tabular numerals for countdowns and times when available.
- Use small uppercase labels sparingly.
- Maintain readable contrast and support browser text scaling.

### Layout and interaction
- Mobile-first layout.
- Primary content should fit a typical phone screen without feeling cramped.
- Touch targets should ideally be at least 44 by 44 CSS pixels.
- Use restrained rounded corners and subtle transitions.
- Respect `prefers-reduced-motion`.
- Keyboard focus states must be visible.
- Avoid hover-only interactions.
- Include loading, empty, error, and offline states.

## 4. Navigation and screen requirements

Use three primary destinations:
1. Home
2. History
3. Settings

Use a compact bottom navigation bar on mobile. On wider screens, it may become a slim side navigation or remain centered, but keep the same information architecture.

### Screen A: Home
Purpose: make today's prayer schedule immediately understandable.

Required elements:
- Miqat wordmark.
- Current local date.
- Selected location label.
- A prominent next-prayer panel containing:
  - Prayer name
  - Prayer time
  - Foreground countdown
  - Small progress indication if useful, without visual clutter
- Five prayer rows in chronological order:
  - Fajr
  - Dhuhr
  - Asr
  - Maghrib
  - Isha
- Each row shows the prayer name, time, and completion state.
- One tap toggles completion.
- Make the next prayer visually distinct.
- Show a simple daily completion summary, such as `2 of 5 completed`.
- A small, unobtrusive link to History or Settings is acceptable.

Rules:
- Do not automatically mark a prayer as missed just because it is not marked complete.
- Allow undo by tapping the completion control again.
- Show the date used for the schedule.
- If times are sample data or unavailable, say so clearly.
- Never ship fabricated prayer times as if they were real.

### Screen B: History
Purpose: review recorded prayer completion by day.

Required elements:
- Month title and previous/next month controls.
- Calendar grid.
- Subtle indicators for dates with recorded completions.
- Selected date details with all five prayers and their completion states.
- Simple weekly or monthly completion summary.
- Distinguish “not recorded” from “missed”. Do not infer missed prayers from missing logs.
- Allow a user to change a previous day's completion state.

### Screen C: Settings
Purpose: configure location, prayer calculations, manual adjustments, appearance, and local data.

Required groups:
1. **Location**
   - Search/select a city, or manually enter coordinates.
   - Device location may be offered as an optional convenience, with permission requested only after the user chooses it.
   - Store the location name, latitude, longitude, and IANA time zone.
2. **Calculation**
   - Calculation method selector, populated only with methods supported by the selected library.
   - Asr juristic method selector, including Standard and Hanafi if supported.
   - Clearly display the currently selected method.
3. **Manual adjustments**
   - One minute adjustment per prayer, supporting positive and negative values.
   - Keep the calculated base time separate from the adjusted effective time.
   - Provide a reset-to-zero action.
4. **Appearance**
   - Dark, Light, or System theme. Dark is the default.
5. **Data and privacy**
   - Explain that V1 stores data locally and has no account.
   - Provide export of local data if practical.
   - Provide a clearly confirmed reset/delete-local-data action.

Reminder settings may be omitted from the first UI. If included, label them as optional browser notifications and explain their limitations. They must not be presented as reliable alarm-clock functionality.

## 5. Technical stack

Recommended simple stack:
- React
- TypeScript
- Vite
- CSS variables and regular CSS, CSS modules, or a small styling library
- A maintained prayer-time calculation library, such as Adhan JS, after validating supported methods
- IndexedDB for local persistence, preferably through a small wrapper such as `idb`
- A PWA plugin for Vite, such as `vite-plugin-pwa`
- Vitest for unit tests

Do not use Capacitor, Kotlin, Android AlarmManager, native plugins, a server, authentication, or a cloud database in V1.

### Suggested project structure
```text
miqat/
├── public/
│   ├── icons/
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── PrayerRow.tsx
│   │   ├── NextPrayerCard.tsx
│   │   └── EmptyState.tsx
│   ├── features/
│   │   ├── home/
│   │   ├── history/
│   │   └── settings/
│   ├── services/
│   │   ├── prayerCalculator.ts
│   │   ├── scheduleService.ts
│   │   └── storage/
│   ├── styles/
│   │   ├── tokens.css
│   │   └── global.css
│   ├── types/
│   └── tests/
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```
The above is just a suggestion, not a rulebook. Changes are allowed if needed but the changes should only allow improvement.
Keep components small and understandable. Avoid unnecessary abstractions and avoid putting the entire app in one component. 

## 6. Prayer-time calculation strategy

Use a local calculation library as the default, so the app can calculate times without a remote API. A remote API is not required for the core experience.

Potential library to evaluate: `adhan-js` from the Batoul Apps Adhan project. Confirm the current package name, API, supported methods, and maintenance status before installing it.

### Calculation inputs
- Latitude
- Longitude
- Local date
- IANA time zone
- Calculation method
- Asr juristic method
- Manual minute adjustments

### Processing
1. Read the selected location and calculation settings.
2. Calculate the five prayer times using the selected library.
3. Convert results into the selected location's local time correctly.
4. Preserve each base calculated time.
5. Apply manual minute adjustments to produce effective times.
6. Save the daily schedule locally.
7. Recalculate when date, location, calculation method, Asr method, or adjustments change.

Do not use fixed offsets as a substitute for a prayer-time calculation engine. Do not hardcode today's prayer times.

### Bangladesh validation requirement
Before choosing the default calculation method, compare library results against a trusted local timetable relevant to the intended user, including Dhaka and several different dates. Fajr, Dhuhr, Asr, Maghrib, and Isha should be checked individually. Do not claim the default matches a local authority unless it has actually been verified.

Make the method visible and let the user change it. Keep manual corrections available.

### Timezone and edge cases
- Store the selected IANA timezone, not just a fixed UTC offset.
- Correctly handle midnight and date transitions.
- Recalculate when the local date changes.
- Handle missing or invalid location data gracefully.
- Document how the library handles high latitudes and other unsupported edge cases.
- Clearly indicate when a schedule is unavailable or based on fallback/sample data.

## 7. Data model

Use IndexedDB for persistent local storage. Keep the schema small and version it so future upgrades can migrate data safely.

### `settings`
- `id`
- `theme`
- `locationId`
- `calculationMethod`
- `asrMethod`
- `updatedAt`

### `locations`
- `id`
- `name`
- `latitude`
- `longitude`
- `timeZoneId`
- `createdAt`

### `prayerSchedules`
- `id`
- `localDate` in `YYYY-MM-DD` format for the selected location
- `locationId`
- `calculationMethod`
- `asrMethod`
- `generatedAt`

### `prayerTimes`
- `id`
- `scheduleId`
- `prayer` enum: `fajr | dhuhr | asr | maghrib | isha`
- `baseTime` as an ISO timestamp or a well-defined local time representation
- `adjustmentMinutes` as an integer
- `effectiveTime`
- Unique constraint or equivalent logic on `(scheduleId, prayer)`

### `prayerLogs`
- `id`
- `localDate`
- `prayer`
- `completed` boolean
- `completedAt` timestamp, nullable when not completed
- Unique key on `(localDate, prayer)`

### Data rules
- Missing log means “not recorded”, not “missed”.
- Toggling completion updates the existing record rather than adding duplicates.
- Store base time and adjustment separately.
- Keep all data local. No account or server requests for prayer logs.
- Provide a versioned migration path for IndexedDB.
- If location is changed, retain historical prayer logs by their original local date.

## 8. PWA and offline requirements

- Include a valid web app manifest with name `Miqat`, short name `Miqat`, theme color, background color, icons, and `display: standalone`.
- Provide install instructions or a small install prompt when the browser supports it. Do not repeatedly nag users.
- Configure a service worker to cache the app shell and static assets.
- Cache the app shell so it can open offline after a successful first load.
- Store user settings and prayer logs in IndexedDB.
- Calculate prayer times locally.
- Bundle essential UI fonts and icons locally where possible.
- Provide a clear offline indicator only when useful.
- Test installation and offline behavior in the target Android browser.
- HTTPS is required for normal service-worker/PWA functionality in production, except for localhost development.

### Notifications are not a core feature
Do not build an alarm system in V1. Browser notifications may be explored later as a separate enhancement, but do not promise exact timing, delivery after the browser is closed, or native alarm reliability. The core product must not depend on notifications.

## 9. Accessibility and quality

- Semantic HTML and meaningful accessible labels.
- Visible keyboard focus.
- Support browser zoom and system text scaling.
- Adequate color contrast.
- Reduced-motion support.
- Buttons and completion controls must be keyboard accessible.
- Never use only color to indicate completed prayers.
- Handle empty states, loading states, invalid settings, and calculation failures.
- No console errors in normal use.
- Use clear error messages that explain what the user can do next.

## 10. Testing checklist

### Functional
- All five prayers appear in the correct order.
- Countdown targets the next upcoming prayer.
- The next prayer changes after its time passes.
- One-tap completion persists after reload.
- Toggling a prayer does not create duplicate logs.
- History can display and edit past dates.
- Month navigation works across year boundaries.
- Changing location recalculates the schedule.
- Changing calculation settings recalculates the schedule.
- Manual adjustments affect the effective time but preserve the base time.
- Resetting an adjustment restores the calculated time.

### Offline and PWA
- App shell loads after a successful install/first visit when offline.
- Cached user data remains available offline.
- Prayer times can be calculated offline.
- Service-worker updates do not erase user data.
- Install experience works on supported Android browsers.

### Time-related
- Midnight transition updates the displayed date and schedule.
- Countdown does not go negative after a prayer time passes.
- Timezone changes are handled without corrupting history.
- Daylight-saving behavior follows the selected location's timezone database.
- Invalid coordinates or missing timezone show a useful error.

### Privacy
- No login page.
- No analytics or tracking by default.
- No network transmission of prayer logs.
- Local reset requires confirmation.
- Exported data is clearly identified as a local file.

## 11. Beginner-friendly implementation order

Build in small milestones. Verify each milestone before moving on.

### Milestone 1: Project and design system
- Create Vite + React + TypeScript project.
- Add global color tokens and typography.
- Create navigation and reusable layout components.
- Reproduce the design references with sample data.

**Done when:** all three screens look consistent and work at mobile and desktop widths.

### Milestone 2: Home interactions
- Add the five prayer rows.
- Add next-prayer selection and countdown.
- Add one-tap completion and undo.
- Use clearly labeled temporary sample data.

**Done when:** interactions work, but no sample time is misrepresented as real.

### Milestone 3: Local persistence
- Add IndexedDB.
- Save settings and prayer completion.
- Load persisted state on startup.
- Add a database version and migration approach.

**Done when:** reloads and offline sessions do not lose user data.

### Milestone 4: Real prayer-time calculation
- Evaluate and install the calculation library.
- Add location and method settings.
- Add manual minute adjustments.
- Validate results against a trusted local timetable.

**Done when:** the app calculates actual times and clearly communicates its selected method.

### Milestone 5: History
- Add month calendar and daily detail.
- Add completion summaries.
- Ensure unrecorded days are not classified as missed.

**Done when:** the user can review and correct historical logs.

### Milestone 6: PWA and offline support
- Add manifest, icons, service worker, and cache strategy.
- Add install guidance.
- Test offline use and service-worker updates.

**Done when:** the app installs and opens offline after initial setup.

### Milestone 7: Quality and release
- Run the test checklist.
- Test on a physical Android device.
- Check contrast, keyboard use, touch target sizes, and error states.
- Produce a production build and document known limitations.

**Done when:** all critical acceptance tests pass.

## 12. Final instructions to the coding agent

Build Miqat V1 exactly within the scope of this brief.

Prioritize:
1. Clean, calm visual design.
2. Correct prayer-time calculations and transparent settings.
3. One-tap completion and useful history.
4. Local-only data and offline support.
5. Simplicity and understandable code.

Do not add features just because they are common in other Islamic apps. Do not add Quran, adhkar, dhikr, Qibla, accounts, cloud sync, social features, native Android alarm code, or a backend.

If a requirement depends on an external library or browser capability, verify the current API and explain any limitation instead of inventing behavior.

Start with the design system and three screens using sample data, then implement storage, real calculations, history, and PWA behavior in that order.
