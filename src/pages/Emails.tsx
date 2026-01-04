import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, X, Edit, Eye, Copy, Check } from 'lucide-react';
import { getEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '../lib/supabase';
import { copyToClipboard, formatDate } from '../lib/utils';

interface EmailTemplate {
    id: string;
    user_id: string | null;
    name: string;
    subject: string;
    body_html: string;
    body_text: string | null;
    category?: string | null;
    is_system?: boolean;
    variables?: string[];
    is_default?: boolean;
    use_count?: number;
    created_at: string;
    updated_at: string;
}

export default function Emails() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
    const [copied, setCopied] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body_html: '',
        category: 'outreach',
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        setLoading(true);
        const { data } = await getEmailTemplates();
        if (data) setTemplates(data);
        setLoading(false);
    }

    const resetForm = () => {
        setFormData({
            name: '',
            subject: '',
            body_html: '',
            category: 'outreach',
        });
        setEditingTemplate(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTemplate) {
            await updateEmailTemplate(editingTemplate.id, formData);
        } else {
            await createEmailTemplate({
                ...formData,
                user_id: null, // System template
            });
        }

        resetForm();
        setShowForm(false);
        await loadTemplates();
    };

    const handleEdit = (template: EmailTemplate) => {
        setFormData({
            name: template.name,
            subject: template.subject,
            body_html: template.body_html,
            category: template.category || 'outreach',
        });
        setEditingTemplate(template);
        setShowForm(true);
    };

    const handleDelete = async (templateId: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            await deleteEmailTemplate(templateId);
            await loadTemplates();
        }
    };

    const handleCopyHtml = async (html: string) => {
        await copyToClipboard(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const categories: Record<string, string> = {
        outreach: 'Outreach',
        follow_up: 'Follow-up',
        introduction: 'Introduction',
        proposal: 'Proposal',
        newsletter: 'Newsletter',
        system: 'System',
    };

    const categoryColors: Record<string, string> = {
        outreach: 'badge-primary',
        follow_up: 'badge-warning',
        introduction: 'badge-success',
        proposal: 'badge-accent',
        newsletter: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        system: 'badge-danger',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Email Templates</h1>
                    <p className="text-dark-400">Manage reusable email templates</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    Create Template
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="glass-card p-6 w-full max-w-2xl my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingTemplate ? 'Edit Template' : 'Create Template'}
                            </h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 hover:bg-dark-700 rounded">
                                <X className="w-5 h-5 text-dark-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Template Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input"
                                        placeholder="e.g. Cold Outreach V1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="select"
                                    >
                                        {Object.entries(categories).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="label">Email Subject *</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="input"
                                    placeholder="e.g. Quick question about {{business_name}}"
                                    required
                                />
                                <p className="text-dark-500 text-xs mt-1">
                                    Use {'{{variable}}'} for dynamic content
                                </p>
                            </div>
                            <div>
                                <label className="label">Email Body (HTML) *</label>
                                <textarea
                                    value={formData.body_html}
                                    onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                                    className="input resize-none font-mono text-sm"
                                    rows={12}
                                    placeholder="<p>Hi {{contact_name}},</p>..."
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    {editingTemplate ? 'Save Changes' : 'Create Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">{previewTemplate.name}</h2>
                            <button onClick={() => setPreviewTemplate(null)} className="p-1 hover:bg-dark-700 rounded">
                                <X className="w-5 h-5 text-dark-400" />
                            </button>
                        </div>
                        <div className="bg-dark-800/50 rounded-lg p-4 mb-4">
                            <p className="text-dark-400 text-sm mb-1">Subject:</p>
                            <p className="text-white">{previewTemplate.subject}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto">
                            <div dangerouslySetInnerHTML={{ __html: previewTemplate.body_html }} />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => handleCopyHtml(previewTemplate.body_html)}
                                className="btn-secondary flex-1"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                {copied ? 'Copied!' : 'Copy HTML'}
                            </button>
                            <button
                                onClick={() => {
                                    setPreviewTemplate(null);
                                    handleEdit(previewTemplate);
                                }}
                                className="btn-primary flex-1"
                            >
                                <Edit className="w-5 h-5" />
                                Edit Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Templates List */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="spinner text-primary-400 mx-auto mb-4" />
                        <p className="text-dark-400">Loading templates...</p>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="p-12 text-center">
                        <Mail className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No templates yet</h3>
                        <p className="text-dark-400 mb-6">Create your first email template to get started</p>
                        <button onClick={() => setShowForm(true)} className="btn-primary">
                            <Plus className="w-5 h-5" />
                            Create Template
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Template</th>
                                    <th>Category</th>
                                    <th>Subject</th>
                                    <th>Updated</th>
                                    <th className="w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((template) => (
                                    <tr key={template.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-accent-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{template.name}</p>
                                                    {template.is_system && (
                                                        <span className="text-dark-500 text-xs">System template</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${categoryColors[template.category || 'outreach']}`}>
                                                {categories[template.category || 'outreach']}
                                            </span>
                                        </td>
                                        <td className="text-dark-400 text-sm max-w-xs truncate">
                                            {template.subject}
                                        </td>
                                        <td className="text-dark-400 text-sm">
                                            {formatDate(template.updated_at)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setPreviewTemplate(template)}
                                                    className="p-2 hover:bg-dark-700 rounded-lg"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-4 h-4 text-dark-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(template)}
                                                    className="p-2 hover:bg-dark-700 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4 text-dark-400" />
                                                </button>
                                                {!template.is_system && (
                                                    <button
                                                        onClick={() => handleDelete(template.id)}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
