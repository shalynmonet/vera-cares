# Vera Care Companion

Build a caregiving app called Vera for tracking elderly residents who receive scheduled wellness phone calls.

Core feature: Resident Profiles

Create a "Residents" section where I can add and edit resident profiles with these fields:

Name

Living situation: dropdown with two options — "Nursing home" or "Independent at home"

Family contact name

Family contact email or phone

Caregiver/facility contact name

Caregiver/facility contact email or phone

Relationship of caregiver contact (e.g., "Facility nurse," "Daughter," "Home health aide")

Interests/notes: free text field for personalization details (hobbies, family members' names, things they like to talk about)

Call Types & Scheduling

Each resident can have two types of scheduled calls:

Social Check-In Call — default frequency: weekly. Editable.

Activity Call — default frequency: daily. Editable. Include a field for "Activity description" (e.g., "10 minutes on stationary bike") and a preferred time of day.

Show the resident's upcoming scheduled calls (both types) on their profile page.

Call History

Create a call log list on each resident's profile showing past calls, with:

Call type

Date/time

Outcome: dropdown — "Completed," "No answer," "Cut short"

For now, let me manually add call log entries so I can test the UI before real calls are connected.

Overall structure

Start with a simple dashboard listing all residents, click into a resident to see their full profile, schedule, and call history.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vera-cares.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/523a7d96-fc93-4965-87ea-fdd3a1d0e69d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
