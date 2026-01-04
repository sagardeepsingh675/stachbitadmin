import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
    UserProfile,
    Lead,
    LeadSearch,
    EmailTemplate,
    EmailCampaign,
    SmtpConfig,
    SubscriptionPlan,
    WhatsAppTemplate,
    BlogPost
} from './database.types';

// Supabase configuration - same as tootle/webmain
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing. Check your .env file.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Profile helper functions
export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data: data as UserProfile | null, error };
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    return { data: data as UserProfile | null, error };
};

// Subscription helper functions
export const getSubscriptionPlans = async () => {
    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });
    return { data: data as SubscriptionPlan[] | null, error };
};

// Admin helper functions
export const isUserAdmin = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
    return data?.role === 'admin';
};

export const getAllUsers = async (options?: { limit?: number; offset?: number }) => {
    let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    return { data: data as UserProfile[] | null, error, count };
};

export const updateUserAsAdmin = async (userId: string, updates: Partial<UserProfile>) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    return { data: data as UserProfile | null, error };
};

// Leads helper functions
export const getLeads = async (options?: {
    userId?: string;
    searchId?: string;
    status?: string;
    limit?: number;
    offset?: number;
}) => {
    let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (options?.userId) {
        query = query.eq('user_id', options.userId);
    }
    if (options?.searchId) {
        query = query.eq('search_id', options.searchId);
    }
    if (options?.status) {
        query = query.eq('status', options.status);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    return { data: data as Lead[] | null, error, count };
};

// Lead searches helper functions
export const getLeadSearches = async (options?: { limit?: number; offset?: number }) => {
    let query = supabase
        .from('lead_searches')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    return { data: data as LeadSearch[] | null, error, count };
};

// Email templates helper functions
export const getEmailTemplates = async (userId?: string) => {
    let query = supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    return { data: data as EmailTemplate[] | null, error };
};

export const createEmailTemplate = async (template: Partial<EmailTemplate> & { name: string; subject: string; body_html: string }) => {
    const { data, error } = await supabase
        .from('email_templates')
        .insert(template)
        .select()
        .single();
    return { data: data as EmailTemplate | null, error };
};

export const updateEmailTemplate = async (templateId: string, updates: Partial<EmailTemplate>) => {
    const { data, error } = await supabase
        .from('email_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', templateId)
        .select()
        .single();
    return { data: data as EmailTemplate | null, error };
};

export const deleteEmailTemplate = async (templateId: string) => {
    const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);
    return { error };
};

// SMTP config helper functions
export const getSmtpConfigs = async (userId?: string) => {
    let query = supabase
        .from('smtp_configs')
        .select('*')
        .order('created_at', { ascending: false });

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    return { data: data as SmtpConfig[] | null, error };
};

// Email campaigns helper functions
export const getEmailCampaigns = async (userId?: string) => {
    let query = supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    return { data: data as EmailCampaign[] | null, error };
};

