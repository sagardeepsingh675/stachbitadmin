import { useState, useEffect } from 'react';
import {
    Mail,
    Send,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    Plus,
    X,
    TestTube,
    ExternalLink,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailConfig {
    id?: string;
    from_email: string;
    from_name: string;
    notification_emails: string[];
    is_active: boolean;
}

export default function SmtpSettings() {
    const [config, setConfig] = useState<EmailConfig>({
        from_email: 'no-reply@notifications.stachbit.in',
        from_name: 'Stachbit',
        notification_emails: [],
        is_active: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [newEmail, setNewEmail] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    async function loadSettings() {
        setLoading(true);
        const { data, error } = await supabase
            .from('smtp_settings')
            .select('*')
            .single();

        if (data && !error) {
            setConfig({
                id: data.id,
                from_email: data.from_email || 'no-reply@notifications.stachbit.in',
                from_name: data.from_name || 'Stachbit',
                notification_emails: data.notification_emails || [],
                is_active: data.is_active ?? true,
            });
        }
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);

        try {
            if (config.id) {
                const { error } = await supabase
                    .from('smtp_settings')
                    .update({
                        from_email: config.from_email,
                        from_name: config.from_name,
                        notification_emails: config.notification_emails,
                        is_active: config.is_active,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', config.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('smtp_settings')
                    .insert({
                        from_email: config.from_email,
                        from_name: config.from_name,
                        notification_emails: config.notification_emails,
                        is_active: config.is_active,
                        smtp_host: 'resend.com',
                        smtp_port: 443,
                        smtp_secure: true,
                        smtp_user: 'resend',
                        smtp_password: 'api_key',
                    });

                if (error) throw error;
            }

            setNotification({ type: 'success', message: 'Email settings saved successfully!' });
            await loadSettings();
        } catch (err) {
            console.error('Save error:', err);
            setNotification({ type: 'error', message: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    }

    async function handleTestEmail() {
        setTesting(true);

        try {
            const { error, data } = await supabase.functions.invoke('send-contact-notification', {
                body: {
                    test: true,
                    name: 'Test User',
                    email: 'test@example.com',
                    subject: 'Test Email',
                    message: 'This is a test email from Stachbit Admin Panel.\n\nIf you received this, email notifications are working correctly!',
                    source: 'Admin Panel Test',
                },
            });

            if (error) throw error;

            if (data?.error) {
                throw new Error(data.error);
            }

            setNotification({ type: 'success', message: 'Test email sent! Check your inbox.' });
        } catch (err: unknown) {
            console.error('Test email error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setNotification({
                type: 'error',
                message: `Failed to send: ${errorMessage}`
            });
        } finally {
            setTesting(false);
        }
    }

    function addEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (newEmail && emailRegex.test(newEmail) && !config.notification_emails.includes(newEmail)) {
            setConfig({
                ...config,
                notification_emails: [...config.notification_emails, newEmail],
            });
            setNewEmail('');
        } else if (newEmail && !emailRegex.test(newEmail)) {
            setNotification({ type: 'error', message: 'Please enter a valid email address' });
        }
    }

    function removeEmail(email: string) {
        setConfig({
            ...config,
            notification_emails: config.notification_emails.filter((e) => e !== email),
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Email Notifications</h1>
                    <p className="text-dark-400 mt-1">
                        Configure email notifications for contact form submissions
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleTestEmail}
                        disabled={testing || !config.id || config.notification_emails.length === 0}
                        className="btn-secondary"
                    >
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                        Send Test Email
                    </button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Settings
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${notification.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-red-500/20 border border-red-500/50 text-red-400'
                    }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {notification.message}
                </div>
            )}

            {/* Info Banner */}
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-dark-200">
                        Emails are sent via <strong className="text-white">Resend.com</strong> using the domain{' '}
                        <code className="bg-dark-800 px-2 py-0.5 rounded text-primary-400">notifications.stachbit.in</code>
                    </p>
                    <a
                        href="https://resend.com/domains"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 text-sm inline-flex items-center gap-1 mt-2"
                    >
                        Manage domain in Resend <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Sender Info */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Send className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Sender Info</h2>
                            <p className="text-dark-500 text-sm">From address for notifications</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="label">From Email</label>
                            <input
                                type="email"
                                value={config.from_email}
                                onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                                className="input"
                                placeholder="no-reply@notifications.stachbit.in"
                            />
                            <p className="text-dark-500 text-xs mt-1">
                                Must be from your verified domain in Resend
                            </p>
                        </div>

                        <div>
                            <label className="label">From Name</label>
                            <input
                                type="text"
                                value={config.from_name}
                                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                                className="input"
                                placeholder="Stachbit"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={config.is_active}
                                onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                                className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
                            />
                            <label htmlFor="is_active" className="text-dark-300">
                                Enable email notifications
                            </label>
                        </div>
                    </div>
                </div>

                {/* Notification Recipients */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Notification Recipients</h2>
                            <p className="text-dark-500 text-sm">Who receives contact form emails</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                                className="input flex-1"
                                placeholder="Add email address..."
                            />
                            <button onClick={addEmail} className="btn-secondary">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {config.notification_emails.map((email) => (
                                <div
                                    key={email}
                                    className="flex items-center justify-between px-4 py-3 bg-dark-800 rounded-lg"
                                >
                                    <span className="text-dark-200">{email}</span>
                                    <button
                                        onClick={() => removeEmail(email)}
                                        className="p-1 hover:bg-dark-700 rounded text-dark-400 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {config.notification_emails.length === 0 && (
                                <div className="text-center py-8 text-dark-500">
                                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No recipients added yet</p>
                                    <p className="text-xs mt-1">Add email addresses to receive contact form notifications</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
