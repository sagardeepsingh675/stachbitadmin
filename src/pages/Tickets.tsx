import { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, X, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getSupportTickets, getTicketResponses, addTicketResponse, updateTicketStatus } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../lib/utils';

interface Ticket {
    id: string;
    user_id: string;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
    created_at: string;
    user_profiles?: { full_name: string; email: string };
}

interface Response {
    id: string;
    ticket_id: string;
    user_id: string;
    message: string;
    is_admin: boolean;
    created_at: string;
}

export default function Tickets() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [responses, setResponses] = useState<Response[]>([]);
    const [newResponse, setNewResponse] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        setLoading(true);
        const { data } = await getSupportTickets({ limit: 50 });
        if (data) setTickets(data);
        setLoading(false);
    }

    async function loadResponses(ticketId: string) {
        const { data } = await getTicketResponses(ticketId);
        if (data) setResponses(data);
    }

    const handleSelectTicket = async (ticket: Ticket) => {
        setSelectedTicket(ticket);
        await loadResponses(ticket.id);
    };

    const handleSendResponse = async () => {
        if (!selectedTicket || !newResponse.trim() || !user) return;

        setSending(true);
        await addTicketResponse({
            ticket_id: selectedTicket.id,
            user_id: user.id,
            message: newResponse,
            is_admin: true,
        });

        // Update status to in_progress if it was open
        if (selectedTicket.status === 'open') {
            await updateTicketStatus(selectedTicket.id, 'in_progress');
        }

        setNewResponse('');
        await loadResponses(selectedTicket.id);
        await loadTickets();
        setSending(false);
    };

    const handleCloseTicket = async () => {
        if (!selectedTicket) return;
        await updateTicketStatus(selectedTicket.id, 'closed');
        await loadTickets();
        setSelectedTicket({ ...selectedTicket, status: 'closed' });
    };

    const statusColors: Record<string, string> = {
        open: 'badge-primary',
        in_progress: 'badge-warning',
        closed: 'badge-success',
    };

    const priorityColors: Record<string, string> = {
        low: 'text-green-400',
        medium: 'text-yellow-400',
        high: 'text-red-400',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
                <p className="text-dark-400">Manage customer support requests</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tickets List */}
                <div className="lg:col-span-1 card overflow-hidden">
                    <div className="p-4 border-b border-dark-700">
                        <h2 className="font-semibold text-white">All Tickets</h2>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="spinner text-primary-400 mx-auto" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="p-8 text-center">
                            <HelpCircle className="w-12 h-12 text-dark-600 mx-auto mb-2" />
                            <p className="text-dark-400">No tickets yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-dark-700 max-h-[600px] overflow-y-auto">
                            {tickets.map((ticket) => (
                                <button
                                    key={ticket.id}
                                    onClick={() => handleSelectTicket(ticket)}
                                    className={`w-full p-4 text-left hover:bg-dark-800/50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-dark-800/50' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-medium text-white truncate flex-1">{ticket.subject}</h3>
                                        <span className={`badge text-xs ${statusColors[ticket.status]}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-dark-400 text-sm truncate mb-1">
                                        {ticket.user_profiles?.email || 'Unknown user'}
                                    </p>
                                    <p className="text-dark-500 text-xs">
                                        {formatRelativeTime(ticket.created_at)}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ticket Detail */}
                <div className="lg:col-span-2 card overflow-hidden flex flex-col min-h-[600px]">
                    {selectedTicket ? (
                        <>
                            <div className="p-4 border-b border-dark-700">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="font-semibold text-white">{selectedTicket.subject}</h2>
                                        <p className="text-dark-400 text-sm">
                                            From: {selectedTicket.user_profiles?.email || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`badge ${statusColors[selectedTicket.status]}`}>
                                            {selectedTicket.status.replace('_', ' ')}
                                        </span>
                                        {selectedTicket.status !== 'closed' && (
                                            <button
                                                onClick={handleCloseTicket}
                                                className="badge-success cursor-pointer"
                                            >
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Close
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                {/* Original message */}
                                <div className="bg-dark-800/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-white font-medium">{selectedTicket.user_profiles?.full_name || 'User'}</span>
                                        <span className="text-dark-500 text-xs">{formatRelativeTime(selectedTicket.created_at)}</span>
                                    </div>
                                    <p className="text-dark-300">{selectedTicket.message}</p>
                                </div>

                                {/* Responses */}
                                {responses.map((response) => (
                                    <div
                                        key={response.id}
                                        className={`rounded-lg p-4 ${response.is_admin
                                                ? 'bg-primary-500/10 border border-primary-500/30 ml-8'
                                                : 'bg-dark-800/50 mr-8'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-white font-medium">
                                                {response.is_admin ? 'Admin' : 'User'}
                                            </span>
                                            <span className="text-dark-500 text-xs">{formatRelativeTime(response.created_at)}</span>
                                        </div>
                                        <p className="text-dark-300">{response.message}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Box */}
                            {selectedTicket.status !== 'closed' && (
                                <div className="p-4 border-t border-dark-700">
                                    <div className="flex gap-3">
                                        <textarea
                                            value={newResponse}
                                            onChange={(e) => setNewResponse(e.target.value)}
                                            placeholder="Type your response..."
                                            className="input flex-1 resize-none"
                                            rows={3}
                                        />
                                        <button
                                            onClick={handleSendResponse}
                                            disabled={!newResponse.trim() || sending}
                                            className="btn-primary self-end"
                                        >
                                            {sending ? (
                                                <div className="spinner" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                                <p className="text-dark-400">Select a ticket to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