// WhatsApp templates helper functions
export const getWhatsAppTemplates = async (userId?: string) => {
    let query = supabase
        .from('whatsapp_templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    return { data: data as WhatsAppTemplate[] | null, error };
};

// Site settings helper functions
export const getSiteSettings = async () => {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*');

    if (error) return { data: null, error };

    const settings: Record<string, { value: string; type: string; description: string; is_public: boolean }> = {};
    if (data) {
        data.forEach((setting: { key: string; value: string | null; type: string; description: string | null; is_public: boolean }) => {
            settings[setting.key] = {
                value: setting.value || '',
                type: setting.type,
                description: setting.description || '',
                is_public: setting.is_public
            };
        });
    }

    return { data: settings, error: null };
};

export const updateSiteSetting = async (key: string, value: string, updatedBy?: string) => {
    const { data, error } = await supabase
        .from('site_settings')
        .update({ value, updated_by: updatedBy, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
        .single();
    return { data, error };
};

// Website inquiries helper functions
export const getWebsiteInquiries = async (options?: { status?: string; limit?: number; offset?: number }) => {
    let query = supabase
        .from('website_inquiries')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (options?.status) {
        query = query.eq('status', options.status);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    return { data, error, count };
};

export const updateWebsiteInquiry = async (inquiryId: string, updates: { status?: string; admin_notes?: string }) => {
    const { data, error } = await supabase
        .from('website_inquiries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', inquiryId)
        .select()
        .single();
    return { data, error };
};

// Portfolio projects helper functions
export const getPortfolioProjects = async () => {
    const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*')
        .order('display_order', { ascending: true });
    return { data, error };
};

export const createPortfolioProject = async (project: {
    title: string;
    description?: string;
    service_type?: string;
    client_name?: string;
    image_url?: string;
    project_url?: string;
    technologies?: string[];
    is_featured?: boolean;
    is_active?: boolean;
    display_order?: number;
}) => {
    const { data, error } = await supabase
        .from('portfolio_projects')
        .insert(project)
        .select()
        .single();
    return { data, error };
};

export const updatePortfolioProject = async (projectId: string, updates: Record<string, unknown>) => {
    const { data, error } = await supabase
        .from('portfolio_projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();
    return { data, error };
};

export const deletePortfolioProject = async (projectId: string) => {
    const { error } = await supabase
        .from('portfolio_projects')
        .delete()
        .eq('id', projectId);
    return { error };
};

// Support tickets helper functions
export const getSupportTickets = async (options?: { status?: string; limit?: number; offset?: number }) => {
    let query = supabase
        .from('support_tickets')
        .select('*, user_profiles(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (options?.status) {
        query = query.eq('status', options.status);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    return { data, error, count };
};

export const getTicketResponses = async (ticketId: string) => {
    const { data, error } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
    return { data, error };
};

export const addTicketResponse = async (response: {
    ticket_id: string;
    user_id: string;
    message: string;
    is_admin: boolean;
}) => {
    const { data, error } = await supabase
        .from('ticket_responses')
        .insert(response)
        .select()
        .single();
    return { data, error };
};

export const updateTicketStatus = async (ticketId: string, status: string) => {
    const { data, error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();
    return { data, error };
};

// Coupons helper functions
export const getCoupons = async () => {
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const createCoupon = async (coupon: {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses?: number;
    valid_from?: string;
    valid_until?: string;
    is_active?: boolean;
}) => {
    const { data, error } = await supabase
        .from('coupons')
        .insert(coupon)
        .select()
        .single();
    return { data, error };
};

export const updateCoupon = async (couponId: string, updates: Record<string, unknown>) => {
    const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', couponId)
        .select()
        .single();
    return { data, error };
};

export const deleteCoupon = async (couponId: string) => {
    const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);
    return { error };
};

// Activity logs helper functions
export const getActivityLogs = async (options?: { limit?: number; offset?: number }) => {
    let query = supabase
        .from('activity_logs')
        .select('*, user_profiles(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    return { data, error, count };
};

// Blog posts helper functions
export const getBlogPosts = async (options?: { status?: 'all' | 'published' | 'draft'; limit?: number; offset?: number }) => {
    let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (options?.status === 'published') {
        query = query.eq('is_published', true);
    } else if (options?.status === 'draft') {
        query = query.eq('is_published', false);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    return { data: data as BlogPost[] | null, error, count };
};

export const getBlogPostById = async (postId: string) => {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();
    return { data: data as BlogPost | null, error };
};

export const createBlogPost = async (post: {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    featured_image?: string;
    author_name?: string;
    category?: string;
    tags?: string[];
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    is_published?: boolean;
    is_featured?: boolean;
    read_time_minutes?: number;
    published_at?: string;
}) => {
    const { data, error } = await supabase
        .from('blog_posts')
        .insert(post)
        .select()
        .single();
    return { data: data as BlogPost | null, error };
};

export const updateBlogPost = async (postId: string, updates: Partial<BlogPost>) => {
    const { data, error } = await supabase
        .from('blog_posts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select()
        .single();
    return { data: data as BlogPost | null, error };
};

export const deleteBlogPost = async (postId: string) => {
    const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);
    return { error };
};

export const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

// Blog analytics helper functions
export const getBlogAnalytics = async (blogId?: string) => {
    let query = supabase
        .from('blog_views')
        .select('*', { count: 'exact' });

    if (blogId) {
        query = query.eq('blog_id', blogId);
    }

    const { data, error, count } = await query;
    return { data, error, count };
};

export const getBlogViewsByDate = async (blogId: string, days: number = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('blog_views')
        .select('viewed_at')
        .eq('blog_id', blogId)
        .gte('viewed_at', startDate.toISOString())
        .order('viewed_at', { ascending: true });

    return { data, error };
};

// ===== API Keys Management =====
export interface ApiKey {
    id: string;
    key_name: string;
    key_value: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const getApiKeys = async () => {
    const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('key_name');
    return { data: data as ApiKey[] | null, error };
};

export const updateApiKey = async (keyName: string, keyValue: string) => {
    const { data, error } = await supabase
        .from('api_keys')
        .update({ key_value: keyValue, updated_at: new Date().toISOString() })
        .eq('key_name', keyName)
        .select()
        .single();
    return { data: data as ApiKey | null, error };
};

export const getApiKeyValue = async (keyName: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('key_name', keyName)
        .eq('is_active', true)
        .single();

    if (error || !data) return null;
    return data.key_value;
};

// ===== Auto Blog Topics =====
export interface AutoBlogTopic {
    id: string;
    topic: string;
    keywords: string[];
    target_site: string;
    category: string | null;
    priority: number;
    posts_generated: number;
    last_generated_at: string | null;
    is_active: boolean;
    created_at: string;
}

export const getAutoBlogTopics = async (activeOnly: boolean = true) => {
    let query = supabase
        .from('auto_blog_topics')
        .select('*')
        .order('priority', { ascending: true })
        .order('posts_generated', { ascending: true });

    if (activeOnly) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    return { data: data as AutoBlogTopic[] | null, error };
};

export const createAutoBlogTopic = async (topic: {
    topic: string;
    keywords?: string[];
    target_site?: string;
    category?: string;
    priority?: number;
}) => {
    const { data, error } = await supabase
        .from('auto_blog_topics')
        .insert(topic)
        .select()
        .single();
    return { data: data as AutoBlogTopic | null, error };
};

export const deleteAutoBlogTopic = async (topicId: string) => {
    const { error } = await supabase
        .from('auto_blog_topics')
        .delete()
        .eq('id', topicId);
    return { error };
};

// ===== Auto Blog Logs =====
export interface AutoBlogLog {
    id: string;
    blog_post_id: string | null;
    topic_id: string | null;
    custom_topic: string | null;
    generation_prompt: string | null;
    model_used: string;
    tokens_used: number;
    image_query: string | null;
    image_url: string | null;
    status: string;
    error_message: string | null;
    generation_time_ms: number;
    created_at: string;
}

export const createAutoBlogLog = async (log: Partial<AutoBlogLog>) => {
    const { data, error } = await supabase
        .from('auto_blog_logs')
        .insert(log)
        .select()
        .single();
    return { data: data as AutoBlogLog | null, error };
};

export const updateAutoBlogLog = async (logId: string, updates: Partial<AutoBlogLog>) => {
    const { data, error } = await supabase
        .from('auto_blog_logs')
        .update(updates)
        .eq('id', logId)
        .select()
        .single();
    return { data: data as AutoBlogLog | null, error };
};

export const getAutoBlogLogs = async (limit: number = 20) => {
    const { data, error } = await supabase
        .from('auto_blog_logs')
        .select('*, blog_posts(title, slug)')
        .order('created_at', { ascending: false })
        .limit(limit);
    return { data: data as (AutoBlogLog & { blog_posts: { title: string; slug: string } | null })[] | null, error };
};

// ===== Contact Settings =====
export interface ContactSetting {
    id: string;
    setting_key: string;
    setting_value: string | null;
    setting_label: string | null;
    setting_type: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const getContactSettings = async () => {
    const { data, error } = await supabase
        .from('site_contact_settings')
        .select('*')
        .order('display_order', { ascending: true });
    return { data: data as ContactSetting[] | null, error };
};

export const updateContactSetting = async (settingKey: string, settingValue: string) => {
    const { data, error } = await supabase
        .from('site_contact_settings')
        .update({ setting_value: settingValue, updated_at: new Date().toISOString() })
        .eq('setting_key', settingKey)
        .select()
        .single();
    return { data: data as ContactSetting | null, error };
};

export const getContactSettingByKey = async (key: string) => {
    const { data, error } = await supabase
        .from('site_contact_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .eq('is_active', true)
        .single();
    return { data: data?.setting_value || null, error };
};

// ===== Social Links =====
export interface SocialLink {
    id: string;
    platform: string;
    url: string | null;
    icon_name: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const getSocialLinks = async () => {
    const { data, error } = await supabase
        .from('site_social_links')
        .select('*')
        .order('display_order', { ascending: true });
    return { data: data as SocialLink[] | null, error };
};

export const updateSocialLink = async (platform: string, url: string) => {
    const { data, error } = await supabase
        .from('site_social_links')
        .update({ url, updated_at: new Date().toISOString() })
        .eq('platform', platform)
        .select()
        .single();
    return { data: data as SocialLink | null, error };
};

export default supabase;
