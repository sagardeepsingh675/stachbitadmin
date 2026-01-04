import { useEffect, useState } from 'react';
import {
    Users,
    Search,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Crown,
    Ban,
    CheckCircle,
    X,
    Mail,
    Target,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { supabase, getAllUsers, updateUserAsAdmin } from '../lib/supabase';
import { formatDate, getInitials } from '../lib/utils';
import type { UserProfile, SubscriptionTier } from '../lib/database.types';

const USERS_PER_PAGE = 10;

export default function ManageUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [currentPage]);

    async function loadUsers() {
        setLoading(true);
        const { data, count } = await getAllUsers({
            limit: USERS_PER_PAGE,
            offset: (currentPage - 1) * USERS_PER_PAGE,
        });

        if (data) setUsers(data);
        if (count !== null) setTotalCount(count);
        setLoading(false);
    }

    const filteredUsers = users.filter((user) =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(totalCount / USERS_PER_PAGE);

    const handleUpdateTier = async (tier: SubscriptionTier) => {
        if (!selectedUser) return;
        await updateUserAsAdmin(selectedUser.id, { subscription_tier: tier });
        await loadUsers();
    };

    const handleToggleActive = async () => {
        if (!selectedUser) return;
        await updateUserAsAdmin(selectedUser.id, { is_active: !selectedUser.is_active });
        await loadUsers();
        setShowActionModal(false);
    };

    const handleMakeAdmin = async () => {
        if (!selectedUser) return;
        await updateUserAsAdmin(selectedUser.id, { role: selectedUser.role === 'admin' ? 'user' : 'admin' });
        await loadUsers();
        setShowActionModal(false);
    };

    const handleResetUsage = async () => {
        if (!selectedUser) return;
        await updateUserAsAdmin(selectedUser.id, {
            leads_used_this_month: 0,
            emails_sent_this_month: 0
        });
        await loadUsers();
        setShowActionModal(false);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        await supabase.from('user_profiles').delete().eq('id', selectedUser.id);
        await loadUsers();
        setShowDeleteConfirm(false);
        setSelectedUser(null);
    };

    const openUserActions = (user: UserProfile) => {
        setSelectedUser(user);
        setShowActionModal(true);
    };

    const tierColors: Record<string, string> = {
        free_trial: 'badge-primary',
        basic: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        pro: 'badge-accent',
        ultra_pro: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Users</h1>
                    <p className="text-dark-400">{totalCount} total registered users</p>
                </div>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="input pl-12"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="spinner text-primary-400 mx-auto mb-4" />
                        <p className="text-dark-400">Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
                        <p className="text-dark-400">Try a different search query</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Subscription</th>
                                    <th>Usage</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-dark-800/50">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {user.full_name ? getInitials(user.full_name) : '?'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{user.full_name || 'No Name'}</p>
                                                    <p className="text-dark-500 text-sm">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {user.role === 'admin' ? (
                                                <span className="badge-accent flex items-center gap-1 w-fit">
                                                    <Crown className="w-3 h-3" />
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="text-dark-400">User</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${tierColors[user.subscription_tier]}`}>
                                                {user.subscription_tier.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-dark-400 text-sm">
                                            <div>{user.leads_used_this_month} leads</div>
                                            <div>{user.emails_sent_this_month} emails</div>
                                        </td>
                                        <td>
                                            {user.is_active ? (
                                                <span className="badge-success flex items-center gap-1 w-fit">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="badge-danger flex items-center gap-1 w-fit">
                                                    <Ban className="w-3 h-3" />
                                                    Suspended
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-dark-400 text-sm">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => openUserActions(user)}
                                                className="p-2 hover:bg-dark-700 rounded-lg"
                                            >
                                                <MoreHorizontal className="w-4 h-4 text-dark-400" />
                                            </button>
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
                            Showing {(currentPage - 1) * USERS_PER_PAGE + 1} to{' '}
                            {Math.min(currentPage * USERS_PER_PAGE, totalCount)} of {totalCount}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="btn-ghost btn-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-white px-3">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="btn-ghost btn-sm"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Actions Modal */}
            {showActionModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowActionModal(false)}>
                    <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-white">Manage User</h2>
                            <button onClick={() => setShowActionModal(false)} className="p-1 hover:bg-dark-700 rounded">
                                <X className="w-5 h-5 text-dark-400" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4 mb-6 p-4 bg-dark-800/50 rounded-xl">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                {selectedUser.full_name ? getInitials(selectedUser.full_name) : '?'}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{selectedUser.full_name || 'No Name'}</h3>
                                <p className="text-dark-400 text-sm">{selectedUser.email}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className={`badge text-xs ${tierColors[selectedUser.subscription_tier]}`}>
                                        {selectedUser.subscription_tier.replace('_', ' ')}
                                    </span>
                                    {selectedUser.role === 'admin' && (
                                        <span className="badge-accent text-xs">Admin</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 bg-dark-800/50 rounded-lg text-center">
                                <div className="flex items-center justify-center gap-1 text-dark-400 text-xs mb-1">
                                    <Target className="w-3 h-3" /> Leads
                                </div>
                                <p className="text-xl font-bold text-white">{selectedUser.leads_used_this_month}</p>
                            </div>
                            <div className="p-3 bg-dark-800/50 rounded-lg text-center">
                                <div className="flex items-center justify-center gap-1 text-dark-400 text-xs mb-1">
                                    <Mail className="w-3 h-3" /> Emails
                                </div>
                                <p className="text-xl font-bold text-white">{selectedUser.emails_sent_this_month}</p>
                            </div>
                        </div>

                        {/* Change Tier */}
                        <div className="mb-4">
                            <p className="text-dark-400 text-sm mb-2">Change Subscription Tier</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(['free_trial', 'basic', 'pro', 'ultra_pro'] as SubscriptionTier[]).map((tier) => (
                                    <button
                                        key={tier}
                                        onClick={() => handleUpdateTier(tier)}
                                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${selectedUser.subscription_tier === tier
                                            ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                                            : 'border-dark-600 text-dark-300 hover:border-dark-500 hover:bg-dark-700'
                                            }`}
                                    >
                                        {tier.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <p className="text-dark-400 text-sm mb-2">Quick Actions</p>

                            <button
                                onClick={handleMakeAdmin}
                                className="w-full px-4 py-3 text-left text-sm bg-dark-800/50 hover:bg-dark-700 rounded-lg flex items-center gap-3 text-accent-400"
                            >
                                <Crown className="w-5 h-5" />
                                <span>{selectedUser.role === 'admin' ? 'Remove Admin Role' : 'Make Admin'}</span>
                            </button>

                            <button
                                onClick={handleResetUsage}
                                className="w-full px-4 py-3 text-left text-sm bg-dark-800/50 hover:bg-dark-700 rounded-lg flex items-center gap-3 text-blue-400"
                            >
                                <RefreshCw className="w-5 h-5" />
                                <span>Reset Monthly Usage</span>
                            </button>

                            <button
                                onClick={handleToggleActive}
                                className={`w-full px-4 py-3 text-left text-sm bg-dark-800/50 hover:bg-dark-700 rounded-lg flex items-center gap-3 ${selectedUser.is_active ? 'text-yellow-400' : 'text-green-400'
                                    }`}
                            >
                                {selectedUser.is_active ? (
                                    <>
                                        <Ban className="w-5 h-5" />
                                        <span>Suspend User</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Activate User</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setShowActionModal(false);
                                    setShowDeleteConfirm(true);
                                }}
                                className="w-full px-4 py-3 text-left text-sm bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center gap-3 text-red-400"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>Delete User</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Delete User?</h2>
                        <p className="text-dark-400 mb-6">
                            Are you sure you want to delete <strong className="text-white">{selectedUser.email}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="btn-primary bg-red-500 hover:bg-red-600 flex-1"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
