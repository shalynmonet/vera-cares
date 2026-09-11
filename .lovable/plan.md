# Weekly Activity Schedule and Export API

## What will be added
- Add a seven-day activity schedule to every resident, with one independently editable row for Monday through Sunday.
- Each day will support an activity description, duration in minutes, and a rest-day switch that clears and disables the activity fields.
- Show the schedule directly on each resident profile in a compact table that works on desktop and mobile.
- Seed all existing residents with seven blank rest-day entries, and automatically create the same seven entries for every new resident.
- Add a read-only data export endpoint for the external calling service, protected by a shared API key.

## Data and behavior
- Store each resident/day combination as its own record so editing Tuesday cannot overwrite Monday or any other day.
- Save a row when the user explicitly confirms that day's change, with clear saving and success/error feedback.
- Validate day names, non-negative duration, and the rest-day rule in both the interface and the database.
- Return resident profiles, call schedules, and weekly activity schedules from the export endpoint; omit call history because it is not required for placing scheduled calls.
- Require `Authorization: Bearer <shared key>` and compare the key securely before returning data.

## Technical details
- Create a `weekly_activity_schedules` table with resident reference, weekday number/name, description, duration, rest-day status, timestamps, uniqueness per resident/day, grants, row-level access rules, indexes, and validation constraints.
- Add a database trigger that creates Monday–Sunday rows for new residents, plus a one-time backfill for existing residents.
- Extend generated data types and Vera query helpers after the migration applies.
- Add a focused weekly schedule editor component and place it on the resident profile.
- Add a TanStack public server route for the authenticated export response, using server-only database access after validating the shared key.
- Store the shared key securely as `VERA_EXPORT_API_KEY`; it will not be committed to the project.
- Verify database persistence, independent day edits, rest-day disabling, mobile/desktop layout, API rejection without a key, API success with a key, and the final build.
