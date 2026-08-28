import { useEffect } from 'react';

/**
 * Global keyboard shortcuts for the video player.
 *
 * Everything the shortcuts touch is passed in explicitly, so this reads as the
 * player's keyboard contract:
 *   space / k   play-pause        f            fullscreen
 *   → / l       +10s              m            mute
 *   ← / j       -10s              n / p        next / prev episode
 *   ↑ / ↓       volume            s            toggle subtitles
 *   [ ] { }     subtitle sync     \            reset subtitle sync
 *   escape      exit FS / close
 */
export interface VideoKeyboardActions {
    videoRef: React.RefObject<HTMLVideoElement>;
    /** Shortcuts are ignored while a settings panel is open. */
    activePanel: string;
    isFullscreen: boolean;
    isPseudoFullscreen: boolean;
    isMuted: boolean;
    captions: { url: string; lang: string; label: string }[];
    currentCaption: string | null;
    subtitleOffset: number;
    hasNextEpisode: boolean;
    hasPreviousEpisode: boolean;
    userMutedRef: React.MutableRefObject<boolean>;
    onClose?: () => void;
    toggleFullscreen: () => void;
    handleNextEpisode: () => void;
    handlePreviousEpisode: () => void;
    setCurrentCaption: (url: string | null) => void;
    setSubtitleOffset: (v: number) => void;
    setVolume: (v: number) => void;
    setIsMuted: (v: boolean) => void;
    setPpRippleTrigger: (fn: (t: number) => number) => void;
    setSeekFlash: (v: { side: 'left' | 'right'; ts: number } | null) => void;
    showControls: () => void;
}

export function useVideoKeyboardShortcuts(a: VideoKeyboardActions) {
    const {
        videoRef, activePanel, isFullscreen, isPseudoFullscreen, isMuted, captions,
        currentCaption, subtitleOffset, hasNextEpisode, hasPreviousEpisode, userMutedRef,
        onClose, toggleFullscreen, handleNextEpisode, handlePreviousEpisode,
        setCurrentCaption, setSubtitleOffset, setVolume, setIsMuted,
        setPpRippleTrigger, setSeekFlash, showControls,
    } = a;

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (activePanel !== 'none') return;

            const key = e.key.toLowerCase();

            if (e.repeat && !['arrowright', 'arrowleft', 'arrowup', 'arrowdown', 'l', 'j', '[', ']', '{', '}'].includes(key)) {
                return;
            }

            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            const registeredKeys = [' ', 'k', 'l', 'j', 'arrowright', 'arrowleft', 'arrowup', 'arrowdown', 'f', 'm', 'n', 'p', 's', 'escape', '[', ']', '{', '}', '\\'];

            if (!registeredKeys.includes(key)) {
                showControls();
                return;
            }

            showControls();
            e.preventDefault();

            switch (e.key) {
                case 'Escape':
                    if (isFullscreen || isPseudoFullscreen) {
                        toggleFullscreen();
                    } else if (onClose) {
                        onClose();
                    }
                    break;
                case ' ':
                    if (videoRef.current) {
                        videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
                        setPpRippleTrigger(t => t + 1);
                    }
                    break;
                case 'ArrowRight':
                    if (videoRef.current) {
                        videoRef.current.currentTime += 10;
                    }
                    setSeekFlash({ side: 'right', ts: Date.now() });
                    setTimeout(() => setSeekFlash(null), 450);
                    break;
                case 'ArrowLeft':
                    if (videoRef.current) {
                        videoRef.current.currentTime -= 10;
                    }
                    setSeekFlash({ side: 'left', ts: Date.now() });
                    setTimeout(() => setSeekFlash(null), 450);
                    break;
                case 'ArrowUp': {
                    const currentVol = videoRef.current?.volume ?? 1;
                    const v = Math.min(1, currentVol + 0.1);
                    setVolume(v);
                    if (videoRef.current) {
                        videoRef.current.volume = v;
                        videoRef.current.muted = false;
                    }
                    if (isMuted) setIsMuted(false);
                    break;
                }
                case 'ArrowDown': {
                    const currentVol = videoRef.current?.volume ?? 1;
                    const v = Math.max(0, currentVol - 0.1);
                    setVolume(v);
                    if (videoRef.current) {
                        videoRef.current.volume = v;
                        if (v === 0) {
                            videoRef.current.muted = true;
                            setIsMuted(true);
                        } else {
                            videoRef.current.muted = false;
                            if (isMuted) setIsMuted(false);
                        }
                    }
                    break;
                }
                default:
                    switch (key) {
                        case 'k':
                            if (videoRef.current) {
                                videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
                                setPpRippleTrigger(t => t + 1);
                            }
                            break;
                        case 'l':
                            if (videoRef.current) {
                                videoRef.current.currentTime += 10;
                            }
                            setSeekFlash({ side: 'right', ts: Date.now() });
                            setTimeout(() => setSeekFlash(null), 450);
                            break;
                        case 'j':
                            if (videoRef.current) {
                                videoRef.current.currentTime -= 10;
                            }
                            setSeekFlash({ side: 'left', ts: Date.now() });
                            setTimeout(() => setSeekFlash(null), 450);
                            break;
                        case 'f':
                            toggleFullscreen();
                            break;
                        case 'm': {
                            const next = !isMuted;
                            setIsMuted(next);
                            userMutedRef.current = next;
                            if (videoRef.current) {
                                videoRef.current.muted = next;
                            }
                            break;
                        }
                        case 'n':
                            if (hasNextEpisode) handleNextEpisode();
                            break;
                        case 'p':
                            if (hasPreviousEpisode) handlePreviousEpisode();
                            break;
                        case 's':
                            if (currentCaption) {
                                setCurrentCaption(null);
                            } else if (captions.length > 0) {
                                const preferred = captions.find(c => c.lang === 'en' || c.label.toLowerCase().includes('english')) || captions[0];
                                setCurrentCaption(preferred.url);
                            }
                            break;
                        case '[': {
                            const next = parseFloat((subtitleOffset - 0.1).toFixed(1));
                            setSubtitleOffset(next);
                            break;
                        }
                        case ']': {
                            const next = parseFloat((subtitleOffset + 0.1).toFixed(1));
                            setSubtitleOffset(next);
                            break;
                        }
                        case '{': {
                            const next = parseFloat((subtitleOffset - 1.0).toFixed(1));
                            setSubtitleOffset(next);
                            break;
                        }
                        case '}': {
                            const next = parseFloat((subtitleOffset + 1.0).toFixed(1));
                            setSubtitleOffset(next);
                            break;
                        }
                        case '\\':
                            setSubtitleOffset(0);
                            break;
                    }
                    break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [activePanel, onClose, hasNextEpisode, handleNextEpisode, hasPreviousEpisode, handlePreviousEpisode, isFullscreen, isPseudoFullscreen, toggleFullscreen, captions, currentCaption, showControls, isMuted, subtitleOffset, setSubtitleOffset, videoRef, setCurrentCaption, setVolume, setIsMuted, setPpRippleTrigger, setSeekFlash, userMutedRef]);
}
