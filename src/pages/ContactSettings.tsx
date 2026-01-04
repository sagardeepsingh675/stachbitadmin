import { useState, useEffect } from 'react';
import {
    Phone,
    Mail,
    MapPin,
    Clock,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    MessageSquare,
    Globe,
    Twitter,
    Facebook,
    Instagram,
    Linkedin,
    Youtube,
    Github,
} from 'lucide-react';
import {
    getContactSettings,
    updateContactSetting,
    getSocialLinks,
    updateSocialLink,
    type ContactSetting,
    type SocialLink,
} from '../lib/supabase';

const contactIcons: Record<string, React.ReactNode> = {
    contact_email: <Mail className="w-5 h-5" />,
    contact_phone: <Phone className="w-5 h-5" />,
    contact_location: <MapPin className="w-5 h-5" />,
    contact_address: <MapPin className="w-5 h-5" />,
    response_time: <Clock className="w-5 h-5" />,
    whatsapp_number: <MessageSquare className="w-5 h-5" />,
    business_hours: <Clock className="w-5 h-5" />,
    support_email: <Mail className="w-5 h-5" />,
};

const socialIcons: Record<string, React.ReactNode> = {
    twitter: <Twitter className="w-5 h-5" />,
    facebook: <Facebook className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    linkedin: <Linkedin className="w-5 h-5" />,
    youtube: <Youtube className="w-5 h-5" />,
    github: <Github className="w-5 h-5" />,
};

