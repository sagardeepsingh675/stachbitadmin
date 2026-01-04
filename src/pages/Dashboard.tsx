import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    CreditCard,
    TrendingUp,
    Mail,
    Search,
    Calendar,
    ArrowRight,
    UserPlus,
    Target,
    Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
    totalUsers: number;
    activeUsers: number;
    totalLeads: number;
    totalEmails: number;
    newUsersToday: number;
    revenueThisMonth: number;
}

interface Activity {
    id: string;
    type: 'user_joined' | 'lead_created' | 'search_made';
    title: string;
    subtitle: string;
    time: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeUsers: 0,
        totalLeads: 0,
        totalEmails: 0,
        newUsersToday: 0,
        revenueThisMonth: 0,
    });
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            // Get user count
            const { count: userCount } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            // Get active users (logged in within 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { count: activeCount } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .gte('last_login_at', thirtyDaysAgo.toISOString());

            // Get lead count
            const { count: leadCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true });

            // Get email count
            const { count: emailCount } = await supabase
                .from('email_logs')
                .select('*', { count: 'exact', head: true });

            // New users today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: newToday } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            setStats({
                totalUsers: userCount || 0,
                activeUsers: activeCount || 0,
                totalLeads: leadCount || 0,
                totalEmails: emailCount || 0,
                newUsersToday: newToday || 0,
                revenueThisMonth: 0,
            });

            // Load recent activity
            await loadActivities();
            setLoading(false);
        }

        async function loadActivities() {
            const activityList: Activity[] = [];

            // Recent users
            const { data: recentUsers } = await supabase
                .from('user_profiles')
                .select('id, full_name, email, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            if (recentUsers) {
                recentUsers.forEach(user => {
                    activityList.push({
                        id: `user-${user.id}`,
                        type: 'user_joined',
                        title: user.full_name || 'New user',
                        subtitle: user.email || 'joined the platform',
                        time: user.created_at,
                    });
                });
            }

            // Recent leads
            const { data: recentLeads } = await supabase
                .from('leads')
                .select('id, business_name, city, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            if (recentLeads) {
                recentLeads.forEach(lead => {
                    activityList.push({
                        id: `lead-${lead.id}`,
                        type: 'lead_created',
                        title: lead.business_name,
                        subtitle: lead.city ? `Lead from ${lead.city}` : 'New lead saved',
                        time: lead.created_at,
                    });
                });
            }

            // Recent searches
            const { data: recentSearches } = await supabase
                .from('lead_searches')
                .select('id, business_type, city, state, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            if (recentSearches) {
                recentSearches.forEach(search => {
                    activityList.push({
                        id: `search-${search.id}`,
                        type: 'search_made',
                        title: `Search: ${search.business_type || 'Business'}`,
                        subtitle: [search.city, search.state].filter(Boolean).join(', ') || 'Location search',
                        time: search.created_at,
                    });
                });
            }

            // Sort by time
            activityList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setActivities(activityList.slice(0, 8));
        }

        loadStats();
    }, []);

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'primary' },
        { label: 'Active Users', value: stats.activeUsers, icon: TrendingUp, color: 'green' },
        { label: 'Total Leads', value: stats.totalLeads, icon: Search, color: 'accent' },
        { label: 'Emails Sent', value: stats.totalEmails, icon: Mail, color: 'yellow' },
        { label: 'New Today', value: stats.newUsersToday, icon: Calendar, color: 'blue' },
        { label: 'Revenue (₹)', value: stats.revenueThisMonth.toLocaleString(), icon: CreditCard, color: 'accent' },
    ];

    const colorClasses: Record<string, string> = {
        primary: 'from-primary-500/20 to-primary-600/20 text-primary-400',
        green: 'from-green-500/20 to-green-600/20 text-green-400',
        accent: 'from-accent-500/20 to-accent-600/20 text-accent-400',
        yellow: 'from-yellow-500/20 to-yellow-600/20 text-yellow-400',
        blue: 'from-blue-500/20 to-blue-600/20 text-blue-400',
    };

    const activityIcons = {
        user_joined: { icon: UserPlus, color: 'text-green-400 bg-green-500/20' },
        lead_created: { icon: Target, color: 'text-blue-400 bg-blue-500/20' },
        search_made: { icon: Search, color: 'text-purple-400 bg-purple-500/20' },
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
                <p className="text-dark-400">Platform statistics and management</p>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card p-4">
                            <div className="skeleton h-10 w-10 rounded-lg mb-3" />
                            <div className="skeleton h-8 w-16 mb-1 rounded" />
                            <div className="skeleton h-4 w-20 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="card p-4">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center mb-3`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-dark-400 text-sm">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/users" className="card-hover p-6 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 text-primary-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-semibold">Manage Users</h3>
                            <p className="text-dark-400 text-sm">View and manage user accounts</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-dark-500 group-hover:text-primary-400 transition-colors" />
                    </div>
                </Link>

                <Link to="/subscriptions" className="card-hover p-6 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CreditCard className="w-6 h-6 text-accent-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-semibold">Subscriptions</h3>
                            <p className="text-dark-400 text-sm">Manage subscription plans</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-dark-500 group-hover:text-accent-400 transition-colors" />
                    </div>
                </Link>

                <Link to="/settings" className="card-hover p-6 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-semibold">Site Settings</h3>
                            <p className="text-dark-400 text-sm">Configure platform settings</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-dark-500 group-hover:text-green-400 transition-colors" />
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                    <Link to="/logs" className="text-primary-400 text-sm hover:underline">
                        View all →
                    </Link>
                </div>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-dark-800/50 rounded-lg">
                                <div className="skeleton w-10 h-10 rounded-lg" />
                                <div className="flex-1">
                                    <div className="skeleton h-4 w-32 mb-1 rounded" />
                                    <div className="skeleton h-3 w-24 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <p className="text-dark-400 text-center py-8">
                        No recent activity yet
                    </p>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity) => {
                            const { icon: Icon, color } = activityIcons[activity.type];
                            return (
                                <div key={activity.id} className="flex items-center gap-4 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 transition-colors">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{activity.title}</p>
                                        <p className="text-dark-500 text-xs truncate">{activity.subtitle}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-dark-500 text-xs">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(activity.time)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
