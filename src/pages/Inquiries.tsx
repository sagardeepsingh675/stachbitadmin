import { useState, useEffect } from 'react';
import { Inbox, Eye, CheckCircle, X, Mail, Phone, Building, MessageSquare } from 'lucide-react';
import { getWebsiteInquiries, updateWebsiteInquiry } from '../lib/supabase';
import { formatDate, formatRelativeTime } from '../lib/utils';

interface Inquiry {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    service_interest?: string;
    budget_range?: string;
    message: string;
    status: 'new' | 'contacted' | 'in_progress' | 'completed';
    admin_notes?: string;
    created_at: string;
}

export default function Inquiries() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadInquiries();
    }, []);

    async function loadInquiries() {
        setLoading(true);
        const { data } = await getWebsiteInquiries({ limit: 50 });
        if (data) setInquiries(data);
        setLoading(false);
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        await updateWebsiteInquiry(id, { status });
        await loadInquiries();
        if (selectedInquiry?.id === id) {
            setSelectedInquiry({ ...selectedInquiry, status: status as Inquiry['status'] });
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedInquiry) return;
        await updateWebsiteInquiry(selectedInquiry.id, { admin_notes: notes });
        await loadInquiries();
    };

    const statusColors: Record<string, string> = {
        new: 'badge-primary',
        contacted: 'badge-warning',
        in_progress: 'badge-accent',
        completed: 'badge-success',
    };

    const serviceLabels: Record<string, string> = {
        web_dev: 'Website Development',
        saas: 'SaaS Development',
        android: 'Android App',
        custom: 'Custom Project',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Website Inquiries</h1>
                <p className="text-dark-400">Manage contact form submissions from stachbit.in</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inquiries List */}
                <div className="lg:col-span-2 card overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="spinner text-primary-400 mx-auto mb-4" />
                            <p className="text-dark-400">Loading inquiries...</p>
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className="p-12 text-center">
                            <Inbox className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No inquiries yet</h3>
                            <p className="text-dark-400">Contact form submissions will appear here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Contact</th>
                                        <th>Service</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th className="w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inquiries.map((inquiry) => (
                                        <tr
                                            key={inquiry.id}
                                            className={`cursor-pointer ${selectedInquiry?.id === inquiry.id ? 'bg-dark-800/50' : ''}`}
                                            onClick={() => {
                                                setSelectedInquiry(inquiry);
                                                setNotes(inquiry.admin_notes || '');
                                            }}
                                        >
                                            <td>
                                                <div>
                                                    <p className="text-white font-medium">{inquiry.name}</p>
                                                    <p className="text-dark-500 text-sm">{inquiry.email}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-dark-400">
                                                    {inquiry.service_interest ? serviceLabels[inquiry.service_interest] : 'General'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${statusColors[inquiry.status]}`}>
                                                    {inquiry.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="text-dark-400 text-sm">
                                                {formatRelativeTime(inquiry.created_at)}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedInquiry(inquiry);
                                                        setNotes(inquiry.admin_notes || '');
                                                    }}
                                                    className="p-2 hover:bg-dark-700 rounded-lg"
                                                >
                                                    <Eye className="w-4 h-4 text-dark-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Inquiry Detail */}
                <div className="card p-6">
                    {selectedInquiry ? (
                        <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <h2 className="text-lg font-bold text-white">{selectedInquiry.name}</h2>
                                <button onClick={() => setSelectedInquiry(null)} className="p-1 hover:bg-dark-700 rounded">
                                    <X className="w-5 h-5 text-dark-400" />
                                </button>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-dark-400">
                                    <Mail className="w-4 h-4" />
                                    <a href={`mailto:${selectedInquiry.email}`} className="text-primary-400 hover:underline">
                                        {selectedInquiry.email}
                                    </a>
                                </div>
                                {selectedInquiry.phone && (
                                    <div className="flex items-center gap-3 text-dark-400">
                                        <Phone className="w-4 h-4" />
                                        <a href={`tel:${selectedInquiry.phone}`} className="text-primary-400 hover:underline">
                                            {selectedInquiry.phone}
                                        </a>
                                    </div>
                                )}
                                {selectedInquiry.company && (
                                    <div className="flex items-center gap-3 text-dark-400">
                                        <Building className="w-4 h-4" />
                                        <span className="text-white">{selectedInquiry.company}</span>
                                    </div>
                                )}
                            </div>

                            {/* Service & Budget */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-dark-800/50 rounded-lg p-3">
                                    <p className="text-dark-500 text-xs mb-1">Service Interest</p>
                                    <p className="text-white text-sm">
                                        {selectedInquiry.service_interest ? serviceLabels[selectedInquiry.service_interest] : 'General'}
                                    </p>
                                </div>
                                <div className="bg-dark-800/50 rounded-lg p-3">
                                    <p className="text-dark-500 text-xs mb-1">Budget Range</p>
                                    <p className="text-white text-sm">{selectedInquiry.budget_range || 'Not specified'}</p>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <p className="text-dark-400 text-sm mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Message
                                </p>
                                <p className="text-dark-300 text-sm bg-dark-800/50 rounded-lg p-3">
                                    {selectedInquiry.message}
                                </p>
                            </div>

                            {/* Status Update */}
                            <div>
                                <p className="text-dark-400 text-sm mb-2">Update Status</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {['new', 'contacted', 'in_progress', 'completed'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateStatus(selectedInquiry.id, status)}
                                            className={`px-3 py-2 text-xs rounded-lg border transition-all ${selectedInquiry.status === status
                                                    ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                                                    : 'border-dark-600 text-dark-300 hover:border-dark-500'
                                                }`}
                                        >
                                            {status.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <p className="text-dark-400 text-sm mb-2">Admin Notes</p>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="input resize-none"
                                    rows={3}
                                    placeholder="Add internal notes..."
                                />
                                <button onClick={handleSaveNotes} className="btn-secondary btn-sm mt-2 w-full">
                                    Save Notes
                                </button>
                            </div>

                            <p className="text-dark-500 text-xs text-center">
                                Received {formatDate(selectedInquiry.created_at)}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Inbox className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                            <p className="text-dark-400">Select an inquiry to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
