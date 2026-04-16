import { Router } from 'express'
import { getImportLogs, triggerImport } from '../controllers/importController'

const router = Router()

router.get('/logs', getImportLogs)
router.post('/trigger', triggerImport)

export default router