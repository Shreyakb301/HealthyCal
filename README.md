#+ HealthyCal — Mindful Eating

HealthyCal is a full-stack web application for tracking meals, nutrition, and daily tips to support mindful eating. It includes a React + Vite frontend and an Express + MongoDB backend with authentication, meal logging, and nutrition lookup features.

## Features
- User registration and login (JWT-based)
- Create, read, update, delete meal logs
- Nutrition search and food table components
- Daily tips and calorie tracking UI
- End-to-end and unit tests (Cypress, Jest)

## Tech Stack
- Frontend: React, Vite
- Backend: Node.js, Express
- Database: MongoDB (via Mongoose)
- Auth: JSON Web Tokens (`jsonwebtoken`)
- Testing: Cypress, Jest, Supertest

## Quick Start
1. Install dependencies

```bash
npm installxdv
```

2. Create a `.env` file at the project root with at least:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

3. Run the backend and frontend concurrently (development):

```bash
npm run dev:all
```

4. Open the frontend at http://localhost:5173 (Vite default)

Available npm scripts (from `package.json`):
- `dev` — start Vite dev server
- `server` — run backend (`node server/index.js`)
- `dev:server` — run backend with `nodemon`
- `dev:all` — run both backend and frontend concurrently
- `push:daily-meals` — log in to HealthyCal and push the configured meals for the target day
- `build` / `preview` — build/preview frontend
- `test` — runs end-to-end and unit tests (Cypress + Jest)

## Project Structure (summary)
- `server/` — Express app entry and backend code
  - `index.js` — server bootstrap
  - `app.js` — Express app configuration
  - `routes/` — `auth.js`, `meals.js` routes
  - `models/` — `User.js`, `Meal.js` Mongoose models
  - `tests/` — backend unit tests
- `src/` — React frontend
  - `components/` — UI components (Auth, MealLog, NutritionSearch, FoodTable, etc.)
  - `context/` — React contexts for auth and meals
  - `services/api.js` — frontend API helper
- `cypress/` — end-to-end tests

## API Endpoints (overview)
- `POST /api/auth/register` — create a new user
- `POST /api/auth/login` — log in and receive JWT
- `GET /api/meals` — list meals (auth required)
- `POST /api/meals` — create a meal (auth required)
- `PUT /api/meals/:id` — update meal
- `DELETE /api/meals/:id` — delete meal

See the server route files for full details: [server/routes/auth.js](server/routes/auth.js) and [server/routes/meals.js](server/routes/meals.js).

## Daily meal-log automation
Use `scripts/pushDailyMealLog.js` when you want the same HealthyCal account to receive a meal log automatically every day through the existing website API.

1. Create a plan file from the example:

```bash
cp scripts/meal-log-plan.example.json scripts/meal-log-plan.json
```

2. Update `scripts/meal-log-plan.json` with the meals you want posted.

Supported config shapes:
- `days.default` for every day
- `days.monday`, `days.tuesday`, etc. for weekday-specific meals
- `dates.YYYY-MM-DD` for one-off overrides

Each meal entry supports:
- `mealType`: `breakfast`, `lunch`, `dinner`, or `snack`
- `time`: `HH:MM` 24-hour local time
- `name`
- `amount`
- `calories`
- `imageUrl` (optional)
- `macros` (optional: `carbs`, `protein`, `fat`, `fiber`, `sugar`, `sodium`, `cholesterol`, `saturatedFat`)

3. Run a dry run first:

```bash
MEAL_LOG_BASE_URL=https://your-site.example.com \
MEAL_LOG_EMAIL=you@example.com \
MEAL_LOG_PASSWORD=your-password \
npm run push:daily-meals -- --dry-run
```

4. For future dates, set `MEAL_LOG_DATE` and `MEAL_LOG_DAYS` (simple, safe and repeatable):

```bash
MEAL_LOG_BASE_URL=https://your-site.example.com \
MEAL_LOG_EMAIL=you@example.com \
MEAL_LOG_PASSWORD=your-password \
MEAL_LOG_DATE=2026-03-16 \
MEAL_LOG_DAYS=7 \
npm run push:daily-meals
```

This writes meal entries for every date in the range, choosing day-specific meals, date overrides, or default menu.


4. Push the meals for today, or backfill a specific date:

```bash
MEAL_LOG_BASE_URL=https://your-site.example.com \
MEAL_LOG_EMAIL=you@example.com \
MEAL_LOG_PASSWORD=your-password \
npm run push:daily-meals
```

```bash
MEAL_LOG_BASE_URL=https://your-site.example.com \
MEAL_LOG_EMAIL=you@example.com \
MEAL_LOG_PASSWORD=your-password \
npm run push:daily-meals -- --date=2026-03-17
```

Optional environment variables:
- `MEAL_LOG_FILE` — alternate JSON config path
- `MEAL_LOG_TIMEZONE` — overrides the plan timezone and the machine timezone
- `MEAL_LOG_DATE` — alternate target date
- `MEAL_LOG_DRY_RUN=true` — preview mode without POST/PUT requests

The script authenticates through `/api/auth/login`, fetches existing meals for the target date, and updates matching entries instead of duplicating them. Matching uses `mealType + name + amount + scheduled time`.

Example `cron` entry for every day at 8:00 AM local time:

```cron
0 8 * * * cd /Users/shreyakb/HealthyCal && TZ=America/Indiana/Indianapolis MEAL_LOG_BASE_URL=https://your-site.example.com MEAL_LOG_EMAIL=you@example.com MEAL_LOG_PASSWORD='your-password' npm run push:daily-meals >> /tmp/healthycal-meal-log.log 2>&1
```

## Testing
- End-to-end tests: Cypress config and specs are under `cypress/e2e` (e.g. `cypress/e2e/auth.cy.js`).
- Unit/API tests: Jest + Supertest tests are located in `server/tests` (e.g. `server/tests/auth.test.js`).
- Run all tests: `npm test` (this will start the app and run E2E + unit tests per `package.json`).

