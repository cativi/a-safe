// a-safe/packages/api/services/types.ts

export type UploadOptions = {
    title?: string;
    description?: string;
    album_id?: string;
    category_id?: number;
    width?: number;
    expiration?: string;
    nsfw?: 0 | 1;
    format?: 'json' | 'redirect' | 'txt';
};

export interface ShareMyImageResponse {
    status_code: number;
    status_txt: string;
    success?: {
        message: string;
        code: number;
    };
    error?: {
        message: string;
        code: number;
    };
    image?: {
        name: string;
        extension: string;
        size: number;
        width: number;
        height: number;
        date: string;
        date_gmt: string;
        storage_id: string | null;
        description: string | null;
        nsfw: string;
        md5: string;
        storage: string;
        original_filename: string;
        original_exifdata: string | null;
        views: string;
        id_encoded: string;
        filename: string;
        ratio: number;
        size_formatted: string;
        mime: string;
        bits: number;
        channels: number | null;
        url: string;
        url_viewer: string;
        thumb: {
            filename: string;
            name: string;
            width: number;
            height: number;
            ratio: number;
            size: number;
            size_formatted: string;
            mime: string;
            extension: string;
            bits: number;
            channels: number | null;
            url: string;
        };
        medium: {
            filename: string;
            name: string;
            width: number;
            height: number;
            ratio: number;
            size: number;
            size_formatted: string;
            mime: string;
            extension: string;
            bits: number;
            channels: number | null;
            url: string;
        };
        views_label: string;
        display_url: string;
        how_long_ago: string;
    };
}