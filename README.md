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
- `push:daily-meals:daily` — load `scripts/meal-log.env` and push the planned meals
- `install:daily-meals-cron` — install or update a daily cron job for the wrapper script
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

1. Create a local env file and plan file from the examples:

```bash
cp scripts/meal-log.env.example scripts/meal-log.env
cp scripts/meal-log-plan.example.json scripts/meal-log-plan.json
```

2. Update `scripts/meal-log.env` with the website URL and account credentials you want to post into.

Required values:
- `MEAL_LOG_BASE_URL`
- `MEAL_LOG_EMAIL`
- `MEAL_LOG_PASSWORD`

3. Update `scripts/meal-log-plan.json` with the meals you want posted.

The checked-in example is a realistic Monday-Sunday week that repeats automatically for future weeks.

Supported config shapes:
- `days.default` for every day
- `days.monday`, `days.tuesday`, etc. for weekday-specific meals
- `dates.YYYY-MM-DD` for one-off overrides
- `dailyCalorieLimit` to reject any day that goes over your cap

Each meal entry supports:
- `mealType`: `breakfast`, `lunch`, `dinner`, or `snack`
- `time`: `HH:MM` 24-hour local time
- `name`
- `amount`
- `calories`
- `imageUrl` (optional)
- `macros` (optional: `carbs`, `protein`, `fat`, `fiber`, `sugar`, `sodium`, `cholesterol`, `saturatedFat`)

4. Run a dry run first.

`--dry-run` only validates and previews the plan. It does not need website credentials or network access:

```bash
npm run push:daily-meals:daily -- --dry-run
```

5. Push today’s meals with the wrapper script:

```bash
npm run push:daily-meals:daily
```

6. Backfill a specific date or several days:

```bash
npm run push:daily-meals:daily -- --date=2026-04-07
```

```bash
npm run push:daily-meals:daily -- --date=2026-04-07 --days=7
```

This writes meal entries for every date in the range, choosing day-specific meals, date overrides, or default menu.

Optional environment variables:
- `MEAL_LOG_FILE` — alternate JSON config path
- `MEAL_LOG_TIMEZONE` — overrides the plan timezone and the machine timezone
- `MEAL_LOG_DATE` — alternate target date
- `MEAL_LOG_DAYS` — number of consecutive dates to push
- `MEAL_LOG_DRY_RUN=true` — preview mode without POST/PUT requests

The script authenticates through `/api/auth/login`, fetches existing meals for the target date, and updates matching entries instead of duplicating them. Matching uses `mealType + name + amount + scheduled time`.

7. Install a cron job for every day at 8:00 AM local time:

```bash
npm run install:daily-meals-cron
```

Use a different time by passing `HH:MM`:

```bash
npm run install:daily-meals-cron -- 06:30
```

## Testing
- End-to-end tests: Cypress config and specs are under `cypress/e2e` (e.g. `cypress/e2e/auth.cy.js`).
- Unit/API tests: Jest + Supertest tests are located in `server/tests` (e.g. `server/tests/auth.test.js`).
- Run all tests: `npm test` (this will start the app and run E2E + unit tests per `package.json`).
