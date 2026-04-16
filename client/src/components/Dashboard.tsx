"use client";

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { Activity, Play } from 'lucide-react';
import { fetchLogs, triggerImportFetch, getSocketUrl } from '@/lib/api';

interface ImportLog {
    _id: string;
    fileName: string;
    importDateTime: string;
    total: number;
    new: number;
    updated: number;
    failed: number;
    status: string;
}

export default function Dashboard() {
    const [logs, setLogs] = useState<ImportLog[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        fetchLogs()
            .then(data => setLogs(data))
            .catch(err => console.error("Failed to fetch logs", err));

        const newSocket = io(getSocketUrl());
        setSocket(newSocket);

        newSocket.on('import_update', (updatedLog: ImportLog) => {
            setLogs(prevLogs => {
                const index = prevLogs.findIndex(log => log._id === updatedLog._id);
                if (index !== -1) {
                    const newArray = [...prevLogs];
                    newArray[index] = updatedLog;
                    return newArray;
                } else {
                    return [updatedLog, ...prevLogs];
                }
            });
        });

        return () => {
            newSocket.close();
        };
    }, []);

    const triggerImport = async () => {
        try {
            await triggerImportFetch();
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-6 rounded-xl border border-border shadow-sm gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1">Import History</h1>
                    </div>
                    <button
                        onClick={triggerImport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium whitespace-nowrap shadow-sm hover:shadow active:scale-95"
                    >
                        Run Manual Fetch
                    </button>
                </div>

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground border-b border-border font-medium">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">File Name (URL)</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Import Date Time</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 text-center">Total</th>
                                    <th className="px-6 py-4 text-center">New</th>
                                    <th className="px-6 py-4 text-center">Updated</th>
                                    <th className="px-6 py-4 text-center">Failed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium max-w-[200px] sm:max-w-xs truncate" title={log.fileName}>
                                            {log.fileName}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                            {log.importDateTime ? format(new Date(log.importDateTime), 'dd MMM yyyy HH:mm:ss') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${log.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                log.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {log.status === 'PROCESSING' && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                )}
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold text-orange-500/90">{log.total}</td>
                                        <td className="px-6 py-4 text-center font-semibold text-orange-400">{log.new}</td>
                                        <td className="px-6 py-4 text-center font-semibold text-orange-600">{log.updated}</td>
                                        <td className="px-6 py-4 text-center font-semibold text-red-500">{log.failed}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Activity className="h-10 w-10 text-muted-foreground/40" />
                                                <p className="text-base font-medium">No import history found</p>
                                                <p className="text-xs">Trigger a manual fetch to start processing job feeds.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}