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

## Testing
- End-to-end tests: Cypress config and specs are under `cypress/e2e` (e.g. `cypress/e2e/auth.cy.js`).
- Unit/API tests: Jest + Supertest tests are located in `server/tests` (e.g. `server/tests/auth.test.js`).
- Run all tests: `npm test` (this will start the app and run E2E + unit tests per `package.json`).


