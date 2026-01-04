import { useState, useEffect } from 'react';
import { FileText, Search, RefreshCw, Clock, User, Activity } from 'lucide-react';
import { getActivityLogs } from '../lib/supabase';
import { formatRelativeTime } from '../lib/utils';

interface Log {
    id: string;
    user_id: string;
    action: string;
    details: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user_profiles?: { full_name: string; email: string };
}

export default function Logs() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const LOGS_PER_PAGE = 20;

    useEffect(() => {
        loadLogs();
    }, [currentPage]);

    async function loadLogs() {
        setLoading(true);
        const { data, count } = await getActivityLogs({
            limit: LOGS_PER_PAGE,
            offset: (currentPage - 1) * LOGS_PER_PAGE,
        });
        if (data) setLogs(data);
        if (count !== null) setTotalCount(count);
        setLoading(false);
    }

    const filteredLogs = logs.filter(
        (log) =>
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user_profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user_profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(totalCount / LOGS_PER_PAGE);

    const actionColors: Record<string, string> = {
        login: 'text-green-400 bg-green-500/20',
        logout: 'text-gray-400 bg-gray-500/20',
        signup: 'text-blue-400 bg-blue-500/20',
        lead_search: 'text-purple-400 bg-purple-500/20',
        lead_save: 'text-cyan-400 bg-cyan-500/20',
        email_sent: 'text-yellow-400 bg-yellow-500/20',
        subscription_change: 'text-accent-400 bg-accent-500/20',
        profile_update: 'text-primary-400 bg-primary-500/20',
        default: 'text-dark-400 bg-dark-700',
    };

    const getActionColor = (action: string): string => {
        for (const key of Object.keys(actionColors)) {
            if (action.toLowerCase().includes(key)) {
                return actionColors[key];
            }
        }
        return actionColors.default;
    };

    const formatAction = (action: string): string => {
        return action
            .replace(/_/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Logs</h1>
                    <p className="text-dark-400">Activity and audit trail</p>
                </div>
                <button onClick={loadLogs} className="btn-secondary self-start">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by action or user..."
                        className="input pl-12"
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="spinner text-primary-400 mx-auto mb-4" />
                        <p className="text-dark-400">Loading logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No logs found</h3>
                        <p className="text-dark-400">Activity logs will appear here</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div className="flex items-center gap-2 text-dark-400 text-sm">
                                                <Clock className="w-4 h-4" />
                                                {formatRelativeTime(log.created_at)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-dark-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm">
                                                        {log.user_profiles?.full_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-dark-500 text-xs">
                                                        {log.user_profiles?.email || log.user_id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getActionColor(log.action)}`}
                                            >
                                                <Activity className="w-3 h-3" />
                                                {formatAction(log.action)}
                                            </span>
                                        </td>
                                        <td className="text-dark-400 text-sm max-w-xs truncate">
                                            {log.details ? (
                                                <code className="text-xs bg-dark-800 px-2 py-1 rounded">
                                                    {JSON.stringify(log.details).slice(0, 50)}...
                                                </code>
                                            ) : (
                                                <span className="text-dark-500">—</span>
                                            )}
                                        </td>
                                        <td className="text-dark-500 text-sm font-mono">
                                            {log.ip_address || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-dark-700 flex items-center justify-between">
                        <p className="text-dark-400 text-sm">
                            Page {currentPage} of {totalPages} ({totalCount} logs)
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="btn-ghost btn-sm"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="btn-ghost btn-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
