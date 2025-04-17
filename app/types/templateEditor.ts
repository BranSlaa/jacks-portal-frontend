export type Variable = {
    label: string;
    value: string;
};

export type FileCategory = 'image' | 'document' | 'spreadsheet' | 'presentation' | 'other';

export interface UploadedFile {
    name: string;
    path: string;
    size: number;
    type: string;
    url: string;
    width?: number;
    height?: number;
    category?: FileCategory;
    alt_text?: string;
} 