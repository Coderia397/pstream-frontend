import { useEffect, useRef, useState } from 'react';
import { parseSubtitles, CaptionCueType } from '../utils/captions';
import { SubtitleService } from '../services/SubtitleService';

// Uploader/credit watermark lines that some subtitle files inject — filtered out.
const WATERMARK_RE = /\b(fixed|synced|encoded|subscene|opensubtitles|uploaded by|ripped by|corrected by)\b/i;

/**
 * Resolves the selected caption file, matches the active cue to the current
 * playback time, and keeps the <video>'s own text tracks hidden so our custom
 * overlay is the sole renderer.
 *
 * `currentCaption` (which subtitle is selected) stays owned by the player — this
 * hook only turns that selection + the clock into on-screen cue text.
 */
export function useSubtitleCues(
    videoRef: React.RefObject<HTMLVideoElement>,
    currentCaption: string | null,
    currentTime: number,
    subtitleOffset: number,
    streamUrl: string | null,
) {
    const [subtitleObjectUrl, setSubtitleObjectUrl] = useState<string | null>(null);
    const [currentCueText, setCurrentCueText] = useState<string>('');
    const [currentCueSettings, setCurrentCueSettings] = useState<CaptionCueType['settings'] | undefined>(undefined);
    const parsedCuesRef = useRef<CaptionCueType[]>([]);

    // Fetch + parse the selected caption into cues.
    useEffect(() => {
        if (!currentCaption) {
            setSubtitleObjectUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
            setCurrentCueText('');
            setCurrentCueSettings(undefined);
            parsedCuesRef.current = [];
            return;
        }
        let isMounted = true;
        const loadSubtitles = async () => {
            try {
                const text = await SubtitleService.resolveSubtitleText(currentCaption);
                if (!text || !isMounted) return;

                const cues = parseSubtitles(text).filter(cue => {
                    const raw = (cue.content || cue.text || '').replace(/<[^>]+>/g, '');
                    return !WATERMARK_RE.test(raw);
                });
                parsedCuesRef.current = cues;

                if (isMounted) {
                    const nowMs = (currentTime - subtitleOffset) * 1000;
                    const immediateCue = cues.find(c => nowMs >= c.start && nowMs <= c.end);
                    setCurrentCueText(immediateCue?.content || '');
                    setCurrentCueSettings(immediateCue?.settings);
                }

                const { convertSubtitlesToObjectUrl } = await import('../utils/captions');
                const newUrl = convertSubtitlesToObjectUrl(text);
                if (newUrl && isMounted) {
                    setSubtitleObjectUrl(prev => {
                        if (prev) URL.revokeObjectURL(prev);
                        return newUrl;
                    });
                }
            } catch (e) {
                console.error('[useSubtitleCues] Subtitle load failed', e);
            }
        };
        loadSubtitles();
        return () => {
            isMounted = false;
            setSubtitleObjectUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
        };
        // currentTime/subtitleOffset are read once for the immediate cue but must
        // not re-trigger a reload — the matcher below handles ongoing sync.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCaption]);

    // Match the active cue to the current playback time.
    useEffect(() => {
        const nowMs = (currentTime - subtitleOffset) * 1000;
        const cue = parsedCuesRef.current.find(c => nowMs >= c.start && nowMs <= c.end);
        setCurrentCueText(cue ? (cue.content || cue.text || '') : '');
        setCurrentCueSettings(cue ? cue.settings : undefined);
    }, [currentTime, subtitleOffset, subtitleObjectUrl]);

    // Keep the <video>'s own text tracks hidden — otherwise the browser renders
    // them too and you get double subtitles.
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const hideNative = () => {
            Array.from(video.textTracks).forEach(track => { track.mode = 'hidden'; });
        };
        video.addEventListener('loadedmetadata', hideNative);
        const interval = setInterval(hideNative, 1000);
        hideNative();
        return () => {
            video.removeEventListener('loadedmetadata', hideNative);
            clearInterval(interval);
        };
    }, [streamUrl, videoRef]);

    return { currentCueText, currentCueSettings, subtitleObjectUrl };
}
