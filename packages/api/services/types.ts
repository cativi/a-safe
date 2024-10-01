// a-safe/packages/api/services/types.ts

// Type definition for options used when uploading images
export type UploadOptions = {
    [key: string]: string | number | undefined; // Allow additional optional properties of type string, number, or undefined
    title?: string; // Title of the image (optional)
    description?: string; // Description of the image (optional)
    album_id?: string; // ID of the album to which the image belongs (optional)
    category_id?: number; // ID of the category (optional)
    width?: number; // Width of the image (optional)
    expiration?: string; // Expiration duration for the image (optional)
    nsfw?: 0 | 1; // Indicates whether the image is NSFW (0 = no, 1 = yes) (optional)
    format?: 'json' | 'redirect' | 'txt'; // Format of the response from the upload ('json', 'redirect', or 'txt') (optional)
};

// Interface definition for the response received from the ShareMyImage service
export interface ShareMyImageResponse {
    status_code: number; // HTTP status code of the response
    status_txt: string; // Status text or message

    // Optional success object containing details of the successful response
    success?: {
        message: string; // Success message
        code: number; // Success code
    };

    // Optional error object containing details of an error response
    error?: {
        message: string; // Error message
        code: number; // Error code
    };

    // Optional image object containing details of the uploaded image
    image?: {
        name: string; // Name of the uploaded image
        extension: string; // File extension of the image
        size: number; // Size of the image in bytes
        width: number; // Width of the image in pixels
        height: number; // Height of the image in pixels
        date: string; // Date of the image upload (local timezone)
        date_gmt: string; // Date of the image upload in GMT
        storage_id: string | null; // ID of the storage (optional)
        description: string | null; // Description of the image (optional)
        nsfw: string; // Indicates if the image is NSFW
        md5: string; // MD5 hash of the image
        storage: string; // Storage type used for the image
        original_filename: string; // Original filename of the uploaded image
        original_exifdata: string | null; // EXIF data of the original image (optional)
        views: string; // Number of times the image has been viewed
        id_encoded: string; // Encoded ID of the image
        filename: string; // Filename of the image
        ratio: number; // Ratio of the image (width to height)
        size_formatted: string; // Formatted size of the image (e.g., "2 MB")
        mime: string; // MIME type of the image
        bits: number; // Number of bits per channel
        channels: number | null; // Number of color channels (optional)
        url: string; // URL of the original image
        url_viewer: string; // URL to view the image
        thumb: {
            filename: string; // Thumbnail filename
            name: string; // Thumbnail name
            width: number; // Width of the thumbnail
            height: number; // Height of the thumbnail
            ratio: number; // Ratio of the thumbnail
            size: number; // Size of the thumbnail in bytes
            size_formatted: string; // Formatted size of the thumbnail
            mime: string; // MIME type of the thumbnail
            extension: string; // File extension of the thumbnail
            bits: number; // Number of bits per channel in the thumbnail
            channels: number | null; // Number of color channels in the thumbnail (optional)
            url: string; // URL of the thumbnail
        };
        medium: {
            filename: string; // Medium-sized image filename
            name: string; // Medium-sized image name
            width: number; // Width of the medium-sized image
            height: number; // Height of the medium-sized image
            ratio: number; // Ratio of the medium-sized image
            size: number; // Size of the medium-sized image in bytes
            size_formatted: string; // Formatted size of the medium-sized image
            mime: string; // MIME type of the medium-sized image
            extension: string; // File extension of the medium-sized image
            bits: number; // Number of bits per channel in the medium-sized image
            channels: number | null; // Number of color channels in the medium-sized image (optional)
            url: string; // URL of the medium-sized image
        };
        views_label: string; // Label for the number of views (e.g., "1.2K views")
        display_url: string; // URL to display the image
        how_long_ago: string; // Time elapsed since the image was uploaded (e.g., "2 hours ago")
    };
}
