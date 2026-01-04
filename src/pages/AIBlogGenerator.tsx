import { useState, useEffect } from 'react';
import {
    Sparkles,
    Wand2,
    Image as ImageIcon,
    FileText,
    Check,
    X,
    AlertCircle,
    Loader2,
    Eye,
    Plus,
    Trash2,
    Settings,
    Zap,
    Target,
    Clock,
    BookOpen,
    Key,
    CheckCircle,
    TrendingUp,
} from 'lucide-react';
import {
    getAutoBlogTopics,
    createAutoBlogTopic,
    deleteAutoBlogTopic,
    createBlogPost,
    createAutoBlogLog,
    updateAutoBlogLog,
    getAutoBlogLogs,
    getApiKeys,
    updateApiKey,
    type AutoBlogTopic,
    type AutoBlogLog,
    type ApiKey,
} from '../lib/supabase';
import { generateBlogContent, testGroqConnection, researchMarketTopics, type BlogGenerationResult, type MarketResearchTopic } from '../lib/groq';
import { getRandomImage, testUnsplashConnection, generateImageQuery, type UnsplashImage } from '../lib/unsplash';

const categories = [
    'Technology',
    'Web Development',
    'Business',
    'E-commerce',
    'SEO',
    'AI Tools',
    'Marketing',
    'Tutorial',
];

