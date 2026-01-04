import { supabase } from './supabase';

// Unsplash API Configuration
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export interface UnsplashImage {
    id: string;
    url: string;
    thumbUrl: string;
    altText: string;
    photographer: string;
    photographerUrl: string;
    downloadUrl: string;
}

// Get Unsplash API key from database
export async function getUnsplashApiKey(): Promise<string | null> {
    const { data, error } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('key_name', 'unsplash_access_key')
        .eq('is_active', true)
        .single();

    if (error || !data?.key_value) {
        console.error('Failed to get Unsplash API key:', error);
        return null;
    }

    return data.key_value;
}

// Test Unsplash API connection
export async function testUnsplashConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = await getUnsplashApiKey();

    if (!apiKey) {
        return { success: false, message: 'Unsplash API key not found in database' };
    }

    try {
        const response = await fetch(`${UNSPLASH_API_URL}/photos/random?count=1`, {
            headers: {
                'Authorization': `Client-ID ${apiKey}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, message: error.errors?.[0] || 'API request failed' };
        }

        return { success: true, message: 'Unsplash API connected successfully!' };
    } catch (error) {
        return { success: false, message: `Connection failed: ${error}` };
    }
}

// Search for relevant images
export async function searchImages(query: string, count: number = 5): Promise<{
    data: UnsplashImage[] | null;
    error: string | null;
}> {
    const apiKey = await getUnsplashApiKey();

    if (!apiKey) {
        return { data: null, error: 'Unsplash API key not configured' };
    }

    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${apiKey}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return { data: null, error: error.errors?.[0] || 'Image search failed' };
        }

        const result = await response.json();

        const images: UnsplashImage[] = result.results.map((photo: any) => ({
            id: photo.id,
            url: photo.urls.regular,
            thumbUrl: photo.urls.thumb,
            altText: photo.alt_description || photo.description || query,
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            downloadUrl: photo.links.download_location,
        }));

        return { data: images, error: null };
    } catch (error) {
        return { data: null, error: `Image search failed: ${error}` };
    }
}

// Get a random image for a topic
export async function getRandomImage(query: string): Promise<{
    data: UnsplashImage | null;
    error: string | null;
}> {
    const apiKey = await getUnsplashApiKey();

    if (!apiKey) {
        return { data: null, error: 'Unsplash API key not configured' };
    }

    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${apiKey}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return { data: null, error: error.errors?.[0] || 'Failed to get image' };
        }

        const photo = await response.json();

        const image: UnsplashImage = {
            id: photo.id,
            url: photo.urls.regular,
            thumbUrl: photo.urls.thumb,
            altText: photo.alt_description || photo.description || query,
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            downloadUrl: photo.links.download_location,
        };

        return { data: image, error: null };
    } catch (error) {
        return { data: null, error: `Failed to get image: ${error}` };
    }
}

// Track download for Unsplash API guidelines
export async function trackDownload(downloadUrl: string): Promise<void> {
    const apiKey = await getUnsplashApiKey();
    if (!apiKey) return;

    try {
        await fetch(downloadUrl, {
            headers: {
                'Authorization': `Client-ID ${apiKey}`,
            },
        });
    } catch (error) {
        console.error('Failed to track Unsplash download:', error);
    }
}

// Generate image search query from blog topic
export function generateImageQuery(topic: string, category?: string): string {
    // Extract key terms for better image results
    const cleanTopic = topic
        .toLowerCase()
        .replace(/how to|what is|why|guide|complete|tips|best|top \d+/gi, '')
        .replace(/in india|2024|2025|2026/gi, '')
        .trim();

    // Add category context for better results
    const categoryQueries: Record<string, string> = {
        'Web Development': 'web development coding',
        'Technology': 'technology modern',
        'Business': 'business professional office',
        'E-commerce': 'online shopping ecommerce',
        'SEO': 'seo marketing digital',
        'AI Tools': 'artificial intelligence technology',
        'Marketing': 'digital marketing',
        'Tutorial': 'learning education',
    };

    const categoryContext = category && categoryQueries[category] ? categoryQueries[category] : '';

    // Combine and clean
    const query = `${cleanTopic} ${categoryContext}`.trim().substring(0, 100);

    return query || 'technology business';
}
