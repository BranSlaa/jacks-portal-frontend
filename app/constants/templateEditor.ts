// URL regex for auto-linking
export const URL_REGEX =
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;

// Template variable constants
export const TEMPLATE_VARIABLES = [
    { label: 'First Name', value: '{{firstName}}' },
    { label: 'Last Name', value: '{{lastName}}' },
    { label: 'Full Name', value: '{{fullName}}' },
    { label: 'Email', value: '{{email}}' },
    { label: 'Company', value: '{{company}}' },
];