export default function AIBlogGenerator() {
    const [topics, setTopics] = useState<AutoBlogTopic[]>([]);
    const [logs, setLogs] = useState<(AutoBlogLog & { blog_posts: { title: string; slug: string } | null })[]>([]);
    const [_apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [_loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showAddTopic, setShowAddTopic] = useState(false);

    const [selectedTopic, setSelectedTopic] = useState<AutoBlogTopic | null>(null);
    const [customTopic, setCustomTopic] = useState('');
    const [customKeywords, setCustomKeywords] = useState('');
    const [customCategory, setCustomCategory] = useState('Technology');
    const [targetSite, setTargetSite] = useState<'stachbit.in' | 'ai.stachbit.in' | 'both'>('stachbit.in');

    const [generatedBlog, setGeneratedBlog] = useState<BlogGenerationResult | null>(null);
    const [generatedImage, setGeneratedImage] = useState<UnsplashImage | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    const [groqKey, setGroqKey] = useState('');
    const [unsplashKey, setUnsplashKey] = useState('');
    const [testingGroq, setTestingGroq] = useState(false);
    const [testingUnsplash, setTestingUnsplash] = useState(false);
    const [groqStatus, setGroqStatus] = useState<'untested' | 'success' | 'error'>('untested');
    const [unsplashStatus, setUnsplashStatus] = useState<'untested' | 'success' | 'error'>('untested');

    const [newTopic, setNewTopic] = useState({ topic: '', keywords: '', category: 'Technology', target_site: 'stachbit.in' });

    // Market Research state
    const [researchedTopics, setResearchedTopics] = useState<MarketResearchTopic[]>([]);
    const [researching, setResearching] = useState(false);
    const [showResearch, setShowResearch] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    async function loadData() {
        setLoading(true);

        const [topicsRes, logsRes, keysRes] = await Promise.all([
            getAutoBlogTopics(),
            getAutoBlogLogs(10),
            getApiKeys(),
        ]);

        if (topicsRes.data) setTopics(topicsRes.data);
        if (logsRes.data) setLogs(logsRes.data);
        if (keysRes.data) {
            setApiKeys(keysRes.data);
            const groq = keysRes.data.find(k => k.key_name === 'groq_api_key');
            const unsplash = keysRes.data.find(k => k.key_name === 'unsplash_access_key');
            if (groq) setGroqKey(groq.key_value);
            if (unsplash) setUnsplashKey(unsplash.key_value);
        }

        setLoading(false);
    }

    async function handleSaveApiKeys() {
        let success = true;

        if (groqKey) {
            const { error } = await updateApiKey('groq_api_key', groqKey);
            if (error) success = false;
        }

        if (unsplashKey) {
            const { error } = await updateApiKey('unsplash_access_key', unsplashKey);
            if (error) success = false;
        }

        if (success) {
            setNotification({ type: 'success', message: 'API keys saved successfully!' });
        } else {
            setNotification({ type: 'error', message: 'Failed to save API keys' });
        }
    }

    async function handleTestGroq() {
        setTestingGroq(true);
        const result = await testGroqConnection();
        setGroqStatus(result.success ? 'success' : 'error');
        setNotification({ type: result.success ? 'success' : 'error', message: result.message });
        setTestingGroq(false);
    }

    async function handleTestUnsplash() {
        setTestingUnsplash(true);
        const result = await testUnsplashConnection();
        setUnsplashStatus(result.success ? 'success' : 'error');
        setNotification({ type: result.success ? 'success' : 'error', message: result.message });
        setTestingUnsplash(false);
    }

    async function handleGenerate() {
        const topic = selectedTopic?.topic || customTopic;
        if (!topic) {
            setNotification({ type: 'error', message: 'Please select or enter a topic' });
            return;
        }

        setGenerating(true);
        setGeneratedBlog(null);
        setGeneratedImage(null);

        // Create log entry
        const { data: logEntry } = await createAutoBlogLog({
            topic_id: selectedTopic?.id || undefined,
            custom_topic: customTopic || undefined,
            status: 'generating',
        });

        try {
            // Generate blog content
            setNotification({ type: 'info', message: 'Generating blog content with AI...' });

            const keywords = selectedTopic?.keywords || (customKeywords ? customKeywords.split(',').map(k => k.trim()) : []);
            const category = selectedTopic?.category || customCategory;
            const site = selectedTopic?.target_site as typeof targetSite || targetSite;

            const { data: blogData, error: blogError, tokensUsed, generationTimeMs } = await generateBlogContent({
                topic,
                keywords,
                targetSite: site,
                category,
            });

            if (blogError || !blogData) {
                throw new Error(blogError || 'Failed to generate blog content');
            }

            setGeneratedBlog(blogData);

            // Fetch image from Unsplash
            setNotification({ type: 'info', message: 'Fetching relevant image...' });
            const imageQuery = generateImageQuery(topic, category || undefined);
            const { data: imageData } = await getRandomImage(imageQuery);

            if (imageData) {
                setGeneratedImage(imageData);
            }

            // Update log
            if (logEntry) {
                await updateAutoBlogLog(logEntry.id, {
                    tokens_used: tokensUsed,
                    generation_time_ms: generationTimeMs,
                    image_query: imageQuery,
                    image_url: imageData?.url,
                    status: 'success',
                });
            }

            setShowPreview(true);
            setNotification({ type: 'success', message: `Blog generated in ${(generationTimeMs / 1000).toFixed(1)}s!` });
        } catch (error: any) {
            if (logEntry) {
                await updateAutoBlogLog(logEntry.id, {
                    status: 'failed',
                    error_message: error.message,
                });
            }
            setNotification({ type: 'error', message: error.message });
        }

        setGenerating(false);
        await loadData();
    }

    async function handlePublish(asDraft: boolean = false) {
        if (!generatedBlog) return;

        const { error } = await createBlogPost({
            title: generatedBlog.title,
            slug: generatedBlog.slug,
            excerpt: generatedBlog.excerpt,
            content: generatedBlog.content,
            featured_image: generatedImage?.url || undefined,
            author_name: 'Stachbit Team',
            category: generatedBlog.category,
            tags: generatedBlog.tags,
            meta_title: generatedBlog.meta_title,
            meta_description: generatedBlog.meta_description,
            meta_keywords: generatedBlog.meta_keywords,
            is_published: !asDraft,
            is_featured: false,
            read_time_minutes: generatedBlog.read_time_minutes,
            published_at: asDraft ? undefined : new Date().toISOString(),
        });

        if (error) {
            setNotification({ type: 'error', message: error.message });
        } else {
            setNotification({ type: 'success', message: asDraft ? 'Blog saved as draft!' : 'Blog published successfully!' });
            setShowPreview(false);
            setGeneratedBlog(null);
            setGeneratedImage(null);
            setCustomTopic('');
            setSelectedTopic(null);
            await loadData();
        }
    }

    async function handleAddTopic() {
        if (!newTopic.topic) return;

        const { error } = await createAutoBlogTopic({
            topic: newTopic.topic,
            keywords: newTopic.keywords ? newTopic.keywords.split(',').map(k => k.trim()) : [],
            category: newTopic.category,
            target_site: newTopic.target_site,
        });

        if (error) {
            setNotification({ type: 'error', message: error.message });
        } else {
            setNotification({ type: 'success', message: 'Topic added successfully!' });
            setNewTopic({ topic: '', keywords: '', category: 'Technology', target_site: 'stachbit.in' });
            setShowAddTopic(false);
            await loadData();
        }
    }

    async function handleDeleteTopic(topicId: string) {
        if (!confirm('Delete this topic?')) return;
        await deleteAutoBlogTopic(topicId);
        await loadData();
    }

    async function handleResearchMarket() {
        setResearching(true);
        setShowResearch(true);
        setNotification({ type: 'info', message: 'Researching market trends...' });

        const { data, error } = await researchMarketTopics({
            targetSite: targetSite,
            count: 5,
        });

        if (error || !data) {
            setNotification({ type: 'error', message: error || 'Research failed' });
        } else {
            setResearchedTopics(data);
            setNotification({ type: 'success', message: `Found ${data.length} trending topic ideas!` });
        }

        setResearching(false);
    }

    async function handleAddResearchedTopic(topic: MarketResearchTopic) {
        const { error } = await createAutoBlogTopic({
            topic: topic.topic,
            keywords: topic.keywords,
            category: topic.category,
            target_site: targetSite,
        });

        if (error) {
            setNotification({ type: 'error', message: error.message });
        } else {
            setNotification({ type: 'success', message: 'Topic added to your list!' });
            // Remove from researched topics
            setResearchedTopics(prev => prev.filter(t => t.topic !== topic.topic));
            await loadData();
        }
    }

    const hasApiKeys = groqKey && unsplashKey;

    return (
        <div className="space-y-6">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in ${notification.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : notification.type === 'error'
                        ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                        : 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                        notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                            <Loader2 className="w-5 h-5 animate-spin" />}
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">AI Blog Generator</h1>
                            <p className="text-dark-400">Generate SEO-optimized blogs automatically</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="btn-secondary"
                >
                    <Settings className="w-5 h-5" />
                    API Settings
                </button>
            </div>

            {/* API Settings Panel */}
            {showSettings && (
                <div className="card bg-gradient-to-br from-dark-800/50 to-dark-900/50 border-primary-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Key className="w-5 h-5 text-primary-400" />
                            API Configuration
                        </h3>
                        <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-dark-700 rounded">
                            <X className="w-4 h-4 text-dark-400" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="label">Groq API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={groqKey}
                                    onChange={(e) => setGroqKey(e.target.value)}
                                    className="input flex-1"
                                    placeholder="gsk_..."
                                />
                                <button
                                    onClick={handleTestGroq}
                                    disabled={testingGroq || !groqKey}
                                    className={`btn-secondary px-3 ${groqStatus === 'success' ? 'border-green-500 text-green-400' :
                                        groqStatus === 'error' ? 'border-red-500 text-red-400' : ''
                                        }`}
                                >
                                    {testingGroq ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                        groqStatus === 'success' ? <Check className="w-4 h-4" /> :
                                            groqStatus === 'error' ? <X className="w-4 h-4" /> :
                                                <Zap className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-dark-500">Get your key from console.groq.com</p>
                        </div>

                        <div className="space-y-2">
                            <label className="label">Unsplash Access Key</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={unsplashKey}
                                    onChange={(e) => setUnsplashKey(e.target.value)}
                                    className="input flex-1"
                                    placeholder="Access key..."
                                />
                                <button
                                    onClick={handleTestUnsplash}
                                    disabled={testingUnsplash || !unsplashKey}
                                    className={`btn-secondary px-3 ${unsplashStatus === 'success' ? 'border-green-500 text-green-400' :
                                        unsplashStatus === 'error' ? 'border-red-500 text-red-400' : ''
                                        }`}
                                >
                                    {testingUnsplash ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                        unsplashStatus === 'success' ? <Check className="w-4 h-4" /> :
                                            unsplashStatus === 'error' ? <X className="w-4 h-4" /> :
                                                <ImageIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-dark-500">Get your key from unsplash.com/developers</p>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dark-700">
                        <button onClick={handleSaveApiKeys} className="btn-primary">
                            Save API Keys
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!hasApiKeys && !showSettings ? (
                <div className="card p-12 text-center">
                    <Key className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Configure API Keys First</h3>
                    <p className="text-dark-400 mb-6">You need to add your Groq and Unsplash API keys to start generating blogs.</p>
                    <button onClick={() => setShowSettings(true)} className="btn-primary">
                        <Settings className="w-5 h-5" />
                        Open Settings
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Topic Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Generate */}
                        <div className="card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-purple-400" />
                                Generate Blog
                            </h3>

                            <div className="space-y-4">
                                {/* Custom Topic Input */}
                                <div>
                                    <label className="label">Enter Topic or Select Below</label>
                                    <input
                                        type="text"
                                        value={customTopic}
                                        onChange={(e) => {
                                            setCustomTopic(e.target.value);
                                            setSelectedTopic(null);
                                        }}
                                        className="input"
                                        placeholder="How to improve website loading speed in India..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Keywords (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={customKeywords}
                                            onChange={(e) => setCustomKeywords(e.target.value)}
                                            className="input"
                                            placeholder="react, web dev..."
                                            disabled={!!selectedTopic}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Category</label>
                                        <select
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            className="select"
                                            disabled={!!selectedTopic}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Target Site</label>
                                        <select
                                            value={targetSite}
                                            onChange={(e) => setTargetSite(e.target.value as typeof targetSite)}
                                            className="select"
                                            disabled={!!selectedTopic}
                                        >
                                            <option value="stachbit.in">stachbit.in</option>
                                            <option value="ai.stachbit.in">ai.stachbit.in</option>
                                            <option value="both">Both</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || (!customTopic && !selectedTopic)}
                                    className="btn-primary w-full text-lg py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Generate Blog with AI
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Saved Topics */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary-400" />
                                    SEO Topics ({topics.length})
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleResearchMarket}
                                        disabled={researching}
                                        className="btn-secondary btn-sm bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/50"
                                    >
                                        {researching ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                                        {researching ? 'Researching...' : 'Research Market'}
                                    </button>
                                    <button onClick={() => setShowAddTopic(true)} className="btn-secondary btn-sm">
                                        <Plus className="w-4 h-4" />
                                        Add Topic
                                    </button>
                                </div>
                            </div>

                            {showAddTopic && (
                                <div className="mb-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={newTopic.topic}
                                            onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })}
                                            className="input"
                                            placeholder="Topic title..."
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={newTopic.keywords}
                                                onChange={(e) => setNewTopic({ ...newTopic, keywords: e.target.value })}
                                                className="input"
                                                placeholder="Keywords..."
                                            />
                                            <select
                                                value={newTopic.target_site}
                                                onChange={(e) => setNewTopic({ ...newTopic, target_site: e.target.value })}
                                                className="select"
                                            >
                                                <option value="stachbit.in">stachbit.in</option>
                                                <option value="ai.stachbit.in">ai.stachbit.in</option>
                                                <option value="both">Both</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleAddTopic} className="btn-primary btn-sm">
                                                <Check className="w-4 h-4" />
                                                Add
                                            </button>
                                            <button onClick={() => setShowAddTopic(false)} className="btn-secondary btn-sm">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Market Research Results */}
                            {showResearch && researchedTopics.length > 0 && (
                                <div className="mb-4 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-white flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-blue-400" />
                                            Market Research Suggestions
                                        </h4>
                                        <button
                                            onClick={() => setShowResearch(false)}
                                            className="p-1 hover:bg-dark-700 rounded"
                                        >
                                            <X className="w-4 h-4 text-dark-400" />
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {researchedTopics.map((topic, idx) => (
                                            <div key={idx} className="bg-dark-800/50 rounded-lg p-3">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <p className="text-white text-sm font-medium">{topic.topic}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                                            Score: {topic.trend_score}/10
                                                        </span>
                                                        <button
                                                            onClick={() => handleAddResearchedTopic(topic)}
                                                            className="p-1 bg-primary-500/20 hover:bg-primary-500/30 rounded text-primary-400"
                                                            title="Add to topics"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-dark-400 text-xs mb-2">{topic.rationale}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="text-xs badge">{topic.category}</span>
                                                    {topic.keywords.slice(0, 4).map((kw, i) => (
                                                        <span key={i} className="text-xs px-1.5 py-0.5 bg-dark-700 rounded text-dark-400">{kw}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {topics.map((topic) => (
                                    <div
                                        key={topic.id}
                                        onClick={() => {
                                            setSelectedTopic(selectedTopic?.id === topic.id ? null : topic);
                                            setCustomTopic('');
                                        }}
                                        className={`p-3 rounded-xl cursor-pointer transition-all ${selectedTopic?.id === topic.id
                                            ? 'bg-primary-500/20 border border-primary-500/50'
                                            : 'bg-dark-800/50 hover:bg-dark-700/50 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white text-sm line-clamp-2">{topic.topic}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
                                                        {topic.target_site}
                                                    </span>
                                                    {topic.category && (
                                                        <span className="text-xs text-dark-500">{topic.category}</span>
                                                    )}
                                                    <span className="text-xs text-dark-500">
                                                        {topic.posts_generated} posts
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTopic(topic.id);
                                                }}
                                                className="p-1 hover:bg-red-500/20 rounded text-dark-400 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {topics.length === 0 && (
                                    <p className="text-center text-dark-500 py-8">No topics yet. Add some SEO topics to get started.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Generation History */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-400" />
                            Recent Generations
                        </h3>

                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div key={log.id} className="p-3 bg-dark-800/50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-2 h-2 rounded-full ${log.status === 'success' || log.status === 'published' ? 'bg-green-500' :
                                            log.status === 'failed' ? 'bg-red-500' :
                                                'bg-yellow-500'
                                            }`} />
                                        <span className="text-sm font-medium text-white truncate">
                                            {log.blog_posts?.title || log.custom_topic || 'Untitled'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-dark-500">
                                        <span>{log.tokens_used} tokens</span>
                                        <span>{log.generation_time_ms ? `${(log.generation_time_ms / 1000).toFixed(1)}s` : '-'}</span>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <p className="text-center text-dark-500 py-8">No generations yet</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && generatedBlog && (
                <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="glass-card p-6 w-full max-w-4xl my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary-400" />
                                Preview Generated Blog
                            </h2>
                            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-dark-700 rounded-lg">
                                <X className="w-5 h-5 text-dark-400" />
                            </button>
                        </div>

                        {/* Featured Image */}
                        {generatedImage && (
                            <div className="mb-6">
                                <img
                                    src={generatedImage.url}
                                    alt={generatedImage.altText}
                                    className="w-full h-64 object-cover rounded-xl"
                                />
                                <p className="text-xs text-dark-500 mt-2">
                                    Photo by <a href={generatedImage.photographerUrl} target="_blank" rel="noopener" className="text-primary-400">{generatedImage.photographer}</a> on Unsplash
                                </p>
                            </div>
                        )}

                        {/* Meta Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-dark-800/50 rounded-xl">
                            <div>
                                <p className="text-xs text-dark-400 mb-1">Title</p>
                                <p className="text-white font-medium">{generatedBlog.title}</p>
                            </div>
                            <div>
                                <p className="text-xs text-dark-400 mb-1">Slug</p>
                                <p className="text-dark-300">/{generatedBlog.slug}</p>
                            </div>
                            <div>
                                <p className="text-xs text-dark-400 mb-1">Meta Title</p>
                                <p className="text-dark-300 text-sm">{generatedBlog.meta_title}</p>
                            </div>
                            <div>
                                <p className="text-xs text-dark-400 mb-1">Meta Description</p>
                                <p className="text-dark-300 text-sm">{generatedBlog.meta_description}</p>
                            </div>
                            <div>
                                <p className="text-xs text-dark-400 mb-1">Category</p>
                                <span className="badge-primary">{generatedBlog.category}</span>
                            </div>
                            <div>
                                <p className="text-xs text-dark-400 mb-1">Tags</p>
                                <div className="flex flex-wrap gap-1">
                                    {generatedBlog.tags.slice(0, 5).map((tag) => (
                                        <span key={tag} className="badge text-xs">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div className="mb-6">
                            <p className="text-xs text-dark-400 mb-1">Excerpt</p>
                            <p className="text-dark-300 italic">{generatedBlog.excerpt}</p>
                        </div>

                        {/* Content Preview */}
                        <div className="mb-6">
                            <p className="text-xs text-dark-400 mb-2">Content Preview</p>
                            <div className="prose prose-invert max-w-none max-h-[300px] overflow-y-auto p-4 bg-dark-800/50 rounded-xl">
                                <pre className="whitespace-pre-wrap text-sm text-dark-300 font-sans">{generatedBlog.content.substring(0, 2000)}...</pre>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-dark-700">
                            <button onClick={() => handlePublish(true)} className="btn-secondary flex-1">
                                <FileText className="w-5 h-5" />
                                Save as Draft
                            </button>
                            <button onClick={() => handlePublish(false)} className="btn-primary flex-1 bg-gradient-to-r from-green-500 to-emerald-500">
                                <BookOpen className="w-5 h-5" />
                                Publish Now
                            </button>
                            <button onClick={() => setShowPreview(false)} className="btn-secondary">
                                <X className="w-5 h-5" />
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
