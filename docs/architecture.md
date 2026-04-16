# System Architecture

## Overview
This system is designed to scalably fetch, parse, and sink job feeds (XML/RSS) into a MongoDB database using an event-driven queueing architecture. A Next.js frontend provides real-time progress of these jobs.

## Component Breakdown

1. **Job Source Poller (Cron)**

   - Powered by `node-cron`, the system runs a scheduled execution (e.g., hourly) that drops multiple target URLs into an `ImportQueue`.
   - The cron operates simply as a dispatcher to ensure no heavy lifting occurs on the main event loop.

2. **BullMQ Queues + Redis**

   - **ImportQueue**: Picks up a feed URL, downloads the XML using `axios`, and processes it into JSON using `fast-xml-parser`. Because XMLs can contain thousands of records, this queue batches the job chunks (configured by `BATCH_SIZE`) and pushes them to the `ProcessQueue`.
   
   - **ProcessQueue**: Takes small batches of parsed jobs and executes a MongoDB `bulkWrite` with `upsert: true`. This queue has configurable concurrency via `MAX_CONCURRENCY` to adjust to database I/O limits.

3. **MongoDB + Mongoose**

   - Uses a schema-less structure for `rawFeedData` but maps standard fields (title, company, description, etc.).
   - Utilizes `ImportLog` to store state machines (`PROCESSING`, `COMPLETED`, `FAILED`) and maintain a counter of inserted/updated/failed jobs based on the `bulkWrite` operation results.

4. **Real-time Engine (Socket.IO)**

   - Every time a state machine updates an `ImportLog` document, an `import_update` event is emitted through `socket.io`.
   - The Next.js frontend listens for this payload to mutate its React state dynamically, offering a seamless UX without the need for active polling.

## Scalability Choices

- **Chunking**: By splitting a 10,000 document XML feed into batches of 100, we prevent large memory spikes and reduce blocking operations on MongoDB.
- **Queue Backpressure**: BullMQ limits active processing to `MAX_CONCURRENCY`. If more chunks are submitted than can be processed, they sit in Redis efficiently.
- **BulkWrites**: We avoid sending 100 individual save commands to MongoDB per batch by batching them into a single `bulkWrite`, yielding massive performance improvements.