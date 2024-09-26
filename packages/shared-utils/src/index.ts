// api/packages/shared-utils/src/index.ts

/**
 * Date formatting utility
 */
export const DateUtils = {
    /**
     * Formats a date to YYYY-MM-DD format
     * @param date The date to format
     * @returns Formatted date string
     */
    formatDate(date: Date): string {
        return date.toISOString().split('T')[0]
    },

    /**
     * Formats a date to a locale-specific string
     * @param date The date to format
     * @param locale The locale to use (default: 'en-US')
     * @returns Formatted date string
     */
    formatDateLocale(date: Date, locale: string = 'en-US'): string {
        return date.toLocaleDateString(locale)
    }
}

/**
 * String manipulation utilities
 */
export const StringUtils = {
    /**
     * Validates an email address
     * @param email The email to validate
     * @returns True if the email is valid, false otherwise
     */
    validateEmail(email: string): boolean {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return re.test(email)
    },

    /**
     * Generates a random string of specified length
     * @param length The length of the string to generate
     * @returns Random string
     */
    generateRandomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('')
    },

    /**
     * Truncates a string to a specified length
     * @param str The string to truncate
     * @param maxLength The maximum length of the string
     * @returns Truncated string
     */
    truncateString(str: string, maxLength: number): string {
        return str.length <= maxLength ? str : `${str.slice(0, maxLength)}...`
    },

    /**
     * Capitalizes the first letter of each word in a string
     * @param str The string to capitalize
     * @returns Capitalized string
     */
    capitalizeWords(str: string): string {
        return str.replace(/\b\w/g, (l) => l.toUpperCase())
    }
}

/**
 * Number and currency formatting utilities
 */
export const NumberUtils = {
    /**
     * Formats a number as currency
     * @param amount The amount to format
     * @param currency The currency code (default: 'USD')
     * @param locale The locale to use for formatting (default: 'en-US')
     * @returns Formatted currency string
     */
    formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }
}

/**
 * Function utilities
 */
export const FunctionUtils = {
    /**
     * Debounce function
     * @param func The function to debounce
     * @param wait The number of milliseconds to delay
     * @returns Debounced function
     */
    debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout | null = null
        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => func(...args), wait)
        }
    }
}

// Re-export all utilities for backwards compatibility
export const {
    formatDate,
    formatDateLocale
} = DateUtils

export const {
    validateEmail,
    generateRandomString,
    truncateString,
    capitalizeWords
} = StringUtils

export const {
    formatCurrency
} = NumberUtils

export const {
    debounce
} = FunctionUtils