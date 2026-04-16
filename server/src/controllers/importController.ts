import { Request, Response } from 'express'
import { ImportLog } from '../models/ImportLog'
import { importQueue } from '../queues'

export const getImportLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const logs = await ImportLog.find().sort({ importDateTime: -1 }).limit(100)
        res.json(logs)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
}

export const triggerImport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { url } = req.body
        if (url) {
            await importQueue.add('importUrl', { url })
            res.json({ message: `Triggered manual fetch for ${url}` })
            return
        }

        // Default manual triggers
        const urlsToFetch = [
            'https://jobicy.com/?feed=job_feed',
            'https://www.higheredjobs.com/rss/articleFeed.cfm'
        ]
        for (const u of urlsToFetch) {
            await importQueue.add('importUrl', { url: u })
        }
        res.json({ message: 'Triggered default test URLs' })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
}