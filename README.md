## Vedic Astrology App

Full-stack Vedic astrology application with a **FastAPI** backend, **React + Vite** frontend, and **PostgreSQL** database, all wired together via Docker for easy development.

### Project structure

- **backend** – FastAPI app (astrology calculations, chat, auth, people)
- **frontend** – React + Vite SPA
- **docker-compose.yml** – Orchestrates Postgres, backend, and frontend
- **DOCKER.md** – Detailed Docker usage and workflow

### Requirements

- Docker & Docker Compose (recommended way to run for dev)
- Or:
  - Python 3.11+
  - Node.js 20+ / npm
  - Local Postgres instance

### Quick start (Docker)

1. Copy the example env file and adjust secrets:

   ```bash
   cp .env.example .env
   # edit .env to set POSTGRES_PASSWORD and any overrides you like
   ```

2. Build and start all services:

   ```bash
   docker compose up --build
   ```

3. Open in your browser:

   - Frontend: `http://localhost:5173`
   - API docs (Swagger UI): `http://localhost:8000/docs`

For more detailed Docker notes, see `DOCKER.md`.

### Running backend without Docker (optional)

1. Create and activate a virtualenv in `backend/`.
2. Install dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. Set environment variables (for example in a `backend/.env`):

   ```env
   POSTGRES_USER=astro_user
   POSTGRES_PASSWORD=your_password
   POSTGRES_SERVER=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=astro_db
   ```

4. Run the API:

   ```bash
   cd backend
   uvicorn main:app --reload
   ```

### Running frontend without Docker (optional)

```bash
cd frontend
npm install
npm run dev
```

The frontend expects `VITE_API_URL` (or defaults to `http://localhost:8000`) to reach the backend.

