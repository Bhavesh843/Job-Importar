import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
    jobId: string; // usually guid or link from RSS
    title: string;
    company: string;
    url: string;
    description: string;
    pubDate: Date;
    category: string[];
    rawFeedData: any;
}

const JobSchema: Schema = new Schema({
    jobId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    company: { type: String },
    url: { type: String, required: true },
    description: { type: String },
    pubDate: { type: Date },
    category: [{ type: String }],
    rawFeedData: { type: Schema.Types.Mixed }
}, {
    timestamps: true
});

export const Job = mongoose.model<IJob>('Job', JobSchema);