import mongoose from 'mongoose'

const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/job-importer'

export const connectDB = async () => {
    try {
        await mongoose.connect(URI)
        console.log('MongoDB connected successfully')
    } catch (error) {
        console.error('MongoDB connection error:', error)
        process.exit(1)
    }
}