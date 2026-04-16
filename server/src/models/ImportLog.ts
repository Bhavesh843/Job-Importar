import mongoose, { Schema, Document } from 'mongoose'

export interface IImportLog extends Document {
    fileName: string
    importDateTime: Date
    total: number
    new: number
    updated: number
    failed: number
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
    errorReason?: string
    jobCount?: number
}

const ImportLogSchema: Schema = new Schema({
    fileName: { type: String, required: true },
    importDateTime: { type: Date, default: Date.now },
    total: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    status: { type: String, enum: ['PROCESSING', 'COMPLETED', 'FAILED'], default: 'PROCESSING' },
    errorReason: { type: String },
    jobCount: { type: Number, default: 0 },
}, {
    timestamps: true
})

export const ImportLog = mongoose.model<IImportLog>('import_logs', ImportLogSchema)