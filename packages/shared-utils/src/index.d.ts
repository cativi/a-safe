/**
 * Date formatting utility
 */
export declare const DateUtils: {
    /**
     * Formats a date to YYYY-MM-DD format
     * @param date The date to format
     * @returns Formatted date string
     */
    formatDate(date: Date): string;
    /**
     * Formats a date to a locale-specific string
     * @param date The date to format
     * @param locale The locale to use (default: 'en-US')
     * @returns Formatted date string
     */
    formatDateLocale(date: Date, locale?: string): string;
};
/**
 * String manipulation utilities
 */
export declare const StringUtils: {
    /**
     * Validates an email address
     * @param email The email to validate
     * @returns True if the email is valid, false otherwise
     */
    validateEmail(email: string): boolean;
    /**
     * Generates a random string of specified length
     * @param length The length of the string to generate
     * @returns Random string
     */
    generateRandomString(length: number): string;
    /**
     * Truncates a string to a specified length
     * @param str The string to truncate
     * @param maxLength The maximum length of the string
     * @returns Truncated string
     */
    truncateString(str: string, maxLength: number): string;
    /**
     * Capitalizes the first letter of each word in a string
     * @param str The string to capitalize
     * @returns Capitalized string
     */
    capitalizeWords(str: string): string;
};
/**
 * Number and currency formatting utilities
 */
export declare const NumberUtils: {
    /**
     * Formats a number as currency
     * @param amount The amount to format
     * @param currency The currency code (default: 'USD')
     * @param locale The locale to use for formatting (default: 'en-US')
     * @returns Formatted currency string
     */
    formatCurrency(amount: number, currency?: string, locale?: string): string;
};
/**
 * Function utilities
 */
export declare const FunctionUtils: {
    /**
     * Debounce function
     * @param func The function to debounce
     * @param wait The number of milliseconds to delay
     * @returns Debounced function
     */
    debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
};
export declare const formatDate: (date: Date) => string, formatDateLocale: (date: Date, locale?: string) => string;
export declare const validateEmail: (email: string) => boolean, generateRandomString: (length: number) => string, truncateString: (str: string, maxLength: number) => string, capitalizeWords: (str: string) => string;
export declare const formatCurrency: (amount: number, currency?: string, locale?: string) => string;
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => (...args: Parameters<T>) => void;
