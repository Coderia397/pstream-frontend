import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Cloudflare Turnstile widget for the signup forms.
 *
 * WHY: bot signups with fake addresses generate bounced confirmation emails,
 * which count against the Supabase project's sending reputation — that is what
 * triggered the deliverability warning. Email-shape validation only stops human
 * typos; a script posting straight at the auth endpoint sails past it.
 *
 * The token is verified by SUPABASE, not by us: it is passed to signUp() as
 * options.captchaToken, and Supabase calls Cloudflare's siteverify server-side
 * with the secret configured in its dashboard. So there is no backend to add
 * here, and the secret never touches this codebase.
 *
 * The sitekey is public by design — it is meant to be visible in page source,
 * which is why shipping it in the bundle via VITE_ is fine (unlike the API keys
 * that had to be moved server-side).
 *
 * If VITE_TURNSTILE_SITEKEY is unset the component renders nothing and reports
 * no token, so signup keeps working exactly as before. That makes this safe to
 * deploy ahead of the Supabase-side configuration.
 */

const SITEKEY: string = (import.meta as any).env?.VITE_TURNSTILE_SITEKEY || '';

export const turnstileEnabled = (): boolean => SITEKEY.length > 0;

interface TurnstileProps {
    /** Called with the solved token, or '' when it expires / is reset. */
    onToken: (token: string) => void;
    /** Stable label for this surface, validated by Supabase. */
    action?: string;
    /** Exposes a reset function so the caller can re-arm after a failed submit. */
    resetRef?: React.MutableRefObject<(() => void) | null>;
    theme?: 'auto' | 'light' | 'dark';
}

declare global {
    interface Window {
        turnstile?: {
            render: (el: HTMLElement, opts: Record<string, unknown>) => string;
            reset: (id?: string) => void;
            remove: (id?: string) => void;
        };
        onloadTurnstileCallback?: () => void;
    }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Loads api.js once for the whole app; repeat callers await the same promise. */
let scriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
    if (window.turnstile) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('turnstile script failed')));
            return;
        }
        const s = document.createElement('script');
        s.id = SCRIPT_ID;
        s.src = SCRIPT_SRC;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('turnstile script failed'));
        document.head.appendChild(s);
    });
    return scriptPromise;
}

const Turnstile: React.FC<TurnstileProps> = ({ onToken, action = 'signup', resetRef, theme = 'dark' }) => {
    const holderRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    // Keep the latest callback without re-rendering the widget when it changes.
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    const reset = useCallback(() => {
        // Turnstile tokens are single-use: once Supabase redeems one (or the
        // attempt fails) the widget must be re-armed or the next submit sends a
        // spent token and is rejected.
        if (widgetIdRef.current && window.turnstile) {
            try { window.turnstile.reset(widgetIdRef.current); } catch { /* already gone */ }
        }
        onTokenRef.current('');
    }, []);

    if (resetRef) resetRef.current = reset;

    useEffect(() => {
        if (!SITEKEY || !holderRef.current) return;
        let cancelled = false;

        loadTurnstileScript()
            .then(() => {
                if (cancelled || !holderRef.current || !window.turnstile) return;
                widgetIdRef.current = window.turnstile.render(holderRef.current, {
                    sitekey: SITEKEY,
                    action,
                    theme,
                    callback: (token: string) => onTokenRef.current(token),
                    'expired-callback': () => onTokenRef.current(''),
                    'error-callback': () => onTokenRef.current(''),
                });
            })
            .catch(() => {
                // Network blocked / script unreachable. Leave the token empty —
                // the caller decides whether to allow the submit through.
                if (!cancelled) onTokenRef.current('');
            });

        return () => {
            cancelled = true;
            if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.remove(widgetIdRef.current); } catch { /* already gone */ }
            }
            widgetIdRef.current = null;
        };
    }, [action, theme]);

    if (!SITEKEY) return null;
    return <div ref={holderRef} className="flex justify-center my-3" />;
};

export default Turnstile;
