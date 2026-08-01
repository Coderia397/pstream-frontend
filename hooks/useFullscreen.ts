import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Fullscreen + orientation for the video player.
 *
 * iOS Safari cannot fullscreen an arbitrary element, and the only "fullscreen"
 * it offers for a <video> is the NATIVE player (webkitEnterFullscreen), which
 * throws away our custom controls and subtitle overlay. So on iOS we use
 * PSEUDO-fullscreen (a fixed-inset container) to keep our own UI. Android and
 * desktop use the real Fullscreen API on the container plus a landscape lock.
 */

function lockLandscape() {
    try { (screen.orientation as any)?.lock?.('landscape').catch(() => {}); } catch { /* iOS: unsupported */ }
}
function unlockOrientation() {
    try { (screen.orientation as any)?.unlock?.(); } catch { /* unsupported */ }
}
// True only when the CONTAINER can go real-fullscreen (Android/desktop).
function containerSupportsFullscreen(el: any): boolean {
    return !!(el && (el.requestFullscreen || el.webkitRequestFullscreen));
}

export interface FullscreenControls {
    isFullscreen: boolean;
    isPseudoFullscreen: boolean;
    toggleFullscreen: () => void;
}

export function useFullscreen(
    containerRef: React.RefObject<HTMLElement>,
    isMobile: boolean,
): FullscreenControls {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
    const hasAutoFullscreenedRef = useRef(false);

    // One entry point. Real fullscreen where the container supports it (with a
    // landscape lock on mobile); pseudo-fullscreen everywhere else (iOS) so the
    // custom controls + subtitle overlay survive. isFullscreen for real FS is
    // driven by the fullscreenchange handler below — we don't set it by hand,
    // which is what caused the old iPhone double-state bug.
    const enterFullscreen = useCallback(() => {
        const el = containerRef.current as any;
        if (!el) return;
        if (el.requestFullscreen) {
            el.requestFullscreen()
                .then(() => { if (isMobile) lockLandscape(); })
                .catch(() => setIsPseudoFullscreen(true)); // denied → fall back to pseudo
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
            if (isMobile) lockLandscape();
        } else {
            // iOS / no element fullscreen → pseudo-fullscreen keeps our UI.
            // (Never videoRef.webkitEnterFullscreen — that hands off to the
            // native player and drops our controls + subtitles.)
            setIsPseudoFullscreen(true);
        }
    }, [containerRef, isMobile]);

    const exitFullscreen = useCallback(() => {
        const doc = document as any;
        if (doc.fullscreenElement || doc.webkitFullscreenElement) {
            try {
                const r = doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.();
                r?.catch?.(() => {});
            } catch { /* ignore */ }
        }
        setIsFullscreen(false);
        setIsPseudoFullscreen(false);
        unlockOrientation();
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (isFullscreen || isPseudoFullscreen) exitFullscreen();
        else enterFullscreen();
    }, [isFullscreen, isPseudoFullscreen, enterFullscreen, exitFullscreen]);

    // Auto-fullscreen immediately on mount on mobile (iOS & Android).
    useEffect(() => {
        if (!isMobile) return;
        const timer = setTimeout(() => {
            if (hasAutoFullscreenedRef.current) return;
            hasAutoFullscreenedRef.current = true;
            const el = containerRef.current as any;
            if (el) {
                if (!containerSupportsFullscreen(el)) {
                    setIsPseudoFullscreen(true);
                } else {
                    enterFullscreen();
                }
            }
        }, 50);
        return () => {
            clearTimeout(timer);
            unlockOrientation();
        };
    }, [isMobile, containerRef, enterFullscreen]);

    // Keep isFullscreen in sync with real fullscreen changes (incl. the OS
    // dropping us out via a back/swipe gesture), and release the landscape lock
    // whenever we leave real fullscreen.
    useEffect(() => {
        const handleFsChange = () => {
            const doc = document as any;
            const fs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
            setIsFullscreen(fs);
            if (!fs) unlockOrientation();
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        document.addEventListener('mozfullscreenchange', handleFsChange);
        document.addEventListener('MSFullscreenChange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
            document.removeEventListener('mozfullscreenchange', handleFsChange);
            document.removeEventListener('MSFullscreenChange', handleFsChange);
        };
    }, []);

    return { isFullscreen, isPseudoFullscreen, toggleFullscreen };
}
