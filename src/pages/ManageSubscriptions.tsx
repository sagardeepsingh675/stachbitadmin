import { useState, useEffect } from 'react';
import { CreditCard, Edit, Plus, Trash2, X, Check, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

interface SubscriptionPlan {
    id: string;
    name: string;
    tier: string;
    price_monthly: number;
    price_yearly: number | null;
    leads_per_month: number;
    emails_per_month: number;
    templates_limit: number;
    can_export_csv: boolean;
    priority_support: boolean;
    trial_days: number;
    features: string[];
    is_active: boolean;
}

export default function ManageSubscriptions() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

    useEffect(() => {
        loadPlans();
    }, []);

    async function loadPlans() {
        setLoading(true);
        const { data } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('price_monthly', { ascending: true });

        if (data) setPlans(data);
        setLoading(false);
    }

    const handleToggleActive = async (plan: SubscriptionPlan) => {
        await supabase
            .from('subscription_plans')
            .update({ is_active: !plan.is_active })
            .eq('id', plan.id);
        await loadPlans();
    };

    const tierColors: Record<string, string> = {
        free_trial: 'border-gray-500',
        basic: 'border-blue-500',
        pro: 'border-purple-500',
        ultra_pro: 'border-yellow-500',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
                    <p className="text-dark-400">Manage pricing and plan features</p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-6 w-24 mb-4 rounded" />
                            <div className="skeleton h-10 w-32 mb-4 rounded" />
                            <div className="space-y-2">
                                <div className="skeleton h-4 w-full rounded" />
                                <div className="skeleton h-4 w-3/4 rounded" />
                                <div className="skeleton h-4 w-full rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`card p-6 border-t-4 ${tierColors[plan.tier]} ${!plan.is_active ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                    <span className="badge-primary text-xs">{plan.tier.replace('_', ' ')}</span>
                                </div>
                                <button
                                    onClick={() => setEditingPlan(plan)}
                                    className="p-2 hover:bg-dark-700 rounded-lg"
                                >
                                    <Edit className="w-4 h-4 text-dark-400" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-3xl font-bold text-white">
                                    {formatCurrency(plan.price_monthly)}
                                    <span className="text-sm text-dark-400 font-normal">/mo</span>
                                </p>
                                {plan.price_yearly && (
                                    <p className="text-dark-400 text-sm">
                                        {formatCurrency(plan.price_yearly)}/year
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between text-dark-400">
                                    <span>Leads/month</span>
                                    <span className="text-white">{plan.leads_per_month}</span>
                                </div>
                                <div className="flex justify-between text-dark-400">
                                    <span>Emails/month</span>
                                    <span className="text-white">{plan.emails_per_month}</span>
                                </div>
                                <div className="flex justify-between text-dark-400">
                                    <span>Templates</span>
                                    <span className="text-white">{plan.templates_limit}</span>
                                </div>
                                <div className="flex justify-between text-dark-400">
                                    <span>CSV Export</span>
                                    <span className={plan.can_export_csv ? 'text-green-400' : 'text-red-400'}>
                                        {plan.can_export_csv ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    </span>
                                </div>
                                <div className="flex justify-between text-dark-400">
                                    <span>Priority Support</span>
                                    <span className={plan.priority_support ? 'text-green-400' : 'text-red-400'}>
                                        {plan.priority_support ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleToggleActive(plan)}
                                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${plan.is_active
                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    }`}
                            >
                                {plan.is_active ? 'Active' : 'Inactive'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
