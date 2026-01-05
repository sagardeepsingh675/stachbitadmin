import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    Crown,
    Ticket,
    BarChart3,
    Mail,
    FileText,
    HelpCircle,
    Inbox,
    FolderKanban,
    BookOpen,
    Sparkles,
    Phone,
    Server,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../lib/utils';

const adminLinks = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Manage Users', href: '/users', icon: Users },
    { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { name: 'Coupons', href: '/coupons', icon: Ticket },
    { name: 'Support Tickets', href: '/tickets', icon: HelpCircle },
    { name: 'Website Inquiries', href: '/inquiries', icon: Inbox },
    { name: 'Portfolio', href: '/portfolio', icon: FolderKanban },
    { name: 'Blog Posts', href: '/blog', icon: BookOpen },
    { name: 'AI Blog Generator', href: '/ai-blog', icon: Sparkles },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Email Templates', href: '/emails', icon: Mail },
    { name: 'SMTP Settings', href: '/smtp-settings', icon: Server },
    { name: 'System Logs', href: '/logs', icon: FileText },
    { name: 'Contact Settings', href: '/contact-settings', icon: Phone },
    { name: 'Site Settings', href: '/settings', icon: Settings },
];

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { profile, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-dark-950">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-accent-900/90 backdrop-blur border-b border-accent-800/50">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-accent-800/50 rounded-lg"
                    >
                        <Menu className="w-6 h-6 text-white" />
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Stachbit" className="w-8 h-8 rounded-lg object-contain" />
                        <span className="text-lg font-bold text-white">Stachbit Admin</span>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-accent-900 to-dark-900 border-r border-accent-800/50 transform transition-transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-accent-800/50">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Stachbit" className="w-10 h-10 rounded-xl object-contain" />
                        <span className="text-xl font-bold text-white">Admin</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 bg-accent-800/50 rounded-lg"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-accent-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {profile?.full_name ? getInitials(profile.full_name) : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{profile?.full_name || 'Admin'}</p>
                            <p className="text-accent-300 text-sm">Administrator</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="px-4 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                    {adminLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                to={link.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-accent-500/30 text-white border border-accent-500/50'
                                    : 'text-accent-200 hover:bg-accent-800/30 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-accent-800/50">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-accent-200 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                {/* Top Bar */}
                <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-dark-800 bg-accent-900/20 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <Crown className="w-6 h-6 text-accent-400" />
                        <h1 className="text-xl font-semibold text-white">
                            {adminLinks.find((link) => link.href === location.pathname)?.name || 'Admin Panel'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-dark-400 text-sm">admin.stachbit.in</span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