export default function ContactSettings() {
    const [contactSettings, setContactSettings] = useState<ContactSetting[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    async function loadData() {
        setLoading(true);
        const [contactRes, socialRes] = await Promise.all([
            getContactSettings(),
            getSocialLinks(),
        ]);

        if (contactRes.data) {
            setContactSettings(contactRes.data);
            const values: Record<string, string> = {};
            contactRes.data.forEach(s => {
                values[s.setting_key] = s.setting_value || '';
            });
            setEditedValues(prev => ({ ...prev, ...values }));
        }

        if (socialRes.data) {
            setSocialLinks(socialRes.data);
            const values: Record<string, string> = {};
            socialRes.data.forEach(s => {
                values[`social_${s.platform}`] = s.url || '';
            });
            setEditedValues(prev => ({ ...prev, ...values }));
        }

        setLoading(false);
    }

    async function handleSaveContact(settingKey: string) {
        const value = editedValues[settingKey];
        if (value === undefined) return;

        setSaving(settingKey);
        const { error } = await updateContactSetting(settingKey, value);

        if (error) {
            setNotification({ type: 'error', message: `Failed to save: ${error.message}` });
        } else {
            setNotification({ type: 'success', message: 'Setting saved successfully!' });
            await loadData();
        }
        setSaving(null);
    }

    async function handleSaveSocial(platform: string) {
        const value = editedValues[`social_${platform}`];
        if (value === undefined) return;

        setSaving(`social_${platform}`);
        const { error } = await updateSocialLink(platform, value);

        if (error) {
            setNotification({ type: 'error', message: `Failed to save: ${error.message}` });
        } else {
            setNotification({ type: 'success', message: 'Social link saved successfully!' });
            await loadData();
        }
        setSaving(null);
    }

    async function handleSaveAll() {
        setSaving('all');
        let hasError = false;

        // Save all contact settings
        for (const setting of contactSettings) {
            const value = editedValues[setting.setting_key];
            if (value !== undefined && value !== setting.setting_value) {
                const { error } = await updateContactSetting(setting.setting_key, value);
                if (error) hasError = true;
            }
        }

        // Save all social links
        for (const link of socialLinks) {
            const value = editedValues[`social_${link.platform}`];
            if (value !== undefined && value !== link.url) {
                const { error } = await updateSocialLink(link.platform, value);
                if (error) hasError = true;
            }
        }

        if (hasError) {
            setNotification({ type: 'error', message: 'Some settings failed to save' });
        } else {
            setNotification({ type: 'success', message: 'All settings saved successfully!' });
        }

        await loadData();
        setSaving(null);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${notification.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-red-500/20 border border-red-500/50 text-red-400'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Contact Settings</h1>
                            <p className="text-dark-400">Manage contact information displayed on the website</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={saving === 'all'}
                    className="btn-primary"
                >
                    {saving === 'all' ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save All Changes
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary-400" />
                        Contact Information
                    </h3>

                    <div className="space-y-4">
                        {contactSettings.map((setting) => (
                            <div key={setting.id} className="space-y-2">
                                <label className="label flex items-center gap-2">
                                    {contactIcons[setting.setting_key] || <Globe className="w-4 h-4" />}
                                    {setting.setting_label || setting.setting_key}
                                </label>
                                <div className="flex gap-2">
                                    {setting.setting_type === 'textarea' ? (
                                        <textarea
                                            value={editedValues[setting.setting_key] || ''}
                                            onChange={(e) => setEditedValues({ ...editedValues, [setting.setting_key]: e.target.value })}
                                            className="input flex-1 min-h-[80px]"
                                            placeholder={`Enter ${setting.setting_label?.toLowerCase()}`}
                                        />
                                    ) : (
                                        <input
                                            type={setting.setting_type === 'email' ? 'email' : setting.setting_type === 'phone' ? 'tel' : 'text'}
                                            value={editedValues[setting.setting_key] || ''}
                                            onChange={(e) => setEditedValues({ ...editedValues, [setting.setting_key]: e.target.value })}
                                            className="input flex-1"
                                            placeholder={`Enter ${setting.setting_label?.toLowerCase()}`}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleSaveContact(setting.setting_key)}
                                        disabled={saving === setting.setting_key}
                                        className="btn-secondary px-3"
                                    >
                                        {saving === setting.setting_key ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Social Media Links */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary-400" />
                        Social Media Links
                    </h3>

                    <div className="space-y-4">
                        {socialLinks.map((link) => (
                            <div key={link.id} className="space-y-2">
                                <label className="label flex items-center gap-2 capitalize">
                                    {socialIcons[link.platform] || <Globe className="w-4 h-4" />}
                                    {link.platform}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={editedValues[`social_${link.platform}`] || ''}
                                        onChange={(e) => setEditedValues({ ...editedValues, [`social_${link.platform}`]: e.target.value })}
                                        className="input flex-1"
                                        placeholder={`https://${link.platform}.com/...`}
                                    />
                                    <button
                                        onClick={() => handleSaveSocial(link.platform)}
                                        disabled={saving === `social_${link.platform}`}
                                        className="btn-secondary px-3"
                                    >
                                        {saving === `social_${link.platform}` ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Preview Card */}
            <div className="card bg-gradient-to-br from-dark-800/50 to-dark-900/50 border-primary-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary-400" />
                    Preview (How it appears on website)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Footer Preview */}
                    <div className="p-4 bg-dark-900 rounded-xl">
                        <p className="text-xs text-dark-500 mb-3">Footer Contact Section</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-dark-300">
                                <Mail className="w-4 h-4 text-primary-400" />
                                <span>{editedValues['contact_email'] || 'hello@stachbit.in'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-dark-300">
                                <Phone className="w-4 h-4 text-primary-400" />
                                <span>{editedValues['contact_phone'] || '+91 98765 43210'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-dark-300">
                                <MapPin className="w-4 h-4 text-primary-400" />
                                <span>{editedValues['contact_location'] || 'India'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Page Preview */}
                    <div className="p-4 bg-dark-900 rounded-xl">
                        <p className="text-xs text-dark-500 mb-3">Contact Page Section</p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-500/10 rounded-lg">
                                    <Mail className="w-4 h-4 text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-dark-400">Email</p>
                                    <p className="text-white">{editedValues['contact_email'] || 'hello@stachbit.in'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-500/10 rounded-lg">
                                    <Clock className="w-4 h-4 text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-dark-400">Response Time</p>
                                    <p className="text-white">{editedValues['response_time'] || 'Within 24 hours'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
