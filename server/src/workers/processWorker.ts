import { Worker, Job as BullJob } from 'bullmq';
import { connection } from '../config/redis';
import { Job } from '../models/Job';
import { ImportLog } from '../models/ImportLog';
import { getIO } from '../config/socket';

export const processWorker = new Worker('ProcessQueue', async (job: BullJob) => {
    const { items, importLogId } = job.data;

    let newCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    const operations = items.map((item: any) => {
        // Generate a fallback if guid missing
        const jobId = item.guid ? (typeof item.guid === 'object' ? item.guid['#text'] || item.guid : item.guid) : item.link;
        const title = item.title || 'No Title';
        const company = item['dc:creator'] || item.company || 'Unknown';
        const url = item.link || '';
        const description = item.description || item['content:encoded'] || '';
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const category = Array.isArray(item.category) ? item.category : [item.category].filter(Boolean);

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
                        rawFeedData: item,
                    }
                },
                upsert: true
            }
        };
    });

    try {
        const result = await Job.bulkWrite(operations, { ordered: false });
        newCount = result.upsertedCount || 0;
        updatedCount = result.modifiedCount || 0;
    } catch (err: any) {
        if (err.result) {
            newCount = err.result.upsertedCount || 0;
            updatedCount = err.result.modifiedCount || 0;
        }
        failedCount = items.length - (newCount + updatedCount);
        console.error(`Bulkwrite partial error:`, err.message);
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
    );

    if (log) {
        if (log.total >= (log.jobCount || Infinity)) {
            if (log.status !== 'COMPLETED') {
                log.status = 'COMPLETED';
                await log.save();
            }
        }
        try { getIO().emit('import_update', log); } catch (e) { }
    }
}, {
    connection,
    concurrency: parseInt(process.env.MAX_CONCURRENCY || '5', 10)
});

processWorker.on('error', err => {
    console.error('Process Worker Error:', err);
});