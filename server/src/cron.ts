import cron from 'node-cron'
import { importQueue } from './queues'

const urlsToFetch = [
    'https://jobicy.com/?feed=job_feed',
    'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
    'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
    'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
    'https://jobicy.com/?feed=job_feed&job_categories=data-science',
    'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
    'https://jobicy.com/?feed=job_feed&job_categories=business',
    'https://jobicy.com/?feed=job_feed&job_categories=management',
    'https://www.higheredjobs.com/rss/articleFeed.cfm'
]

export const startCronJobs = () => {
    // Run every 1 hour -> '0 * * * *'
    cron.schedule('0 * * * *', async () => {
        const currentTime = new Date().toLocaleString()
        console.log(`[${currentTime}] Cron started: Starting hourly import queue process`)
        for (const url of urlsToFetch) {
            await importQueue.add('importUrl', { url }, {
                removeOnComplete: true,
                removeOnFail: false
            })
        }
    })

    console.log('Cron scheduler initialized for hourly fetching')
}
