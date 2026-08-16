import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';
import pstreamLogo from '../assets/logos/pstream-logo.svg';
import { useAuthStore } from '../store/useAuthStore';

export const PasswordRecoveryWall: React.FC = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const setRecoveryMode = useAuthStore(s => s.setRecoveryMode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        setRecoveryMode(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 opacity-40 bg-[url('/assets/landing-bg.png')] bg-cover bg-center mix-blend-overlay" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      
      <div className="relative z-10 bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <img src={pstreamLogo} alt="Pstream" className="h-8 mx-auto mb-6" />
          <h2 className="text-3xl font-black tracking-tight">{t('auth.updatePassword', { defaultValue: 'Update Password' })}</h2>
          <p className="text-white/50 mt-2 text-sm">{t('auth.enterNewPassword', { defaultValue: 'Please enter your new password below.' })}</p>
        </div>

        {success ? (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-lg text-center font-bold">
            {t('auth.passwordUpdated', { defaultValue: 'Password updated successfully! Redirecting...' })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">{t('auth.passwordPlaceholder', { defaultValue: 'New Password' })}</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors mt-6"
            >
              {loading ? t('auth.updating', { defaultValue: 'Updating...' }) : t('auth.updatePassword', { defaultValue: 'Update Password' })}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
