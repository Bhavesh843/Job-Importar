import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
import { initSocket } from './config/socket'
// Import workers to ensure they start processing
import './workers/importWorker'
import './workers/processWorker'
import { startCronJobs } from './cron'
import importRoutes from './routes/importRoutes'

dotenv.config()

const app = express()
const server = http.createServer(app)

// Middleware
app.use(cors({ origin: '*' }))
app.use(express.json())

// Initialize Database & Socket
connectDB()
initSocket(server)

// API Routes
app.use('/api', importRoutes)

// Start scheduled jobs
startCronJobs()

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
