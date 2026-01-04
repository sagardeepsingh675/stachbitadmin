import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Globe, Palette, Image } from 'lucide-react';
import { getSiteSettings, updateSiteSetting, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SiteSetting {
    value: string;
    type: string;
    description: string;
    is_public: boolean;
}

type SettingsData = Record<string, SiteSetting>;

export default function Settings() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<SettingsData>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedKey, setSavedKey] = useState<string | null>(null);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        setLoading(true);
        const { data } = await getSiteSettings();
        if (data) setSettings(data);
        setLoading(false);
    }

    const handleSave = async (key: string, value: string) => {
        setSaving(true);
        await updateSiteSetting(key, value, user?.id);
        setSavedKey(key);
        setSaving(false);
        setTimeout(() => setSavedKey(null), 2000);
    };

    const handleImageUpload = async (key: string, file: File) => {
        setUploading(key);
        const fileExt = file.name.split('.').pop();
        const fileName = `${key}_${Date.now()}.${fileExt}`;
        const filePath = `site-assets/${fileName}`;

        const { error } = await supabase.storage
            .from('public-assets')
            .upload(filePath, file);

        if (!error) {
            const { data } = supabase.storage.from('public-assets').getPublicUrl(filePath);
            await handleSave(key, data.publicUrl);
            setSettings((prev) => ({
                ...prev,
                [key]: { ...prev[key], value: data.publicUrl },
            }));
        }
        setUploading(null);
    };

    const settingGroups = [
        {
            title: 'General',
            icon: Globe,
            keys: ['site_name', 'site_tagline', 'site_description', 'contact_email', 'contact_phone'],
        },
        {
            title: 'Branding',
            icon: Palette,
            keys: ['header_logo_url', 'favicon_url', 'primary_color', 'accent_color'],
        },
        {
            title: 'Social Media',
            icon: Globe,
            keys: ['twitter_url', 'linkedin_url', 'instagram_url', 'github_url'],
        },
        {
            title: 'SEO',
            icon: Globe,
            keys: ['meta_title', 'meta_description', 'og_image_url'],
        },
    ];

    const renderSettingInput = (key: string, setting: SiteSetting) => {
        const isImage = key.includes('logo') || key.includes('image') || key.includes('favicon');
        const isColor = key.includes('color');
        const isUrl = key.includes('url');
        const isTextArea = key.includes('description');

        if (isImage) {
            return (
                <div className="flex items-start gap-4">
                    {setting.value && (
                        <img
                            src={setting.value}
                            alt={key}
                            className="w-16 h-16 object-contain bg-dark-700 rounded-lg"
                        />
                    )}
                    <div className="flex-1">
                        <input
                            type="url"
                            value={setting.value}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    [key]: { ...setting, value: e.target.value },
                                }))
                            }
                            className="input mb-2"
                            placeholder="Image URL"
                        />
                        <div className="flex gap-2">
                            <label className="btn-secondary btn-sm cursor-pointer">
                                <Image className="w-4 h-4" />
                                {uploading === key ? 'Uploading...' : 'Upload'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(key, file);
                                    }}
                                    className="hidden"
                                    disabled={uploading === key}
                                />
                            </label>
                            <button
                                onClick={() => handleSave(key, setting.value)}
                                disabled={saving}
                                className="btn-primary btn-sm"
                            >
                                <Save className="w-4 h-4" />
                                {savedKey === key ? 'Saved!' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (isColor) {
            return (
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={setting.value || '#0ea5e9'}
                        onChange={(e) =>
                            setSettings((prev) => ({
                                ...prev,
                                [key]: { ...setting, value: e.target.value },
                            }))
                        }
                        className="w-12 h-12 rounded-lg border-2 border-dark-600 cursor-pointer"
                    />
                    <input
                        type="text"
                        value={setting.value}
                        onChange={(e) =>
                            setSettings((prev) => ({
                                ...prev,
                                [key]: { ...setting, value: e.target.value },
                            }))
                        }
                        className="input flex-1"
                        placeholder="#hex"
                    />
                    <button
                        onClick={() => handleSave(key, setting.value)}
                        disabled={saving}
                        className="btn-primary btn-sm"
                    >
                        <Save className="w-4 h-4" />
                        {savedKey === key ? 'Saved!' : 'Save'}
                    </button>
                </div>
            );
        }

        if (isTextArea) {
            return (
                <div className="space-y-2">
                    <textarea
                        value={setting.value}
                        onChange={(e) =>
                            setSettings((prev) => ({
                                ...prev,
                                [key]: { ...setting, value: e.target.value },
                            }))
                        }
                        className="input resize-none"
                        rows={3}
                        placeholder={setting.description || key}
                    />
                    <button
                        onClick={() => handleSave(key, setting.value)}
                        disabled={saving}
                        className="btn-primary btn-sm"
                    >
                        <Save className="w-4 h-4" />
                        {savedKey === key ? 'Saved!' : 'Save'}
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-3">
                <input
                    type={isUrl ? 'url' : 'text'}
                    value={setting.value}
                    onChange={(e) =>
                        setSettings((prev) => ({
                            ...prev,
                            [key]: { ...setting, value: e.target.value },
                        }))
                    }
                    className="input flex-1"
                    placeholder={setting.description || key}
                />
                <button
                    onClick={() => handleSave(key, setting.value)}
                    disabled={saving}
                    className="btn-primary btn-sm"
                >
                    <Save className="w-4 h-4" />
                    {savedKey === key ? 'Saved!' : 'Save'}
                </button>
            </div>
        );
    };

    const formatLabel = (key: string): string => {
        return key
            .replace(/_/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Site Settings</h1>
                    <p className="text-dark-400">Configure website and platform settings</p>
                </div>
                <button onClick={loadSettings} className="btn-secondary">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-6 w-32 mb-4 rounded" />
                            <div className="space-y-4">
                                <div className="skeleton h-10 w-full rounded" />
                                <div className="skeleton h-10 w-full rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {settingGroups.map((group) => {
                        const Icon = group.icon;
                        const groupSettings = group.keys.filter((key) => settings[key]);

                        if (groupSettings.length === 0) return null;

                        return (
                            <div key={group.title} className="card p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-white">{group.title}</h2>
                                </div>
                                <div className="space-y-6">
                                    {groupSettings.map((key) => {
                                        const setting = settings[key];
                                        if (!setting) return null;

                                        return (
                                            <div key={key}>
                                                <label className="label">{formatLabel(key)}</label>
                                                {setting.description && (
                                                    <p className="text-dark-500 text-xs mb-2">{setting.description}</p>
                                                )}
                                                {renderSettingInput(key, setting)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* All Other Settings */}
                    {Object.keys(settings).filter(
                        (key) => !settingGroups.some((group) => group.keys.includes(key))
                    ).length > 0 && (
                            <div className="card p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-dark-600 rounded-lg flex items-center justify-center">
                                        <SettingsIcon className="w-5 h-5 text-dark-300" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-white">Other Settings</h2>
                                </div>
                                <div className="space-y-6">
                                    {Object.entries(settings)
                                        .filter(([key]) => !settingGroups.some((group) => group.keys.includes(key)))
                                        .map(([key, setting]) => (
                                            <div key={key}>
                                                <label className="label">{formatLabel(key)}</label>
                                                {renderSettingInput(key, setting)}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}
