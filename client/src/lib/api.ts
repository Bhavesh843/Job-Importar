const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const fetchLogs = async () => {
    const response = await fetch(`${API_BASE_URL}/logs`)
    if (!response.ok) {
        throw new Error('Failed to fetch logs')
    }
    return response.json()
}

export const triggerImportFetch = async () => {
    const response = await fetch(`${API_BASE_URL}/trigger`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) {
        throw new Error('Failed to trigger import')
    }
    return response.json()
}

export const getSocketUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
        : 'http://localhost:4000'
}