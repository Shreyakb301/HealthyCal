# HealthyCal

HealthyCal is a mindful eating web app for tracking meals, calories, nutrition details, and daily healthy habits. It helps users log breakfast, lunch, dinner, and snacks while keeping their daily progress easy to understand. The project combines a React frontend with an Express and MongoDB backend for authentication, saved meal logs, and nutrition-focused features.

## Demo

[View the live website](https://healthy-cal.vercel.app/)

<video src="public/healthycal-demo.mp4" controls width="100%">
  Your browser does not support the video tag. Watch the demo here: [public/healthycal-demo.mp4](public/healthycal-demo.mp4).
</video>

## Project Structure

- `src/` — React frontend source code
- `src/components/` — reusable UI pieces for authentication, meal logs, nutrition search, and food tables
- `src/context/` — shared React state for user authentication and meal data
- `src/services/` — API helper functions used by the frontend
- `server/` — Express backend application
- `server/routes/` — API routes for authentication and meal records
- `server/models/` — MongoDB models for users and meals
- `public/` — static assets, including the demo video

## Frontend

- Built with React and Vite
- Uses reusable components for login, registration, meal tracking, nutrition search, and food display
- Manages app-wide user and meal state with React context
- Connects to the backend through a centralized API service
- Presents meal data in a simple dashboard-style interface

## Special Features

- User registration and login
- Meal logging for breakfast, lunch, dinner, and snacks
- Calorie and nutrition tracking
- Daily tips for mindful eating
- Nutrition search and food table views
- Automated daily meal entry support

## How It Works

Users create an account or log in, then add meals with names, amounts, calories, times, and nutrition details. The frontend sends each action to the Express API, which validates the request and stores the data in MongoDB. When users return to the app, their saved meals are loaded back into the dashboard so they can review and manage their daily eating habits.

## Tech Stack

- React
- Vite
- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens
- Cypress
- Jest
