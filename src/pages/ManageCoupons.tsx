import { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, X, Edit, Copy, Check } from 'lucide-react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../lib/supabase';
import { formatDate, copyToClipboard } from '../lib/utils';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses: number | null;
    current_uses: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
}

export default function ManageCoupons() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 10,
        max_uses: '',
        valid_until: '',
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    async function loadCoupons() {
        setLoading(true);
        const { data } = await getCoupons();
        if (data) setCoupons(data);
        setLoading(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createCoupon({
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
            valid_until: formData.valid_until || undefined,
            is_active: true,
        });
        setFormData({ code: '', discount_type: 'percentage', discount_value: 10, max_uses: '', valid_until: '' });
        setShowForm(false);
        await loadCoupons();
    };

    const handleToggleActive = async (coupon: Coupon) => {
        await updateCoupon(coupon.id, { is_active: !coupon.is_active });
        await loadCoupons();
    };

    const handleDelete = async (couponId: string) => {
        if (confirm('Are you sure you want to delete this coupon?')) {
            await deleteCoupon(couponId);
            await loadCoupons();
        }
    };

    const handleCopyCode = async (code: string) => {
        await copyToClipboard(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Coupons</h1>
                    <p className="text-dark-400">Create and manage discount codes</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    Create Coupon
                </button>
            </div>

            {/* Coupon Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Create Coupon</h2>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-dark-700 rounded">
                                <X className="w-5 h-5 text-dark-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Coupon Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="input uppercase"
                                    placeholder="SAVE20"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Discount Type</label>
                                    <select
                                        value={formData.discount_type}
                                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                                        className="select"
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Value</label>
                                    <input
                                        type="number"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) })}
                                        className="input"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Max Uses (optional)</label>
                                    <input
                                        type="number"
                                        value={formData.max_uses}
                                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                        className="input"
                                        placeholder="Unlimited"
                                    />
                                </div>
                                <div>
                                    <label className="label">Valid Until (optional)</label>
                                    <input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    Create Coupon
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Coupons Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="spinner text-primary-400 mx-auto mb-4" />
                        <p className="text-dark-400">Loading coupons...</p>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="p-12 text-center">
                        <Ticket className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No coupons yet</h3>
                        <p className="text-dark-400">Create your first coupon to offer discounts</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th>Usage</th>
                                    <th>Valid Until</th>
                                    <th>Status</th>
                                    <th className="w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-dark-700 px-2 py-1 rounded text-primary-400 font-mono">
                                                    {coupon.code}
                                                </code>
                                                <button
                                                    onClick={() => handleCopyCode(coupon.code)}
                                                    className="p-1 hover:bg-dark-700 rounded"
                                                >
                                                    {copiedCode === coupon.code ? (
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-dark-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge-accent">
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}%`
                                                    : `₹${coupon.discount_value}`}
                                            </span>
                                        </td>
                                        <td className="text-dark-400">
                                            {coupon.current_uses} / {coupon.max_uses || '∞'}
                                        </td>
                                        <td className="text-dark-400 text-sm">
                                            {coupon.valid_until ? formatDate(coupon.valid_until) : 'No expiry'}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleActive(coupon)}
                                                className={`badge ${coupon.is_active ? 'badge-success' : 'badge-danger'}`}
                                            >
                                                {coupon.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
