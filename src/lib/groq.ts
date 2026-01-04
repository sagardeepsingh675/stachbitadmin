import { supabase } from './supabase';

// Groq API Configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export interface BlogGenerationResult {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    category: string;
    tags: string[];
    read_time_minutes: number;
}

export interface GenerationOptions {
    topic: string;
    keywords?: string[];
    targetSite?: 'stachbit.in' | 'ai.stachbit.in' | 'both';
    category?: string;
    tone?: 'professional' | 'conversational' | 'technical';
    wordCount?: number;
}

// Get API key from database
export async function getGroqApiKey(): Promise<string | null> {
    const { data, error } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('key_name', 'groq_api_key')
        .eq('is_active', true)
        .single();

    if (error || !data?.key_value) {
        console.error('Failed to get Groq API key:', error);
        return null;
    }

    return data.key_value;
}

// Test Groq API connection
export async function testGroqConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = await getGroqApiKey();

    if (!apiKey) {
        return { success: false, message: 'Groq API key not found in database' };
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [{ role: 'user', content: 'Say "API connected successfully" in exactly 3 words.' }],
                max_tokens: 20,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, message: error.error?.message || 'API request failed' };
        }

        return { success: true, message: 'Groq API connected successfully!' };
    } catch (error) {
        return { success: false, message: `Connection failed: ${error}` };
    }
}

// Generate SEO-optimized blog content
export async function generateBlogContent(options: GenerationOptions): Promise<{
    data: BlogGenerationResult | null;
    error: string | null;
    tokensUsed: number;
    generationTimeMs: number;
}> {
    const startTime = Date.now();
    const apiKey = await getGroqApiKey();

    if (!apiKey) {
        return { data: null, error: 'Groq API key not configured', tokensUsed: 0, generationTimeMs: 0 };
    }

    const {
        topic,
        keywords = [],
        targetSite = 'stachbit.in',
        category = 'Technology',
        tone = 'professional',
        wordCount = 1200,
    } = options;

    const siteContext = targetSite === 'ai.stachbit.in'
        ? 'an AI-powered lead generation and business automation tool'
        : 'a professional web development and digital solutions agency';

    const prompt = `You are an expert SEO content writer specializing in the Indian market. Generate a comprehensive, SEO-optimized blog post.

TOPIC: ${topic}

TARGET WEBSITE: ${targetSite} (${siteContext})
TARGET AUDIENCE: Business owners, startups, and entrepreneurs in India
KEYWORDS TO INCLUDE: ${keywords.length > 0 ? keywords.join(', ') : 'Generate relevant keywords'}
CATEGORY: ${category}
TONE: ${tone}
WORD COUNT: ${wordCount}-${wordCount + 300} words

REQUIREMENTS:
1. Title: Catchy, includes main keyword, under 60 characters, optimized for Google India
2. Meta description: Compelling, 150-160 characters, includes CTA
3. Structure the content with:
   - Engaging introduction that addresses a pain point
   - 4-6 main sections with H2 headings (use ## in markdown)
   - Practical tips, statistics, and actionable advice
   - Examples relevant to Indian businesses
   - Strong conclusion with call-to-action
4. Use markdown formatting (## for headings, **bold**, bullet points)
5. Include India-specific statistics, pricing in INR where relevant
6. Natural keyword integration (no keyword stuffing)
7. Write in a ${tone} yet engaging tone
8. Add internal linking suggestions to other relevant topics

OUTPUT FORMAT (respond with valid JSON only, no markdown code blocks):
{
    "title": "SEO-optimized title under 60 chars",
    "slug": "url-friendly-slug",
    "excerpt": "2-3 sentence summary for preview cards",
    "content": "Full markdown content with ## headings and formatting",
    "meta_title": "SEO title | Stachbit",
    "meta_description": "150-160 char meta description with keywords",
    "meta_keywords": "comma, separated, keywords",
    "category": "${category}",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "read_time_minutes": estimated_reading_time_as_number
}`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert SEO content writer. Always respond with valid JSON only, no markdown code blocks or additional text.',
                    },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 4000,
                temperature: 0.7,
            }),
        });

        const generationTimeMs = Date.now() - startTime;

        if (!response.ok) {
            const error = await response.json();
            return {
                data: null,
                error: error.error?.message || 'Blog generation failed',
                tokensUsed: 0,
                generationTimeMs,
            };
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        const tokensUsed = result.usage?.total_tokens || 0;

        if (!content) {
            return { data: null, error: 'No content generated', tokensUsed, generationTimeMs };
        }

        // Parse the JSON response
        try {
            // Clean up the response - remove markdown code blocks if present
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            const blogData: BlogGenerationResult = JSON.parse(cleanContent);

            // Validate required fields
            if (!blogData.title || !blogData.content) {
                return { data: null, error: 'Invalid blog data: missing title or content', tokensUsed, generationTimeMs };
            }

            return { data: blogData, error: null, tokensUsed, generationTimeMs };
        } catch (parseError) {
            console.error('Failed to parse blog JSON:', parseError, content);
            return {
                data: null,
                error: 'Failed to parse generated content. Please try again.',
                tokensUsed,
                generationTimeMs,
            };
        }
    } catch (error) {
        return {
            data: null,
            error: `Generation failed: ${error}`,
            tokensUsed: 0,
            generationTimeMs: Date.now() - startTime,
        };
    }
}

// Get available Groq models
export const GROQ_MODELS = [
    { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B (Recommended)', description: 'Best quality for long-form content' },
    { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B', description: 'Faster, good for quick drafts' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Good balance of speed and quality' },
];
