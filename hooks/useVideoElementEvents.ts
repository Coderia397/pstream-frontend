import { useEffect } from 'react';

/**
 * Bridges the native <video> element's events into the player's React state.
 *
 * This is what drives the progress bar, the time labels, AND subtitle cue
 * matching (cues are matched against currentTime) — without it, currentTime
 * stays 0, the bar is frozen, and no subtitle ever shows. It also handles
 * play/pause state, buffering, periodic progress-saving, and autoplay-next.
 */
export interface VideoElementEventHandlers {
    currentTimeRef: React.MutableRefObject<number>;
    hasPlayedOnceRef: React.MutableRefObject<boolean>;
    countdownCancelledRef: React.MutableRefObject<boolean>;
    autoplayNextEpisode: boolean;
    hasNextEpisode: boolean;
    setCurrentTime: (t: number) => void;
    setDuration: (d: number) => void;
    setProgress: (p: number) => void;
    setIsVideoReady: (v: boolean) => void;
    setIsPlaying: (v: boolean) => void;
    setIsBuffering: (v: boolean) => void;
    setBufferedAmount: (v: number) => void;
    setShowAutoplayCountdown: (v: boolean) => void;
    saveProgress: (forceCloudSync?: boolean) => void;
    handleNextEpisode: () => void;
}

export function useVideoElementEvents(
    videoRef: React.RefObject<HTMLVideoElement>,
    streamUrl: string | null,
    h: VideoElementEventHandlers,
) {
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let lastSave = 0;
        const onTime = () => {
            const t = video.currentTime;
            if (isNaN(t)) return;
            h.currentTimeRef.current = t;
            h.setCurrentTime(t);
            const d = video.duration;
            if (d && !isNaN(d) && isFinite(d)) {
                h.setDuration(d);
                h.setProgress((t / d) * 100);
            }
            h.setIsVideoReady(true);
            const now = Date.now();
            if (now - lastSave > 5000) { lastSave = now; h.saveProgress(false); }
        };
        const onDurationChange = () => {
            const d = video.duration;
            if (d && !isNaN(d) && isFinite(d)) h.setDuration(d);
        };
        const onPlay = () => { h.setIsPlaying(true); h.hasPlayedOnceRef.current = true; };
        const onPauseEvt = () => { h.setIsPlaying(false); h.saveProgress(true); };
        const onWaiting = () => h.setIsBuffering(true);
        const onPlaying = () => { h.setIsBuffering(false); h.setIsVideoReady(true); };
        const onProgressEvt = () => {
            try {
                const b = video.buffered;
                if (b.length) h.setBufferedAmount(b.end(b.length - 1));
            } catch { /* buffered can throw if not ready */ }
        };
        const onEndedEvt = () => {
            h.saveProgress(true);
            if (h.autoplayNextEpisode && !h.countdownCancelledRef.current && h.hasNextEpisode) {
                h.setShowAutoplayCountdown(false);
                h.handleNextEpisode();
            }
        };

        video.addEventListener('timeupdate', onTime);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPauseEvt);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('progress', onProgressEvt);
        video.addEventListener('ended', onEndedEvt);
        return () => {
            video.removeEventListener('timeupdate', onTime);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPauseEvt);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('progress', onProgressEvt);
            video.removeEventListener('ended', onEndedEvt);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoRef, streamUrl, h.saveProgress, h.handleNextEpisode, h.autoplayNextEpisode, h.hasNextEpisode]);
}
