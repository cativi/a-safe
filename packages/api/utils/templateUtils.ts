// a-safe/packages/api/utils/templateUtils.ts:

/**
 * templateUtils.ts
 * A collection of utility functions for secure template handling.
 */

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 * @param unsafeInput - The input that may contain unsafe characters.
 * @returns The input with HTML special characters escaped.
 */
export function escapeHtml(unsafeInput: unknown): string {
    if (typeof unsafeInput !== 'string') {
        return String(unsafeInput);
    }
    return unsafeInput.replace(/[&<>"']/g, (char) => {
        const escapeChars: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escapeChars[char] || char;
    });
}

/**
 * A template tag function that safely interpolates values into a string,
 * escaping HTML special characters to prevent XSS attacks.
 * @param strings - The static parts of the template string.
 * @param values - The dynamic values to be interpolated.
 * @returns The resulting string with safely interpolated values.
 */
export function safeHtml(strings: TemplateStringsArray, ...values: unknown[]): string {
    return strings.reduce((result, string, i) => {
        const value = values[i - 1];
        return result + string + (value !== undefined ? escapeHtml(value) : '');
    }, '');
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param string - The input string to be escaped.
 * @returns The input string with special regex characters escaped.
 */
export function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A simple template function that replaces placeholders in a string with provided values.
 * @param template - The template string with placeholders in the format ${key}.
 * @param data - An object containing the values to replace the placeholders.
 * @returns The template string with placeholders replaced by the provided values.
 */
export function simpleTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\${(\w+)}/g, (_, key) => escapeHtml(data[key] ?? ''));
}

/**
 * Truncates a string to a specified length, adding an ellipsis if truncated.
 * @param str - The input string to truncate.
 * @param length - The maximum length of the resulting string, including the ellipsis if added.
 * @returns The truncated string.
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length - 3) + '...';
}

/**
 * Capitalizes the first letter of a string.
 * @param str - The input string.
 * @returns The input string with its first letter capitalized.
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

