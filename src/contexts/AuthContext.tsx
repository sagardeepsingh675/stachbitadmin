import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/database.types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Direct REST API call to check admin status (bypasses potential client issues)
async function checkAdminStatusDirectly(userId: string, accessToken: string): Promise<boolean> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=role`,
            {
                method: 'GET',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('REST API error:', response.status, response.statusText);
            return false;
        }

        const data = await response.json();
        console.log('Direct API result:', data);

        if (data && data.length > 0) {
            return data[0].role === 'admin';
        }
        return false;
    } catch (err) {
        console.error('Direct API call failed:', err);
        return false;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const refreshProfile = async () => {
        if (user && session?.access_token) {
            const adminStatus = await checkAdminStatusDirectly(user.id, session.access_token);
            setIsAdmin(adminStatus);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                console.log('Initializing auth...');
                const { data: { session } } = await supabase.auth.getSession();

                if (!isMounted) return;

                console.log('Session:', session ? 'exists' : 'none');
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user && session.access_token) {
                    const adminStatus = await checkAdminStatusDirectly(session.user.id, session.access_token);
                    if (isMounted) {
                        setIsAdmin(adminStatus);
                    }
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        // Fallback timeout
        const timeout = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('Auth timeout');
                setLoading(false);
            }
        }, 8000);

        // Auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                console.log('Auth event:', event);
                setSession(session);
                setUser(session?.user ?? null);

                if (event === 'SIGNED_IN' && session?.user && session.access_token) {
                    const adminStatus = await checkAdminStatusDirectly(session.user.id, session.access_token);
                    if (isMounted) {
                        setIsAdmin(adminStatus);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    setIsAdmin(false);
                }

                setLoading(false);
            }
        );

        return () => {
            isMounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
        try {
            console.log('Signing in:', email);

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                console.error('Auth failed:', authError.message);
                return { error: authError };
            }

            if (!authData.user || !authData.session) {
                return { error: new Error('No user returned') };
            }

            console.log('Auth success, checking admin via REST API...');

            // Use direct REST API call to check admin status
            const isAdminUser = await checkAdminStatusDirectly(
                authData.user.id,
                authData.session.access_token
            );

            console.log('Admin check result:', isAdminUser);

            if (!isAdminUser) {
                console.log('Not admin, signing out');
                await supabase.auth.signOut();
                return { error: new Error('Access denied. Admin privileges required.') };
            }

            console.log('Admin verified!');
            setIsAdmin(true);
            return { error: null };

        } catch (err) {
            console.error('SignIn error:', err);
            return { error: err as Error };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                loading,
                isAdmin,
                signIn,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
