## Prerequisites

- Node.js (v18+)
- Local Redis Server
- Local MongoDB

## Installation & Setup

1. **Clone & Install Server**
   ```bash
   cd server
   npm install
   ```
   *Note: Ensure your Redis server is running locally on port 6379, and MongoDB on 27017. If not, edit the `.env` inside the `/server` directory.*

2. **Install Client**
   ```bash
   cd client
   npm install
   ```

## Running Efficiently Using Docker

The easiest and most efficient way to spin up the entire architecture (Frontend, Backend, BullMQ, Redis, MongoDB) in an isolated, production-like environment is using Docker Compose.

```bash
# Build and run the containers in detached mode
docker-compose up -d --build
```

**Beneficial Docker Commands:**
- `docker-compose logs -f`: View real-time logs from all services (extremely useful for monitoring cron and BullMQ queues).
- `docker-compose stop`: Stop the application without destroying data volumes.
- `docker-compose down -v`: Tear down the application and completely wipe the MongoDB/Redis data volumes.

**Access the application:**
1. Open your browser and navigate to `http://localhost:3000`.
2. The server will be automatically networked to Redis and Mongo internally, but the API is exposed on port 4000 for your Next.js client.

## Running the Application Manually

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```
*This starts the Express API on port 4000, initializes the BullMQ workers, and starts the node-cron scheduler.*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
*This starts the Next.js application on port 3000.*

## Usage

1. Open your browser and navigate to `http://localhost:3000`.
2. You will see the Job Import History screen.
3. Depending on the schedule, imports begin automatically. However, you can click **"Run Manual Fetch"** to immediately dispatch tests for the XML job feeds.
4. The dashboard will update in real-time utilizing Socket.IO integrations.

## Environment Variables (.env)
The `/server/.env` is auto-generated for local execution:
- `PORT` (default: 4000)
- `MONGO_URI` (default: mongodb://127.0.0.1:27017/job-importer)
- `REDIS_URL` (default: redis://127.0.0.1:6379)
- `BATCH_SIZE` (default: 100 - Defines the chunk size per Job worker)
- `MAX_CONCURRENCY` (default: 3 - Number of workers running simultaneously)