// /a-safe/packages/api/__mocks__/shared-utils.ts:

export const DateUtils = {
    formatDate: jest.fn((date: Date) => '2024-01-01'),
    formatDateLocale: jest.fn((date: Date, locale: string = 'en-US') => '1/1/2024'),
};

export const StringUtils = {
    validateEmail: jest.fn((email: string) => true),
    generateRandomString: jest.fn((length: number) => 'randomstring'),
    truncateString: jest.fn((str: string, maxLength: number) => str),
    capitalizeWords: jest.fn((str: string) => str.toUpperCase()),
};

export const NumberUtils = {
    formatCurrency: jest.fn((amount: number, currency: string = 'USD', locale: string = 'en-US') => '$100.00'),
};

export const FunctionUtils = {
    debounce: jest.fn(<T extends (...args: any[]) => any>(func: T, wait: number) => func),
};

// Re-export all utilities for backwards compatibility
export const {
    formatDate,
    formatDateLocale
} = DateUtils;

export const {
    validateEmail,
    generateRandomString,
    truncateString,
    capitalizeWords
} = StringUtils;

export const {
    formatCurrency
} = NumberUtils;

export const {
    debounce
} = FunctionUtils;