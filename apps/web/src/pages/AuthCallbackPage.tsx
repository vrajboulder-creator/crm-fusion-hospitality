/**
 * OAuth callback page — handles redirect from Microsoft/Supabase OAuth flow.
 * Exchanges the Supabase session for the app's own JWT session.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api-client';
import { useAuthStore } from '../store/auth.store';

interface OAuthCallbackResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      orgId: string;
    };
    expiresAt: string;
  };
}

interface MeResponse {
  success: boolean;
  data: { user: { permissions: string[] } };
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !data.session) {
          setError('Microsoft sign-in failed. Please try again.');
          return;
        }

        const res = await api.post<OAuthCallbackResponse>('/auth/oauth-callback', {
          access_token: data.session.access_token,
          provider: 'azure',
        });

        const me = await api.get<MeResponse>('/auth/me');

        setUser({
          ...res.data.user,
          permissions: me.data.user.permissions,
        });

        navigate('/dashboard', { replace: true });
      } catch {
        setError('Failed to complete sign-in. Your account may not be provisioned yet.');
      }
    }

    handleCallback();
  }, [navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="card p-6">
            <div className="px-3 py-2 text-sm text-danger-600 bg-danger-50 rounded-lg border border-danger-100 mb-4">
              {error}
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="btn-primary w-full justify-center py-2.5"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4" />
        <p className="text-sm text-gray-500">Completing sign-in...</p>
      </div>
    </div>
  );
}
