import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';
import { validateSignupEmail } from '../utils/emailValidation';
import Turnstile, { turnstileEnabled } from './Turnstile';
import pstreamLogo from '../assets/logos/pstream-logo.svg';

export const LoginWall: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Turnstile proves a human is signing up; Supabase verifies the token.
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaResetRef = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  const handleResend = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
      if (error) throw error;
      setSuccessMsg(t('auth.resendSuccess', { defaultValue: 'Confirmation email resent. Please check your inbox.' }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setShowResend(false);

    try {
      if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: window.location.origin + '/',
        });
        if (error) throw error;
        setSuccessMsg(t('auth.resetLinkSent', { defaultValue: 'Password reset link sent! Check your email.' }));
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setShowResend(true);
          }
          throw error;
        }
      } else {

        // Screen the address before it becomes a send — bounced confirmation
        // emails count against the project's sending reputation.
        const check = validateSignupEmail(email);
        if (!check.valid) {
          setError(check.reason || 'Please enter a valid email address.');
          setLoading(false);
          return;
        }

        // Inert until a sitekey is configured.
        if (turnstileEnabled() && !captchaToken) {
          setError(t('auth.captchaRequired', { defaultValue: 'Please complete the verification.' }));
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: window.location.origin + '/',
            // Supabase calls Cloudflare's siteverify with this, server-side.
            ...(captchaToken ? { captchaToken } : {})
          }
        });
        // Token is single-use and now spent — re-arm before any retry.
        captchaResetRef.current?.();
        setCaptchaToken('');
        if (error) throw error;
        // Auto-login or show success message for email verification if required
      }
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
          <h2 className="text-3xl font-black tracking-tight">{mode === 'login' ? t('auth.welcome') : mode === 'signup' ? t('auth.createAccount') : t('auth.resetPassword', { defaultValue: 'Reset Password' })}</h2>
          <p className="text-white/50 mt-2 text-sm">{t('auth.loginRequired', { defaultValue: 'You must be logged in to access the library.' })}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">{t('auth.emailPlaceholder', { defaultValue: 'Email' })}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
          {mode !== 'forgot_password' && (
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">{t('auth.passwordPlaceholder', { defaultValue: 'Password' })}</label>
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
          )}

          {/* Signup only — signing in sends no email. Renders nothing until a
              sitekey is configured. */}
          {mode === 'signup' && (
            <Turnstile
              action="signup"
              onToken={setCaptchaToken}
              resetRef={captchaResetRef}
            />
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm flex flex-col gap-2">
              <span>{error}</span>
              {showResend && (
                <button type="button" onClick={handleResend} className="text-red-400 underline font-semibold text-left">
                  {t('auth.resendEmail', { defaultValue: 'Resend confirmation email' })}
                </button>
              )}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-lg text-sm">
              {successMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors mt-6"
          >
            {loading ? t('auth.redirecting') : mode === 'login' ? t('auth.signIn') : mode === 'signup' ? t('auth.createAccount') : t('auth.sendResetLink', { defaultValue: 'Send Reset Link' })}
          </button>
        </form>

                <div className="mt-6 text-center flex flex-col gap-3">
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('forgot_password'); setError(null); setSuccessMsg(null); setShowResend(false); }}
              className="text-white/60 hover:text-white text-sm transition-colors block mx-auto"
            >
              {t('auth.forgotPassword', { defaultValue: 'Forgot your password?' })}
            </button>
          )}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccessMsg(null); setShowResend(false); }}
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            {mode === 'login' ? `${t('auth.dontHaveAccount')} ${t('auth.signUpLink')}` : `${t('auth.alreadyHaveAccount')} ${t('auth.signInLink')}`}
          </button>
        </div>
      </div>
    </div>
  );
};
