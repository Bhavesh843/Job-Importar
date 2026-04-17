import { Queue } from 'bullmq'
import { connection } from '../config/redis'

export const importQueue = new Queue('ImportQueue', { connection })
export const processQueue = new Queue('ProcessQueue', { connection })