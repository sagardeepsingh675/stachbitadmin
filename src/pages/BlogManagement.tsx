import { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Trash2,
    X,
    Edit,
    Eye,
    EyeOff,
    Image,
    Star,
    Calendar,
    Clock,
    BarChart3,
    ExternalLink,
    Search,
    Filter,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import {
    getBlogPosts,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    generateSlug,
    supabase,
} from '../lib/supabase';
import type { BlogPost } from '../lib/database.types';

const categories = [
    'Technology',
    'Web Development',
    'Mobile Apps',
    'SaaS',
    'E-commerce',
    'Design',
    'Business',
    'Tutorial',
];

export default function BlogManagement() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: '',
        author_name: 'Stachbit Team',
        category: '',
        tags: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        og_image: '',
        is_published: false,
        is_featured: false,
        read_time_minutes: 5,
    });

    useEffect(() => {
        loadPosts();
    }, [filterStatus]);

    // Auto-hide notifications
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    async function loadPosts() {
        setLoading(true);
        const { data, error } = await getBlogPosts({ status: filterStatus });
        if (error) {
            setNotification({ type: 'error', message: 'Failed to load posts: ' + error.message });
        }
        if (data) setPosts(data);
        setLoading(false);
    }

    const resetForm = () => {
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            featured_image: '',
            author_name: 'Stachbit Team',
            category: '',
            tags: '',
            meta_title: '',
            meta_description: '',
            meta_keywords: '',
            og_image: '',
            is_published: false,
            is_featured: false,
            read_time_minutes: 5,
        });
        setEditingPost(null);
    };

    const handleTitleChange = (title: string) => {
        setFormData({
            ...formData,
            title,
            slug: generateSlug(title),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const postData = {
            title: formData.title,
            slug: formData.slug,
            excerpt: formData.excerpt || undefined,
            content: formData.content,
            featured_image: formData.featured_image || undefined,
            author_name: formData.author_name || 'Stachbit Team',
            category: formData.category || undefined,
            tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
            meta_title: formData.meta_title || undefined,
            meta_description: formData.meta_description || undefined,
            meta_keywords: formData.meta_keywords || undefined,
            og_image: formData.og_image || formData.featured_image || undefined,
            is_published: formData.is_published,
            is_featured: formData.is_featured,
            read_time_minutes: formData.read_time_minutes,
            published_at: formData.is_published ? new Date().toISOString() : undefined,
        };

        let result;
        if (editingPost) {
            result = await updateBlogPost(editingPost.id, postData);
        } else {
            result = await createBlogPost(postData);
        }

        if (result.error) {
            setNotification({ type: 'error', message: result.error.message });
        } else {
            setNotification({ type: 'success', message: editingPost ? 'Post updated successfully!' : 'Post created successfully!' });
            resetForm();
            setShowForm(false);
            await loadPosts();
        }
    };

    const handleEdit = (post: BlogPost) => {
        setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || '',
            content: post.content,
            featured_image: post.featured_image || '',
            author_name: post.author_name || 'Stachbit Team',
            category: post.category || '',
            tags: post.tags?.join(', ') || '',
            meta_title: post.meta_title || '',
            meta_description: post.meta_description || '',
            meta_keywords: post.meta_keywords || '',
            og_image: post.og_image || '',
            is_published: post.is_published,
            is_featured: post.is_featured,
            read_time_minutes: post.read_time_minutes || 5,
        });
        setEditingPost(post);
        setShowForm(true);
    };

    const handleDelete = async (postId: string) => {
        if (!window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
            return;
        }

        setDeleting(postId);
        const { error } = await deleteBlogPost(postId);

        if (error) {
            setNotification({ type: 'error', message: 'Failed to delete: ' + error.message });
        } else {
            setNotification({ type: 'success', message: 'Post deleted successfully!' });
            await loadPosts();
        }
        setDeleting(null);
    };

    const handleTogglePublish = async (post: BlogPost) => {
        const newPublishState = !post.is_published;
        const { error } = await updateBlogPost(post.id, {
            is_published: newPublishState,
            published_at: newPublishState ? new Date().toISOString() : null,
        });

        if (error) {
            setNotification({ type: 'error', message: error.message });
        } else {
            setNotification({ type: 'success', message: newPublishState ? 'Post published!' : 'Post unpublished!' });
            await loadPosts();
        }
    };

    const handleToggleFeatured = async (post: BlogPost) => {
        const { error } = await updateBlogPost(post.id, { is_featured: !post.is_featured });
        if (error) {
            setNotification({ type: 'error', message: error.message });
        } else {
            await loadPosts();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'featured_image' | 'og_image') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `blog/${fileName}`;

        const { error } = await supabase.storage.from('public-assets').upload(filePath, file);

        if (!error) {
            const { data } = supabase.storage.from('public-assets').getPublicUrl(filePath);
            setFormData({ ...formData, [field]: data.publicUrl });
        } else {
            setNotification({ type: 'error', message: 'Upload failed: ' + error.message });
        }
        setUploading(false);
    };

    const filteredPosts = posts.filter(
        (post) =>
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (date: string | null) => {
        if (!date) return 'Not published';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in ${notification.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-red-500/20 border border-red-500/50 text-red-400'
                    }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
                    <p className="text-dark-400">Create and manage blog content for SEO</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                    className="btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Blog Post
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10 w-full"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-dark-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                        className="select"
                    >
                        <option value="all">All Posts</option>
                        <option value="published">Published</option>
                        <option value="draft">Drafts</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{posts.length}</p>
                            <p className="text-dark-400 text-sm">Total Posts</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Eye className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">
                                {posts.filter((p) => p.is_published).length}
                            </p>
                            <p className="text-dark-400 text-sm">Published</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <Star className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">
                                {posts.filter((p) => p.is_featured).length}
                            </p>
                            <p className="text-dark-400 text-sm">Featured</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">
                                {posts.reduce((acc, p) => acc + (p.view_count || 0), 0)}
                            </p>
                            <p className="text-dark-400 text-sm">Total Views</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="glass-card p-6 w-full max-w-4xl my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-dark-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Title *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => handleTitleChange(e.target.value)}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">URL Slug *</label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Excerpt</label>
                                    <textarea
                                        value={formData.excerpt}
                                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                        className="input resize-none"
                                        rows={2}
                                        placeholder="Brief summary of the post..."
                                    />
                                </div>
                                <div>
                                    <label className="label">Content *</label>
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="input resize-none font-mono text-sm"
                                        rows={10}
                                        placeholder="Write your blog content here... (Markdown supported)"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Media */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                                    Media
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Featured Image</label>
                                        <div className="space-y-2">
                                            {formData.featured_image && (
                                                <img
                                                    src={formData.featured_image}
                                                    alt="Featured"
                                                    className="w-full h-32 object-cover rounded-lg bg-dark-800"
                                                />
                                            )}
                                            <input
                                                type="url"
                                                value={formData.featured_image}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, featured_image: e.target.value })
                                                }
                                                className="input"
                                                placeholder="Image URL"
                                            />
                                            <label className="btn-secondary btn-sm cursor-pointer inline-flex items-center gap-2">
                                                <Image className="w-4 h-4" />
                                                {uploading ? 'Uploading...' : 'Upload'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'featured_image')}
                                                    className="hidden"
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Author Name</label>
                                        <input
                                            type="text"
                                            value={formData.author_name}
                                            onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Categories & Tags */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                                    Categories & Tags
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="select"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Tags (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="input"
                                            placeholder="react, nextjs, web development"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Read Time (minutes)</label>
                                    <input
                                        type="number"
                                        value={formData.read_time_minutes}
                                        onChange={(e) =>
                                            setFormData({ ...formData, read_time_minutes: parseInt(e.target.value) || 5 })
                                        }
                                        className="input w-32"
                                        min={1}
                                        max={60}
                                    />
                                </div>
                            </div>

                            {/* SEO Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                                    SEO Settings
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="label">Meta Title (max 60 chars)</label>
                                        <input
                                            type="text"
                                            value={formData.meta_title}
                                            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                            className="input"
                                            maxLength={70}
                                            placeholder="SEO title (leave empty to use post title)"
                                        />
                                        <p className="text-xs text-dark-500 mt-1">
                                            {formData.meta_title.length}/70 characters
                                        </p>
                                    </div>
                                    <div>
                                        <label className="label">Meta Description (max 160 chars)</label>
                                        <textarea
                                            value={formData.meta_description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, meta_description: e.target.value })
                                            }
                                            className="input resize-none"
                                            rows={2}
                                            maxLength={160}
                                            placeholder="SEO description (leave empty to use excerpt)"
                                        />
                                        <p className="text-xs text-dark-500 mt-1">
                                            {formData.meta_description.length}/160 characters
                                        </p>
                                    </div>
                                    <div>
                                        <label className="label">Meta Keywords</label>
                                        <input
                                            type="text"
                                            value={formData.meta_keywords}
                                            onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                                            className="input"
                                            placeholder="keyword1, keyword2, keyword3"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Open Graph Image URL</label>
                                        <input
                                            type="url"
                                            value={formData.og_image}
                                            onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                                            className="input"
                                            placeholder="Leave empty to use featured image"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Publishing Options */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                                    Publishing
                                </h3>
                                <div className="flex flex-wrap items-center gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_published}
                                            onChange={(e) =>
                                                setFormData({ ...formData, is_published: e.target.checked })
                                            }
                                            className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="text-dark-300 group-hover:text-white transition-colors">Publish immediately</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) =>
                                                setFormData({ ...formData, is_featured: e.target.checked })
                                            }
                                            className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-yellow-500 focus:ring-yellow-500"
                                        />
                                        <span className="text-dark-300 group-hover:text-white transition-colors">Feature this post</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-dark-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    {editingPost ? 'Save Changes' : 'Create Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Posts List */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card">
                            <div className="flex gap-4">
                                <div className="skeleton w-24 h-24 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-5 w-3/4 rounded" />
                                    <div className="skeleton h-4 w-full rounded" />
                                    <div className="skeleton h-4 w-1/2 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="card p-16 text-center bg-gradient-to-br from-dark-800/50 to-dark-900/50">
                    <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-primary-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No blog posts yet</h3>
                    <p className="text-dark-400 mb-8 max-w-md mx-auto">
                        Start creating content to improve your website's SEO and engage with your audience
                    </p>
                    <button onClick={() => setShowForm(true)} className="btn-primary text-lg px-8">
                        <Plus className="w-5 h-5" />
                        Create Your First Post
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredPosts.map((post) => (
                        <div
                            key={post.id}
                            className={`card group hover:border-primary-500/50 transition-all duration-300 ${!post.is_published ? 'opacity-70 border-dashed' : ''
                                } ${deleting === post.id ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="flex gap-4">
                                {/* Image */}
                                <div className="relative w-24 h-24 lg:w-32 lg:h-32 bg-dark-800 rounded-xl overflow-hidden flex-shrink-0">
                                    {post.featured_image ? (
                                        <img
                                            src={post.featured_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/10 to-accent-500/10">
                                            <BookOpen className="w-8 h-8 text-dark-600" />
                                        </div>
                                    )}
                                    {post.is_featured && (
                                        <div className="absolute top-1 left-1 p-1 rounded-md bg-yellow-500/90">
                                            <Star className="w-3 h-3 text-yellow-900" fill="currentColor" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-semibold text-white text-base lg:text-lg line-clamp-1 group-hover:text-primary-400 transition-colors">
                                            {post.title}
                                        </h3>
                                        <span
                                            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${post.is_published
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                }`}
                                        >
                                            {post.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </div>

                                    {post.excerpt && (
                                        <p className="text-dark-400 text-sm mb-2 line-clamp-2">{post.excerpt}</p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 text-xs text-dark-500 mt-auto">
                                        {post.category && (
                                            <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                                                {post.category}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(post.published_at || post.created_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {post.read_time_minutes}m
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {post.view_count || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Bar */}
                            <div className="flex items-center gap-1 mt-4 pt-4 border-t border-dark-700/50">
                                <button
                                    onClick={() => handleEdit(post)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleToggleFeatured(post)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${post.is_featured
                                            ? 'text-yellow-400 bg-yellow-500/10'
                                            : 'text-dark-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                                        }`}
                                >
                                    <Star className="w-4 h-4" fill={post.is_featured ? 'currentColor' : 'none'} />
                                    {post.is_featured ? 'Featured' : 'Feature'}
                                </button>
                                <button
                                    onClick={() => handleTogglePublish(post)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${post.is_published
                                            ? 'text-green-400 hover:text-orange-400 hover:bg-orange-500/10'
                                            : 'text-dark-400 hover:text-green-400 hover:bg-green-500/10'
                                        }`}
                                >
                                    {post.is_published ? (
                                        <>
                                            <EyeOff className="w-4 h-4" />
                                            Unpublish
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4" />
                                            Publish
                                        </>
                                    )}
                                </button>
                                {post.is_published && (
                                    <a
                                        href={`https://stachbit.in/blog/${post.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View
                                    </a>
                                )}
                                <div className="flex-1" />
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    disabled={deleting === post.id}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deleting === post.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
