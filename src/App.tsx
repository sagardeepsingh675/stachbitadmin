import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';
import ManageSubscriptions from './pages/ManageSubscriptions';
import ManageCoupons from './pages/ManageCoupons';
import Tickets from './pages/Tickets';
import Inquiries from './pages/Inquiries';
import Portfolio from './pages/Portfolio';
import BlogManagement from './pages/BlogManagement';
import AIBlogGenerator from './pages/AIBlogGenerator';
import Analytics from './pages/Analytics';
import Emails from './pages/Emails';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import ContactSettings from './pages/ContactSettings';
import SmtpSettings from './pages/SmtpSettings';

// Components
import LoadingScreen from './components/ui/LoadingScreen';

// Admin Protected Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!user || !isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

// Guest Route Component (redirect if logged in as admin)
function GuestRoute({ children }: { children: React.ReactNode }) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (user && isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function App() {
    return (
        <Routes>
            {/* Login Route */}
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <Login />
                    </GuestRoute>
                }
            />

            {/* Protected Admin Routes */}
            <Route
                element={
                    <AdminRoute>
                        <AdminLayout />
                    </AdminRoute>
                }
            >
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<ManageUsers />} />
                <Route path="/subscriptions" element={<ManageSubscriptions />} />
                <Route path="/coupons" element={<ManageCoupons />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/inquiries" element={<Inquiries />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/blog" element={<BlogManagement />} />
                <Route path="/ai-blog" element={<AIBlogGenerator />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/emails" element={<Emails />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/contact-settings" element={<ContactSettings />} />
                <Route path="/smtp-settings" element={<SmtpSettings />} />
                <Route path="/settings" element={<Settings />} />
            </Route>

            {/* 404 Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
