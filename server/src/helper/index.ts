
/**
 * Safely extract value from different formats:
 * - string
 * - { __cdata: "" }
 * - { text: "" }
 */
export function getValue(field: any) {
    if (!field) return ''

    if (typeof field === 'string') return field

    if (typeof field === 'object') {
        return field.__cdata || field.text || ''
    }

    return ''
}

/**
 * Normalize category into array
 */
export function normalizeCategory(category: any) {
    if (!category) return []
    return Array.isArray(category) ? category : [category]
}


