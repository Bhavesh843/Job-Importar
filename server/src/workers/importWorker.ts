import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { ImportLog } from '../models/ImportLog';
import { processQueue } from '../queues';
import { getIO } from '../config/socket';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: 'text',
    cdataPropName: '__cdata'
});

export const importWorker = new Worker('ImportQueue', async (job: Job) => {
    const url: string = job.data.url;
    console.log(`Starting import for ${url}`);

    const importLog = new ImportLog({
        fileName: url,
        status: 'PROCESSING'
    });
    await importLog.save();

    try {
        getIO().emit('import_update', importLog);
    } catch (e) {
        console.log('Error while import socket emit', e)
    } // if IO not init

    try {
        const { data: xmlData } = await axios.get(url, { timeout: 30000 });
        const jsonData = parser.parse(xmlData);

        let items: any[] = [];
        if (jsonData?.rss?.channel?.item) {
            items = Array.isArray(jsonData.rss.channel.item)
                ? jsonData.rss.channel.item
                : [jsonData.rss.channel.item];
        } else {
            throw new Error('Unsupported XML format or no items found');
        }

        importLog.jobCount = items.length;
        await importLog.save();
        try {
            getIO().emit('import_update', importLog);
        } catch (e) {
            console.error(`Failed to emit update for ${url}:`, e);
        }

        const batchSize = parseInt(process.env.BATCH_SIZE || '100', 10);
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await processQueue.add('processBatch', {
                items: batch,
                importLogId: importLog._id
            }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 }
            });
        }

        console.log(`Dispatched ${Math.ceil(items.length / batchSize)} batches for ${url}`);

        // Note: status stays PROCESSING until all batches finish
        // A separate cron or processWorker logic can check completion

    } catch (err: any) {
        console.error(`Import failed for ${url}:`, err.message);
        importLog.status = 'FAILED';
        importLog.errorReason = err.message || 'Unknown error';
        await importLog.save();
        try { getIO().emit('import_update', importLog); } catch (e) { }
        throw err;
    }
}, {
    connection,
    concurrency: 2
});

importWorker.on('error', err => {
    console.error('Import Worker Error:', err);
});