import { Worker, Job as BullJob } from 'bullmq'
import { connection } from '../config/redis'
import { Job } from '../models/Job'
import { ImportLog } from '../models/ImportLog'
import { getIO } from '../config/socket'
import { getValue, normalizeCategory } from '../helper'

export const processWorker = new Worker('ProcessQueue', async (job: BullJob) => {
    const { items, importLogId } = job.data

    let newCount = 0
    let updatedCount = 0
    let failedCount = 0

    const operations = items.map((item: any) => {
        // Generate a fallback if guid missing
        const jobId = item.id
        const title = item.title || 'No Title'
        const company =
            getValue(item['job_listing:company']) ||
            item['dc:creator'] ||
            item.company ||
            ''
        const url = item.link || ''
        const description =
            getValue(item.description) || ''

        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date()
        const category = normalizeCategory(item.category)
        const location = getValue(item['job_listing:location'])
        const jobType = getValue(item['job_listing:job_type'])
        const image = item['media:content']?.url || ''

        return {
            updateOne: {
                filter: { jobId: String(jobId) },
                update: {
                    $set: {
                        jobId: String(jobId),
                        title,
                        company,
                        url,
                        description,
                        pubDate,
                        category,
                        location,
                        jobType,
                        imageUrl: image
                    }
                },
                upsert: true
            }
        }
    })

    try {
        const result = await Job.bulkWrite(operations, { ordered: false })
        newCount = result.upsertedCount || 0
        updatedCount = result.modifiedCount || 0
    } catch (err: any) {
        if (err.result) {
            newCount = err.result.upsertedCount || 0
            updatedCount = err.result.modifiedCount || 0
        }
        failedCount = items.length - (newCount + updatedCount)
        console.error(`Bulkwrite partial error:`, err.message)
    }

    const log = await ImportLog.findByIdAndUpdate(
        importLogId,
        {
            $inc: {
                total: items.length, // total jobs encountered in this batch
                new: newCount,
                updated: updatedCount,
                failed: failedCount
            }
        },
        { new: true }
    )

    if (log) {
        if (log.total >= (log.jobCount || Infinity)) {
            if (log.status !== 'COMPLETED') {
                log.status = 'COMPLETED'
                await log.save()
            }
        }
        try { getIO().emit('import_update', log) } catch (e) { }
    }
}, {
    connection,
    concurrency: parseInt(process.env.MAX_CONCURRENCY || '5', 10)
})

processWorker.on('error', err => {
    console.error('Process Worker Error:', err)
})