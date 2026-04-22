# fullstack-deploy-lab

TaskFlow Board is a beginner-friendly full-stack CRUD project built with:

- FastAPI
- React + Vite
- PostgreSQL
- SQLAlchemy
- Pydantic
- Docker and docker-compose

The app lets users create, edit, delete, search, filter, and track tasks by status and priority. It also includes summary cards for total tasks and task counts by status.

## Project Structure

```text
fullstack-deploy-lab/
├── backend/
├── frontend/
├── Dockerfile
├── docker-compose.yml
├── README.md
├── .env.example
└── .gitignore
```

## Features

- Create tasks
- Edit tasks
- Delete tasks
- Mark tasks as `todo`, `in-progress`, or `done`
- Set priority as `low`, `medium`, or `high`
- Search tasks
- Filter by status and priority
- Summary cards for totals
- `/health` endpoint
- Development CORS
- Seed script with sample tasks
- Production build where FastAPI serves the frontend static files from one container

## Local Development With Docker

1. Copy the environment example file:

```powershell
Copy-Item .env.example .env
```

2. Start PostgreSQL, backend, and frontend:

```powershell
docker compose up --build -d
```

3. In a second terminal, seed the database:

```powershell
docker compose exec backend python -m app.seed
```

4. Open the app:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/health
- API docs: http://localhost:8000/docs

## Backend-Only Local Run

If you want to run the backend outside Docker:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="postgresql+psycopg2://taskflow:taskflow@localhost:5432/taskflow"
$env:PORT="8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Frontend-Only Local Run

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL="http://localhost:8000"
npm run dev -- --host 0.0.0.0 --port 5173
```

## Production Docker Build

The root `Dockerfile` builds the React app and copies the production static files into the FastAPI container.

Build the production image:

```powershell
docker build -t fullstack-deploy-lab .
```

Run it with your production `DATABASE_URL` and `PORT`:

```powershell
docker run -p 8000:8000 --env-file .env fullstack-deploy-lab
```

Important:

- The app still needs a PostgreSQL database in production.
- The backend serves the built frontend from the same container.
- Set `DATABASE_URL` to your production PostgreSQL host.

## Seed Script

The sample data loader lives at `backend/app/seed.py`.

Run it after the backend and database are up:

```powershell
docker compose exec backend python -m app.seed
```

## GitHub Push Steps

Use these exact commands to publish the project to GitHub:

```powershell
git init
git add .
git commit -m "Initial fullstack-deploy-lab"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fullstack-deploy-lab.git
git push -u origin main
```

## Deployment Notes

- Set `DATABASE_URL`, `PORT`, and `CORS_ORIGINS` in the deployment environment.
- The production container expects a reachable PostgreSQL server.
- The backend binds to `0.0.0.0` and reads the port from `PORT`.
- The frontend API URL is controlled by `VITE_API_BASE_URL` in development.
- For production, the frontend is built into the backend container, so there is only one app container to deploy.

## API Overview

- `GET /health` - health check
- `GET /tasks` - list tasks, with `search`, `status`, and `priority` query params
- `GET /tasks/summary` - summary counts
- `POST /tasks` - create a task
- `PUT /tasks/{task_id}` - update a task
- `DELETE /tasks/{task_id}` - delete a task
# taskboard-deploy-lab
