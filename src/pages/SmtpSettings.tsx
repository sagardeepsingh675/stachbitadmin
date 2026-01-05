import { useState, useEffect } from 'react';
import {
    Mail,
    Server,
    Key,
    Send,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    Plus,
    X,
    TestTube,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SmtpConfig {
    id?: string;
    smtp_host: string;
    smtp_port: number;
    smtp_secure: boolean;
    smtp_user: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
    notification_emails: string[];
    is_active: boolean;
}

export default function SmtpSettings() {
    const [config, setConfig] = useState<SmtpConfig>({
        smtp_host: 'smtp.zoho.in',
        smtp_port: 465,
        smtp_secure: true,
        smtp_user: '',
        smtp_password: '',
        from_email: '',
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
            setConfig(data);
        }
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);

        try {
            if (config.id) {
                // Update existing
                const { error } = await supabase
                    .from('smtp_settings')
                    .update({
                        smtp_host: config.smtp_host,
                        smtp_port: config.smtp_port,
                        smtp_secure: config.smtp_secure,
                        smtp_user: config.smtp_user,
                        smtp_password: config.smtp_password,
                        from_email: config.from_email,
                        from_name: config.from_name,
                        notification_emails: config.notification_emails,
                        is_active: config.is_active,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', config.id);

                if (error) throw error;
            } else {
                // Insert new
                const { error } = await supabase
                    .from('smtp_settings')
                    .insert({
                        smtp_host: config.smtp_host,
                        smtp_port: config.smtp_port,
                        smtp_secure: config.smtp_secure,
                        smtp_user: config.smtp_user,
                        smtp_password: config.smtp_password,
                        from_email: config.from_email,
                        from_name: config.from_name,
                        notification_emails: config.notification_emails,
                        is_active: config.is_active,
                    });

                if (error) throw error;
            }

            setNotification({ type: 'success', message: 'SMTP settings saved successfully!' });
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
            // Call edge function to send test email
            const { error } = await supabase.functions.invoke('send-contact-notification', {
                body: {
                    test: true,
                    name: 'Test User',
                    email: 'test@example.com',
                    subject: 'Test Email',
                    message: 'This is a test email from Stachbit Admin Panel.',
                },
            });

            if (error) throw error;
            setNotification({ type: 'success', message: 'Test email sent! Check your inbox.' });
        } catch (err) {
            console.error('Test email error:', err);
            setNotification({
                type: 'error',
                message: 'Failed to send test email. Make sure edge function is deployed.'
            });
        } finally {
            setTesting(false);
        }
    }

    function addEmail() {
        if (newEmail && !config.notification_emails.includes(newEmail)) {
            setConfig({
                ...config,
                notification_emails: [...config.notification_emails, newEmail],
            });
            setNewEmail('');
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
                    <h1 className="text-2xl font-bold text-white">SMTP Settings</h1>
                    <p className="text-dark-400 mt-1">
                        Configure email notifications for contact form submissions
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleTestEmail}
                        disabled={testing || !config.id}
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

            <div className="grid lg:grid-cols-2 gap-6">
                {/* SMTP Server Settings */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <Server className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">SMTP Server</h2>
                            <p className="text-dark-500 text-sm">Mail server configuration</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="label">SMTP Host</label>
                            <input
                                type="text"
                                value={config.smtp_host}
                                onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                                className="input"
                                placeholder="smtp.zoho.in"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Port</label>
                                <input
                                    type="number"
                                    value={config.smtp_port}
                                    onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) })}
                                    className="input"
                                    placeholder="465"
                                />
                            </div>
                            <div>
                                <label className="label">Security</label>
                                <select
                                    value={config.smtp_secure ? 'ssl' : 'none'}
                                    onChange={(e) => setConfig({ ...config, smtp_secure: e.target.value === 'ssl' })}
                                    className="select"
                                >
                                    <option value="ssl">SSL/TLS</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
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

                {/* Authentication */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                            <Key className="w-5 h-5 text-accent-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Authentication</h2>
                            <p className="text-dark-500 text-sm">SMTP credentials</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="label">Username / Email</label>
                            <input
                                type="text"
                                value={config.smtp_user}
                                onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                                className="input"
                                placeholder="no-reply@stachbit.in"
                            />
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                value={config.smtp_password}
                                onChange={(e) => setConfig({ ...config, smtp_password: e.target.value })}
                                className="input"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                {/* Sender Info */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Send className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Sender Info</h2>
                            <p className="text-dark-500 text-sm">From address details</p>
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
                                placeholder="no-reply@stachbit.in"
                            />
                        </div>

                        <div>
                            <label className="label">From Name</label>
                            <input
                                type="text"
                                value={config.from_name}
                                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                                className="input"
                                placeholder="Stachbit Contact"
                            />
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
                                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
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
                                    className="flex items-center justify-between px-4 py-2 bg-dark-800 rounded-lg"
                                >
                                    <span className="text-dark-200">{email}</span>
                                    <button
                                        onClick={() => removeEmail(email)}
                                        className="p-1 hover:bg-dark-700 rounded text-dark-400 hover:text-red-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {config.notification_emails.length === 0 && (
                                <p className="text-dark-500 text-sm text-center py-4">
                                    No recipients added yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
