import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Search, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
    usersThisMonth: number;
    usersLastMonth: number;
    leadsThisMonth: number;
    leadsLastMonth: number;
    emailsThisMonth: number;
    emailsLastMonth: number;
    searchesThisMonth: number;
    searchesLastMonth: number;
    dailySignups: { date: string; count: number }[];
    topBusinessTypes: { business_type: string; count: number }[];
}

export default function Analytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        loadAnalytics();
    }, [period]);

    async function loadAnalytics() {
        setLoading(true);

        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // Note: endOfLastMonth removed as it was unused

        // Users this month
        const { count: usersThisMonth } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfThisMonth.toISOString());

        // Users last month
        const { count: usersLastMonth } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfLastMonth.toISOString())
            .lt('created_at', startOfThisMonth.toISOString());

        // Leads this month
        const { count: leadsThisMonth } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfThisMonth.toISOString());

        // Leads last month
        const { count: leadsLastMonth } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfLastMonth.toISOString())
            .lt('created_at', startOfThisMonth.toISOString());

        // Emails this month
        const { count: emailsThisMonth } = await supabase
            .from('email_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfThisMonth.toISOString());

        // Emails last month
        const { count: emailsLastMonth } = await supabase
            .from('email_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfLastMonth.toISOString())
            .lt('created_at', startOfThisMonth.toISOString());

        // Searches this month
        const { count: searchesThisMonth } = await supabase
            .from('lead_searches')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfThisMonth.toISOString());

        // Searches last month
        const { count: searchesLastMonth } = await supabase
            .from('lead_searches')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfLastMonth.toISOString())
            .lt('created_at', startOfThisMonth.toISOString());

        // Top business types searched
        const { data: businessTypes } = await supabase
            .from('lead_searches')
            .select('business_type')
            .not('business_type', 'is', null)
            .order('created_at', { ascending: false })
            .limit(100);

        const businessTypeCounts: Record<string, number> = {};
        businessTypes?.forEach(item => {
            const type = item.business_type;
            if (type) {
                businessTypeCounts[type] = (businessTypeCounts[type] || 0) + 1;
            }
        });

        const topBusinessTypes = Object.entries(businessTypeCounts)
            .map(([business_type, count]) => ({ business_type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        setData({
            usersThisMonth: usersThisMonth || 0,
            usersLastMonth: usersLastMonth || 0,
            leadsThisMonth: leadsThisMonth || 0,
            leadsLastMonth: leadsLastMonth || 0,
            emailsThisMonth: emailsThisMonth || 0,
            emailsLastMonth: emailsLastMonth || 0,
            searchesThisMonth: searchesThisMonth || 0,
            searchesLastMonth: searchesLastMonth || 0,
            dailySignups: [],
            topBusinessTypes,
        });

        setLoading(false);
    }

    const calculateGrowth = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const growth = ((current - previous) / previous) * 100;
        return `${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%`;
    };

    const stats = data ? [
        {
            label: 'New Users',
            value: data.usersThisMonth,
            previous: data.usersLastMonth,
            icon: Users,
            color: 'primary',
        },
        {
            label: 'Leads Saved',
            value: data.leadsThisMonth,
            previous: data.leadsLastMonth,
            icon: TrendingUp,
            color: 'green',
        },
        {
            label: 'Emails Sent',
            value: data.emailsThisMonth,
            previous: data.emailsLastMonth,
            icon: Mail,
            color: 'accent',
        },
        {
            label: 'Searches Made',
            value: data.searchesThisMonth,
            previous: data.searchesLastMonth,
            icon: Search,
            color: 'blue',
        },
    ] : [];

    const colorClasses: Record<string, string> = {
        primary: 'from-primary-500/20 to-primary-600/20 text-primary-400',
        green: 'from-green-500/20 to-green-600/20 text-green-400',
        accent: 'from-accent-500/20 to-accent-600/20 text-accent-400',
        blue: 'from-blue-500/20 to-blue-600/20 text-blue-400',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics</h1>
                    <p className="text-dark-400">Platform usage and growth metrics</p>
                </div>
                <div className="flex items-center gap-2 bg-dark-800 rounded-lg p-1">
                    {(['7d', '30d', '90d'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${period === p
                                ? 'bg-primary-500 text-white'
                                : 'text-dark-400 hover:text-white'
                                }`}
                        >
                            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-10 w-10 rounded-lg mb-4" />
                            <div className="skeleton h-8 w-20 mb-2 rounded" />
                            <div className="skeleton h-4 w-16 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            const growth = calculateGrowth(stat.value, stat.previous);
                            const isPositive = growth.startsWith('+');

                            return (
                                <div key={stat.label} className="card p-6">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center mb-4`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <p className="text-3xl font-bold text-white mb-1">{stat.value.toLocaleString()}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-dark-400 text-sm">{stat.label}</p>
                                        <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                            {growth}
                                        </span>
                                    </div>
                                    <p className="text-dark-500 text-xs mt-1">
                                        vs {stat.previous} last month
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Top Business Types */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Top Business Types Searched</h2>
                            {data?.topBusinessTypes && data.topBusinessTypes.length > 0 ? (
                                <div className="space-y-3">
                                    {data.topBusinessTypes.map((item, i) => (
                                        <div key={item.business_type} className="flex items-center gap-4">
                                            <span className="text-dark-500 w-6 text-sm">{i + 1}.</span>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-white text-sm">{item.business_type}</span>
                                                    <span className="text-dark-400 text-sm">{item.count}</span>
                                                </div>
                                                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                                                        style={{
                                                            width: `${(item.count / data.topBusinessTypes[0].count) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-dark-400">
                                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No search data yet</p>
                                </div>
                            )}
                        </div>

                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Quick Insights</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-lg">
                                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">User Growth</p>
                                        <p className="text-dark-400 text-sm">
                                            {data?.usersThisMonth || 0} new users joined this month
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-lg">
                                    <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Lead Generation</p>
                                        <p className="text-dark-400 text-sm">
                                            Average {((data?.leadsThisMonth || 0) / 30).toFixed(1)} leads saved per day
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-lg">
                                    <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-accent-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Email Activity</p>
                                        <p className="text-dark-400 text-sm">
                                            {data?.emailsThisMonth || 0} emails sent this month
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
