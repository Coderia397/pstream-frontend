import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Movie, Episode, InternalTrack } from '../types';
import { getSeasonDetails, getMovieDetails } from '../services/api';
import { useTranslation } from 'react-i18next';
import { useGlobalContext } from '../context/GlobalContext';
import { useSubtitleStyle } from '../hooks/useSubtitleStyle';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { useIsMobile } from '../hooks/useIsMobile';
import { SubtitleService } from '../services/SubtitleService';
import { reportStreamError } from '../services/ProviderHealthService';
import { useSkipTimestamps, SkipSegment } from '../hooks/useSkipTimestamps';
import { useHls } from '../hooks/useHls';
import { useFullscreen } from '../hooks/useFullscreen';
import { useSubtitleCues } from '../hooks/useSubtitleCues';
import { useVideoKeyboardShortcuts } from '../hooks/useVideoKeyboardShortcuts';
import { useVideoElementEvents } from '../hooks/useVideoElementEvents';
import VideoPlayerControls from './VideoPlayerControls';
import VideoPlayerSettings from './VideoPlayerSettings';
import VideoPlayerSettingsTouch from './VideoPlayerSettingsTouch';


const GIGA_BACKEND_URL = import.meta.env.VITE_GIGA_BACKEND_URL || 'https://resolver.pstream.watch';
// Hard cap on automatic re-resolves when a stream won't start, so a genuinely
// unplayable title can't hammer the resolver (and the phone hosting it).
const MAX_RESOLVE_RETRIES = 3;
const SOURCE_FAILURE_COOLDOWN_MS = 20 * 1000;

// Splits a plain-text segment by (ALL CAPS PARENS) and dims those tokens.
function renderTextWithHI(text: string, baseStyle: React.CSSProperties, keyPrefix: string): React.ReactNode[] {
    const parts = text.split(/(\([A-Z][A-Z0-9\s,!?']{1,}\))/g);
    if (parts.length === 1) {
        return Object.keys(baseStyle).length
            ? [<span key={keyPrefix} style={baseStyle}>{text}</span>]
            : [text];
    }
    return parts.map((p, i) => {
        if (!p) return null;
        const isHI = /^\([A-Z][A-Z0-9\s,!?']{1,}\)$/.test(p);
        const style: React.CSSProperties = isHI
            ? { ...baseStyle, opacity: 0.42, fontSize: '0.82em' }
            : baseStyle;
        return Object.keys(style).length
            ? <span key={`${keyPrefix}-${i}`} style={style}>{p}</span>
            : <React.Fragment key={`${keyPrefix}-${i}`}>{p}</React.Fragment>;
    }).filter(Boolean) as React.ReactNode[];
}

// Parses SRT/VTT inline tags (<i>, <b>, <u>, <font color>) into React nodes.
// Also dims (ALL CAPS PARENS) sound-effect / HI markers.
function parseSubtitleTags(text: string): React.ReactNode[] {
    const tagRegex = /(<\/?[ibuf](?: [^>]*)?>|<\/?[uU]>|<br\s*\/?>|\n)/g;
    const parts = text.split(tagRegex);
    const elements: React.ReactNode[] = [];

    let isItalic = false;
    let isBold = false;
    let isUnderline = false;
    let activeColor: string | undefined = undefined;

    parts.forEach((part, index) => {
        if (!part) return;

        const lower = part.toLowerCase();
        if (lower === '<i>') { isItalic = true; }
        else if (lower === '</i>') { isItalic = false; }
        else if (lower === '<b>') { isBold = true; }
        else if (lower === '</b>') { isBold = false; }
        else if (lower === '<u>') { isUnderline = true; }
        else if (lower === '</u>') { isUnderline = false; }
        else if (lower.startsWith('<font')) {
            const colorMatch = part.match(/color=["']?([^"'\s>]+)["']?/i);
            if (colorMatch) activeColor = colorMatch[1];
        }
        else if (lower === '</font>') { activeColor = undefined; }
        else if (lower === '<br>' || lower === '<br/>' || lower === '<br />' || part === '\n') {
            elements.push(<br key={index} />);
        }
        else {
            const baseStyle: React.CSSProperties = {
                ...(isItalic ? { fontStyle: 'italic' as const } : {}),
                ...(isBold ? { fontWeight: 'bold' as const } : {}),
                ...(isUnderline ? { textDecoration: 'underline' as const } : {}),
                ...(activeColor ? { color: activeColor } : {}),
            };
            elements.push(...renderTextWithHI(part, baseStyle, String(index)));
        }
    });

    return elements;
}

// Strip leading dash/en-dash/em-dash from a dialogue line, preserving any leading HTML tags.
function stripLeadingDash(line: string): string {
    return line.replace(/^((?:<[^>]+>)*)\s*[-–—]\s*/, '$1').trim();
}

const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'ku']);

// Top-level cue renderer: splits into lines, strips dashes, handles ♪/NAME:/HI, applies layout.
function renderCue(text: string, isDialogue: boolean): React.ReactNode {
    const normalized = text.replace(/<br\s*\/?>/gi, '\n');
    const lines = normalized.split(/\r?\n/).filter(l => l.replace(/<[^>]+>/g, '').trim());
    if (!lines.length) return null;

    return lines.map((line, i) => {
        const stripped = stripLeadingDash(line);
        const clean = stripped.replace(/<[^>]+>/g, '').trim();
        if (!clean) return null;

        const mb: React.CSSProperties = isDialogue && i < lines.length - 1
            ? { marginBottom: '0.38em' } : {};

        // ♪ Music line
        if (/[♪♫]/.test(line)) {
            return (
                <div key={i} style={{ fontStyle: 'italic', color: '#ffe599', ...mb }}>
                    {parseSubtitleTags(stripped)}
                </div>
            );
        }

        // SPEAKER NAME: text  (e.g. "DRE:", "WOMAN:", "MR. FOX:")
        const nameMatch = clean.match(/^([A-Z][A-Z. ']{1,20}):\s*/);
        if (nameMatch) {
            const rest = clean.slice(nameMatch[0].length);
            return (
                <div key={i} style={mb}>
                    <span style={{ opacity: 0.45, fontSize: '0.78em', fontWeight: 700, letterSpacing: '0.03em' }}>
                        {nameMatch[1]}:
                    </span>
                    {rest ? <> {parseSubtitleTags(rest)}</> : null}
                </div>
            );
        }

        return <div key={i} style={mb}>{parseSubtitleTags(stripped)}</div>;
    });
}

interface VideoPlayerProps {
    movie: Movie;
    season?: number;
    episode?: number;
    resumeTime?: number;
    onClose?: () => void;
    onEpisodeChange?: (season: number, episode: number) => void;
}

// ─── Fullscreen + orientation helpers ───────────────────────────────────────
const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, season = 1, episode = 1, resumeTime = 0, onClose, onEpisodeChange }) => {
    const { t } = useTranslation();
    const { settings, updateEpisodeProgress, updateVideoState, addToHistory } = useGlobalContext();
    const isMobile = useIsMobile();
    const { overlayStyle } = useSubtitleStyle();
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    const videoRef = useRef<HTMLVideoElement>(null);
    const estimatedDurationRef = useRef(mediaType === 'tv' ? 2700 : 7200);
    const containerRef = useRef<HTMLDivElement>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedTimeRef = useRef<number>(0);
    const wasInFullscreenRef = useRef(false);
    const [showFullscreenRestore, setShowFullscreenRestore] = useState(false);
    const [bufferedAmount, setBufferedAmount] = useState<number>(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const currentTimeRef = useRef(0);

    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(() => {
        try {
            const stored = parseFloat(localStorage.getItem('pstream_vol') || '1');
            return isFinite(stored) && stored >= 0.05 && stored <= 1 ? stored : 1;
        } catch { return 1; }
    });
    const [isMuted, setIsMuted] = useState(false); 
    const [showUI, setShowUI] = useState(true);
    const showUIRef = useRef(true);
    useEffect(() => { showUIRef.current = showUI; }, [showUI]);

    const [showPausedOverlay, setShowPausedOverlay] = useState(false);
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!isPlaying && !showUI) {
            timer = setTimeout(() => setShowPausedOverlay(true), 2500);
        } else {
            setShowPausedOverlay(false);
        }
        return () => clearTimeout(timer);
    }, [isPlaying, showUI]);

    const { isFullscreen, isPseudoFullscreen, toggleFullscreen, upgradeNativeFullscreen } = useFullscreen(containerRef, isMobile);
    const [isVideoReady, setIsVideoReady] = useState(false); 
    const [videoFit, setVideoFit] = useState<'contain' | 'cover'>('contain');
    const hasPlayedOnceRef = useRef(false); 
    const volumeRef = useRef((() => {
        try {
            const stored = parseFloat(localStorage.getItem('pstream_vol') || '1');
            return isFinite(stored) && stored >= 0.05 && stored <= 1 ? stored : 1;
        } catch { return 1; }
    })()); 
    useEffect(() => {
        volumeRef.current = volume;
        try {
            if (volume > 0) {
                localStorage.setItem('pstream_vol', String(volume));
            }
        } catch { }
    }, [volume]);
    const userMutedRef = useRef(false); 
    const [loadingMessage, setLoadingMessage] = useState('Finding stream...');
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [streamReferer, setStreamReferer] = useState<string | null>(null);
    const [allSources, setAllSources] = useState<any[]>([]);
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [isStreamM3U8, setIsStreamM3U8] = useState<boolean>(true);
    
    const retryCountRef = useRef(0);
    // Bumped to force a re-resolve; forceResolveRef adds ?force=1 so the
    // backend busts its Redis entry instead of handing back the dead URL.
    const [resolveNonce, setResolveNonce] = useState(0);
    const forceResolveRef = useRef(false);
    const sourceFailureCooldownRef = useRef<Map<string, number>>(new Map());
    const [error, setError] = useState<string | null>(null);

    const [internalTracks, setInternalTracks] = useState<InternalTrack[]>([]);
    const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<number | null>(null);
    const [selectedSubtitleTrackId, setSelectedSubtitleTrackId] = useState<number | null>(null);

    useEffect(() => {
        if (streamUrl) {
            console.info(`[VideoPlayer] 🎬 New source loaded: ${new URL(streamUrl).hostname}`);
        }
    }, [streamUrl]);

    const [currentEpisode, setCurrentEpisode] = useState(episode);
    const [playingSeasonNumber, setPlayingSeasonNumber] = useState(season);
    const [browsedSeasonNumber, setBrowsedSeasonNumber] = useState(season || 1);
    const [ppRippleTrigger, setPpRippleTrigger] = useState(0);
    const [seekFlash, setSeekFlash] = useState<{ side: 'left' | 'right'; ts: number } | null>(null);
    const [seasonList, setSeasonList] = useState<number[]>([]);
    const [currentSeasonEpisodes, setCurrentSeasonEpisodes] = useState<Episode[]>([]);

    const currentEpisodeRef = useRef(currentEpisode);
    const playingSeasonNumberRef = useRef(playingSeasonNumber);
    const mediaTypeRef = useRef(mediaType);
    const movieRef = useRef(movie);
    const durationRef = useRef(duration);

    useEffect(() => { currentEpisodeRef.current = currentEpisode; }, [currentEpisode]);
    useEffect(() => { playingSeasonNumberRef.current = playingSeasonNumber; }, [playingSeasonNumber]);
    useEffect(() => { mediaTypeRef.current = mediaType; }, [mediaType]);
    useEffect(() => { movieRef.current = movie; }, [movie]);
    useEffect(() => { durationRef.current = duration; }, [duration]);

    const saveProgressImmediately = useCallback((forceCloudSync?: boolean) => {
        const time = currentTimeRef.current;
        const dur = durationRef.current > 0 ? durationRef.current : estimatedDurationRef.current;
        const mv = movieRef.current;
        const mType = mediaTypeRef.current;
        const seasonNum = playingSeasonNumberRef.current;
        const epNum = currentEpisodeRef.current;

        if (time <= 0 || isNaN(time)) return;
        if (time === lastSavedTimeRef.current) return;

        lastSavedTimeRef.current = time;
        addToHistory(mv);
        if (mType === 'tv') {
            updateEpisodeProgress(mv, seasonNum, epNum, time, dur, forceCloudSync);
        } else {
            updateVideoState(mv, time, undefined, dur, forceCloudSync);
        }
        console.info(`[VideoPlayer] Progress saved immediately: ${time}s / ${dur}s (forceCloud: ${!!forceCloudSync})`);
    }, [addToHistory, updateEpisodeProgress, updateVideoState]);

    // App Switching / Tab Inactive: Auto-pause and save current timestamp to watch history
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                    saveProgressImmediately(true);
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [saveProgressImmediately]);

    useEffect(() => {
        retryCountRef.current = 0;
        sourceFailureCooldownRef.current.clear();
        hasPlayedOnceRef.current = false; 
    }, [movie.id, mediaType, playingSeasonNumber, currentEpisode]);

    // SAFETY LOCK 2: Prevents stale props from wrapper resetting user progress
    const lastSyncedUrlRef = useRef({ s: season, e: episode });

    // Keep a stable ref so the URL-sync effect below never re-fires just because
    // the parent passed a new inline arrow function on each render (which would
    // cause an infinite setSearchParams → re-render → new fn ref → loop).
    const onEpisodeChangeRef = useRef(onEpisodeChange);
    onEpisodeChangeRef.current = onEpisodeChange;

    useEffect(() => {
        if (mediaType !== 'tv') return;

        onEpisodeChangeRef.current?.(playingSeasonNumber, currentEpisode);
        lastSyncedUrlRef.current = { s: playingSeasonNumber, e: currentEpisode };
    }, [mediaType, playingSeasonNumber, currentEpisode]);

    const [activePanel, setActivePanel] = useState<'none' | 'episodes' | 'seasons' | 'audioSubtitles' | 'quality' | 'servers' | 'playback'>('none');

    const [captions, setCaptions] = useState<{ id: string; label: string; url: string; lang: string; duration?: number }[]>([]);
    const [currentCaption, setCurrentCaption] = useState<string | null>(null);
    const [subtitleOffset, setSubtitleOffset] = useState(0);
    const { currentCueText, currentCueSettings, subtitleObjectUrl } =
        useSubtitleCues(videoRef, currentCaption, currentTime, subtitleOffset, streamUrl);

    useEffect(() => {
        const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '';
        (window as any).__video_backdrop = backdrop;
    }, [movie.id]);

    const nextEpisodeInfo = useMemo<{ episode: Episode; season: number } | null>(() => {
        if (mediaType !== 'tv') return null;
        if (currentSeasonEpisodes.length === 0 || currentSeasonEpisodes[0].season_number !== playingSeasonNumber) {
            return null;
        }
        const currentIdx = currentSeasonEpisodes.findIndex(ep => ep.episode_number === currentEpisode);
        if (currentIdx !== -1 && currentIdx < currentSeasonEpisodes.length - 1) {
            return { episode: currentSeasonEpisodes[currentIdx + 1]!, season: playingSeasonNumber };
        }
        const nextSeason = seasonList.find(s => s > playingSeasonNumber);
        if (nextSeason !== undefined) {
            return {
                episode: { id: -1, episode_number: 1, name: 'Next Season', season_number: nextSeason } as Episode,
                season: nextSeason,
            };
        }
        return null;
    }, [mediaType, currentSeasonEpisodes, currentEpisode, playingSeasonNumber, seasonList]);

    const previousEpisodeInfo = useMemo<{ episode: Episode; season: number } | null>(() => {
        if (mediaType !== 'tv') return null;
        if (currentSeasonEpisodes.length === 0 || currentSeasonEpisodes[0].season_number !== playingSeasonNumber) {
            return null;
        }
        const currentIdx = currentSeasonEpisodes.findIndex(ep => ep.episode_number === currentEpisode);
        if (currentIdx > 0) {
            return { episode: currentSeasonEpisodes[currentIdx - 1]!, season: playingSeasonNumber };
        }
        const prevSeason = [...seasonList].reverse().find(s => s < playingSeasonNumber);
        if (prevSeason !== undefined) {
            return {
                episode: { id: -1, episode_number: 99, name: 'Previous Season', season_number: prevSeason } as Episode,
                season: prevSeason,
            };
        }
        return null;
    }, [mediaType, currentSeasonEpisodes, currentEpisode, playingSeasonNumber, seasonList]);

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        const showTitle = movie.title || movie.name || '';
        const epName = currentSeasonEpisodes.find(ep => ep.episode_number === currentEpisode)?.name || '';

        const notificationTitle = showTitle;
        const notificationArtist = mediaType === 'tv' && epName
            ? `${t('player.episodeCode', { season: playingSeasonNumber, episode: currentEpisode })} — ${epName}`
            : (movie.release_date || movie.first_air_date || '').slice(0, 4) || 'Pstream';
        const notificationAlbum = mediaType === 'tv'
            ? `${t('player.season')} ${playingSeasonNumber}`
            : t('common.movie');

        const backdropUrl = movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
            : '';

        const artwork: MediaImage[] = backdropUrl
            ? [
                { src: backdropUrl, sizes: '1280x720', type: 'image/jpeg' },
            ]
            : [];

        navigator.mediaSession.metadata = new MediaMetadata({
            title: notificationTitle,
            artist: notificationArtist,
            album: notificationAlbum,
            artwork,
        });

        navigator.mediaSession.setActionHandler('play', () => { setIsPlaying(true); });
        navigator.mediaSession.setActionHandler('pause', () => { setIsPlaying(false); });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const offset = details.seekOffset || 10;
            const target = Math.max(0, currentTimeRef.current - offset);
            currentTimeRef.current = target;
            if (videoRef.current) videoRef.current.currentTime = target;
            setCurrentTime(target);
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const offset = details.seekOffset || 10;
            const target = Math.min(duration || estimatedDurationRef.current, currentTimeRef.current + offset);
            currentTimeRef.current = target;
            if (videoRef.current) videoRef.current.currentTime = target;
            setCurrentTime(target);
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime != null) {
                const target = details.seekTime;
                currentTimeRef.current = target;
                if (videoRef.current) videoRef.current.currentTime = target;
                setCurrentTime(target);
            }
        });

        if (mediaType === 'tv') {
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                if (nextEpisodeInfo) {
                    const ep = nextEpisodeInfo.episode;
                    setCurrentEpisode(ep.episode_number);
                    if (nextEpisodeInfo.season !== playingSeasonNumber) {
                        setPlayingSeasonNumber(nextEpisodeInfo.season);
                    }
                    setStreamUrl(null);
                    setIsBuffering(true);
                    setActivePanel('none');
                }
            });
        } else {
            navigator.mediaSession.setActionHandler('nexttrack', null);
        }
        navigator.mediaSession.setActionHandler('previoustrack', null);

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('play', null);
                navigator.mediaSession.setActionHandler('pause', null);
                navigator.mediaSession.setActionHandler('seekbackward', null);
                navigator.mediaSession.setActionHandler('seekforward', null);
                navigator.mediaSession.setActionHandler('seekto', null);
                navigator.mediaSession.setActionHandler('nexttrack', null);
                navigator.mediaSession.setActionHandler('previoustrack', null);
            }
        };
    }, [movie, mediaType, playingSeasonNumber, currentEpisode, currentSeasonEpisodes, nextEpisodeInfo, duration]);

    useEffect(() => {
        if (!('mediaSession' in navigator) || !navigator.mediaSession.metadata) return;
        if (!duration || isNaN(duration)) return;
        try {
            navigator.mediaSession.setPositionState({
                duration: duration,
                playbackRate: isPlaying ? 1 : 0,
                position: currentTime,
            });
        } catch (_) { }
    }, [currentTime, duration, isPlaying]);


    // Dialogue = 2+ lines where at least one starts with a dash (multi-speaker layout)
    const isDialogue = useMemo(() => {
        if (!currentCueText) return false;
        const lines = currentCueText.split(/\r?\n|<br\s*\/?>/i);
        if (lines.length < 2) return false;
        return lines.some(line => {
            const clean = line.replace(/<\/?[^>]+(>|$)/g, '').trim();
            return /^[-–—]/.test(clean);
        });
    }, [currentCueText]);

    const currentSubtitleLang = useMemo(
        () => captions.find(c => c.url === currentCaption)?.lang ?? '',
        [captions, currentCaption]
    );
    const isRTL = RTL_LANGS.has(currentSubtitleLang);

    // ——— Manual Autoplay State ———
    const [showAutoplayCountdown, setShowAutoplayCountdown] = useState(false);
    const countdownCancelledRef = useRef(false);

    const [qualityLevels, setQualityLevels] = useState<{ height: number; bitrate: number; level: number }[]>([]);
    const [currentQualityLevel, setCurrentQualityLevel] = useState<number>(-1);
    const [audioTracks, setAudioTracks] = useState<{ id: number; name: string; lang: string }[]>([]);
    const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(-1);

    const { segments: skipSegments } = useSkipTimestamps(movie.imdb_id, mediaType as 'movie' | 'tv', playingSeasonNumber, currentEpisode);

    const handleSkipSegment = useCallback((segment: SkipSegment) => {
        if (videoRef.current) {
            videoRef.current.currentTime = segment.end;
        }
    }, []);

    const title = movie.title || movie.name || '';
    const currentEpisodeName = currentSeasonEpisodes.find(ep => ep.episode_number === currentEpisode)?.name || '';

    useTouchGestures(containerRef, {
        onSingleTap: () => {
            lastTouchTimeRef.current = Date.now();
            upgradeNativeFullscreen();

            if (activePanel !== 'none') {
                setActivePanel('none');
                return;
            }

            if (!showUIRef.current) {
                showControls();
            } else {
                setShowUI(false);
                if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            }
        },
    });

    const applyStreamResult = useCallback((sources: any[], subtitles: any[], globalReferer?: string | null) => {
        if (!sources || sources.length === 0) return;
        setError(null);

        setAllSources(sources);

        let startIndex = 0;
        for (let i = 0; i < sources.length; i++) {
            const candidate = sources[i];
            const sourceKey = `${candidate.providerId || candidate.provider || 'unknown'}::${candidate.url || ''}`;
            const blockedUntil = sourceFailureCooldownRef.current.get(sourceKey) || 0;
            if (blockedUntil <= Date.now()) {
                startIndex = i;
                break;
            }
            if (i === sources.length - 1) {
                console.warn('[VideoPlayer] All fresh sources are in cooldown — clearing cooldowns and retrying from 0');
                sourceFailureCooldownRef.current.clear();
                startIndex = 0;
            }
        }
        if (startIndex > 0) {
            console.log(`[VideoPlayer] ⚠️ Skipping ${startIndex} cooldown source(s), starting at index ${startIndex}`);
        }
        setCurrentSourceIndex(startIndex);
        const hlsSource = sources[startIndex];

        const activeReferer = hlsSource.referer || globalReferer || '';
        let finalUrl = hlsSource.url;

        if (hlsSource.directManifest) {
            const blob = new Blob([hlsSource.directManifest], { type: 'application/vnd.apple.mpegurl' });
            finalUrl = URL.createObjectURL(blob);
        } else {
            finalUrl = hlsSource.url;
            console.log(`[VideoPlayer] ⚡ Direct stream: ${finalUrl.substring(0, 60)}...`);
        }

        setStreamUrl(finalUrl);
        setIsStreamM3U8(!!hlsSource.isM3U8);
        setStreamReferer(activeReferer || null);
        setLoadingMessage('Initializing...');

        // Subtitles are sourced solely from SubtitleService (OpenSubtitles /
        // SubDL) in the effect below — those are CORS-open and fetchable by the
        // browser. The resolver's own `subtitles` (e.g. LookMovie on
        // lmscript.xyz) send no CORS header, so a <track>/fetch of them fails in
        // the browser; we intentionally ignore them here to avoid dead tracks.
        void subtitles;
    }, [settings.subtitleLanguage, settings.showSubtitles]);

    const handleSourceChange = useCallback((index: number) => {
        if (!allSources[index]) return;
        const candidate = allSources[index];
        const sourceKey = `${candidate.providerId || candidate.provider || 'unknown'}::${candidate.url || ''}`;
        const blockedUntil = sourceFailureCooldownRef.current.get(sourceKey) || 0;
        if (blockedUntil > Date.now()) {
            const nextIndex = index + 1;
            if (allSources[nextIndex]) {
                handleSourceChange(nextIndex);
            }
            return;
        }
        console.log(`[VideoPlayer] 🔄 Manual server change to: ${candidate.provider}`);
        setCurrentSourceIndex(index);
        setError(null);
        setIsBuffering(true);
        setLoadingMessage('Switching source...');

        const activeReferer = candidate.referer || '';
        let finalUrl = candidate.url;
        console.log(`[VideoPlayer] ⚡ Direct stream: ${finalUrl.substring(0, 60)}...`);
        setStreamUrl(finalUrl);
        setIsStreamM3U8(!!candidate.isM3U8);
        setStreamReferer(activeReferer || null);
    }, [allSources]);

    const handleEpisodeSelect = useCallback(async (ep: Episode, seasonNum?: number, episodes?: Episode[]) => {
        setStreamUrl(null);
        setIsBuffering(true);
        setActivePanel('none');
        
        const targetSeason = seasonNum ?? ep.season_number;
        if (targetSeason && targetSeason !== playingSeasonNumber) {
            setPlayingSeasonNumber(targetSeason);
            setBrowsedSeasonNumber(targetSeason);
            getSeasonDetails(String(movie.id), targetSeason).then(data => {
                if (data?.episodes) setCurrentSeasonEpisodes(data.episodes);
            }).catch(() => { });
        }
        if (episodes) setCurrentSeasonEpisodes(episodes);
        setCurrentEpisode(ep.episode_number);
    }, [playingSeasonNumber, movie.id]);

    const handleNextEpisode = useCallback(() => {
        if (!nextEpisodeInfo) return;
        handleEpisodeSelect(nextEpisodeInfo.episode, nextEpisodeInfo.season);
    }, [nextEpisodeInfo, handleEpisodeSelect]);

    const handlePreviousEpisode = useCallback(() => {
        if (!previousEpisodeInfo) return;

        if (previousEpisodeInfo.episode.id === -1) {
            setStreamUrl(null);
            setIsBuffering(true);
            setActivePanel('none');
            const targetSeason = previousEpisodeInfo.season;
            setPlayingSeasonNumber(targetSeason);
            setBrowsedSeasonNumber(targetSeason);
            getSeasonDetails(String(movie.id), targetSeason).then(data => {
                if (data?.episodes && data.episodes.length > 0) {
                    setCurrentSeasonEpisodes(data.episodes);
                    const lastEp = data.episodes[data.episodes.length - 1]!;
                    setCurrentEpisode(lastEp.episode_number);
                }
            }).catch(() => { });
        } else {
            handleEpisodeSelect(previousEpisodeInfo.episode, previousEpisodeInfo.season);
        }
    }, [previousEpisodeInfo, handleEpisodeSelect, movie.id]);

    // Apply prop sync ONLY if the intended state has actually changed from the parent
    useEffect(() => {
        if (season === lastSyncedUrlRef.current.s && episode === lastSyncedUrlRef.current.e) return;
        
        setPlayingSeasonNumber(season);
        setCurrentEpisode(episode);
        lastSyncedUrlRef.current = { s: season, e: episode };
    }, [season, episode]);

    useEffect(() => {
        setIsBuffering(false); 
        setError(null);
        setStreamUrl(null);
        setAllSources([]);
        setCurrentSourceIndex(0);
        setLoadingMessage('Loading player...');
        setCaptions([]);
        setCurrentCaption(null);
        hasPlayedOnceRef.current = false;
        setCurrentTime(0);
        setDuration(0);
        setProgress(0);
        setBufferedAmount(0);
        
        countdownCancelledRef.current = false;
        setShowAutoplayCountdown(false);
        setIsVideoReady(false); // Prevent ghost popup during next-ep load
    }, [movie.id, mediaType, playingSeasonNumber, currentEpisode]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !streamUrl) return;
        if (volumeRef.current > 0 && volumeRef.current <= 1) {
            video.volume = volumeRef.current;
        }
    }, [streamUrl]);

    // ─── STEP ONE: resolve a playable stream from the Giga backend ──────────
    // This is the call that was missing entirely — the player previously only
    // ever rendered a third-party embed. The backend races its extractors and
    // returns raw HLS/MP4 sources, which applyStreamResult hands to useHls.
    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        (async () => {
            setError(null);
            setIsBuffering(true);
            setLoadingMessage('Finding stream...');

            const type = mediaType === 'tv' ? 'tv' : 'movie';
            const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);

            const params = new URLSearchParams({
                tmdbId: String(movie.id),
                type,
                title: movie.title || movie.name || '',
            });
            if (year) params.set('year', year);
            if (movie.imdb_id) params.set('imdbId', movie.imdb_id);
            if (type === 'tv') {
                params.set('season', String(playingSeasonNumber));
                params.set('episode', String(currentEpisode));
            }
            if (forceResolveRef.current) {
                params.set('force', '1');
                forceResolveRef.current = false;
            }

            try {
                const res = await fetch(`${GIGA_BACKEND_URL}/api/stream?${params.toString()}`, {
                    signal: controller.signal,
                });
                const data = await res.json();
                if (cancelled) return;

                // Embeds are dead (step zero) — only real, playable URLs count.
                const sources = (data?.sources || []).filter((s: any) => s?.url && !s.isEmbed);

                if (!data?.success || sources.length === 0) {
                    console.warn('[VideoPlayer] No playable source:', data?.error);
                    setIsBuffering(false);
                    setError(data?.error || 'No stream found. All providers are currently unavailable.');
                    return;
                }

                console.info(`[VideoPlayer] ✅ ${sources.length} source(s) via ${data.provider}`);
                applyStreamResult(sources, data.subtitles || [], data.referer);
            } catch (e: any) {
                if (cancelled || e?.name === 'AbortError') return;
                console.error('[VideoPlayer] Stream resolve failed:', e);
                setIsBuffering(false);
                setError('Could not reach the stream service. Please try again.');
            }
        })();

        return () => { cancelled = true; controller.abort(); };
    }, [movie.id, mediaType, playingSeasonNumber, currentEpisode, resolveNonce, applyStreamResult]);

    useEffect(() => {
        let cancelled = false;

        const type: 'movie' | 'tv' = mediaType === 'tv' ? 'tv' : 'movie';
        const preferredLang = settings.subtitleLanguage?.toLowerCase() || 'en';

        let expectedDurationSec = 0;
        if (mediaType === 'movie') {
            expectedDurationSec = (movie.runtime || 0) * 60;
        } else if (mediaType === 'tv') {
            const currentEpObj = currentSeasonEpisodes.find(e => e.episode_number === currentEpisode);
            expectedDurationSec = (currentEpObj?.runtime || 0) * 60;
        }
        const actualDurationSec = duration || (videoRef.current?.duration || 0);
        const targetDuration = actualDurationSec > 0 ? actualDurationSec : expectedDurationSec;

        setCaptions([]); 

        SubtitleService.getSubtitleTracks(
            String(movie.id), type,
            mediaType === 'tv' ? playingSeasonNumber : undefined,
            mediaType === 'tv' ? currentEpisode : undefined,
            preferredLang,
            movie.imdb_id
        ).then(tracks => {
            if (cancelled) return;
            if (!tracks.length) return;

            const mappedCaptions = tracks.map((sub, idx) => ({
                id: `sub-ext-${idx}`,
                label: sub.label,
                url: sub.url,
                lang: sub.lang,
                duration: sub.duration,
            }));

            if (targetDuration > 0) {
                mappedCaptions.sort((a, b) => {
                    const diffA = a.duration ? Math.abs(a.duration - targetDuration) : Infinity;
                    const diffB = b.duration ? Math.abs(b.duration - targetDuration) : Infinity;

                    const aIsClose = diffA <= 90;
                    const bIsClose = diffB <= 90;
                    if (aIsClose && !bIsClose) return -1;
                    if (!aIsClose && bIsClose) return 1;

                    if (diffA !== diffB) {
                        return diffA - diffB;
                    }
                    return 0; 
                });
            }

            setCaptions(mappedCaptions);
        }).catch(() => {});

        return () => { cancelled = true; };
    }, [movie.id, mediaType, playingSeasonNumber, currentEpisode, movie.imdb_id]);

    useEffect(() => {
        if (!settings.showSubtitles || captions.length === 0) {
            setCurrentCaption(null);
            return;
        }

        const preferredLang = settings.subtitleLanguage?.toLowerCase() || 'en';

        let expectedDurationSec = 0;
        if (mediaType === 'movie') {
            expectedDurationSec = (movie.runtime || 0) * 60;
        } else if (mediaType === 'tv') {
            const currentEpObj = currentSeasonEpisodes.find(e => e.episode_number === currentEpisode);
            expectedDurationSec = (currentEpObj?.runtime || 0) * 60;
        }
        const actualDurationSec = duration || (videoRef.current?.duration || 0);
        const targetDuration = actualDurationSec > 0 ? actualDurationSec : expectedDurationSec;

        const matchingLangs = captions.filter(s => s.lang === preferredLang);
        const enTracks = captions.filter(s => s.lang === 'en');

        const findBestTrack = (tracksList: typeof captions) => {
            if (tracksList.length === 0) return null;
            if (targetDuration > 0) {
                const closeMatches = tracksList.filter(t => t.duration && Math.abs(t.duration - targetDuration) <= 90);
                if (closeMatches.length > 0) return closeMatches[0];

                const sortedByCloseness = [...tracksList].sort((a, b) => {
                    const diffA = a.duration ? Math.abs(a.duration - targetDuration) : Infinity;
                    const diffB = b.duration ? Math.abs(b.duration - targetDuration) : Infinity;
                    return diffA - diffB;
                });
                if (sortedByCloseness[0] && sortedByCloseness[0].duration && Math.abs(sortedByCloseness[0].duration - targetDuration) < 300) {
                    return sortedByCloseness[0];
                }
            }
            return null;
        };

        const bestPreferred = findBestTrack(matchingLangs);
        const bestEnglish = findBestTrack(enTracks);

        const target = bestPreferred
            || matchingLangs[0]
            || bestEnglish
            || enTracks[2] || enTracks[0]
            || captions[0];

        if (target) {
            setCurrentCaption(target.url);
        }
    }, [captions, settings.showSubtitles, settings.subtitleLanguage, duration]);

    // ─── STEP ONE: real HLS playback ────────────────────────────────────────
    // Drives the <video> element from the backend-resolved stream. Sources
    // flagged noProxy are streamed straight from the CDN; the rest go through
    // /proxy/stream (applyStreamResult decides which and builds streamUrl).
    // useHls also auto-selects the preferred audio track on MANIFEST_PARSED,
    // which matters because VixSrc masters default to Italian audio.
    const {
        isBuffering: hlsBuffering,
        qualityLevels: hlsQualityLevels,
        currentQuality: hlsCurrentQuality,
        audioTracks: hlsAudioTracks,
        currentAudioTrack: hlsCurrentAudioTrack,
        changeQuality,
        changeAudioTrack,
    } = useHls(videoRef, {
        streamUrl,
        isM3U8: isStreamM3U8,
        streamReferer,
        autoPlay: true,
        preferredAudioLanguage: (settings.subtitleLanguage || 'en').toLowerCase().split('-')[0],
        onManifestParsed: () => {
            setIsVideoReady(true);
            setLoadingMessage('');
        },
        onFatalError: (type, details, statusCode) => {
            const src = allSources[currentSourceIndex];
            reportStreamError({
                provider: src?.provider || 'unknown',
                providerId: src?.providerId || 'unknown',
                tmdbId: String(movie.id),
                type: mediaType === 'tv' ? 'tv' : 'movie',
                error: `${type}: ${details}`,
                errorCode: statusCode,
            }).catch(() => {});
        },
        // Dead or expired URL — put this source on cooldown and move to the next
        // one; if none are left, ask the backend for a freshly resolved set.
        // Capped so a stream that simply won't play (e.g. codec) can't storm the
        // resolver — after MAX_RESOLVE_RETRIES we surface a clean error instead.
        onTokenExpired: () => {
            const dead = allSources[currentSourceIndex];
            if (dead) {
                const key = `${dead.providerId || dead.provider || 'unknown'}::${dead.url || ''}`;
                sourceFailureCooldownRef.current.set(key, Date.now() + SOURCE_FAILURE_COOLDOWN_MS);
            }
            const nextIndex = currentSourceIndex + 1;
            if (allSources[nextIndex]) {
                handleSourceChange(nextIndex);
                return;
            }
            // No more sources — re-resolve, but only up to a cap.
            if (retryCountRef.current >= MAX_RESOLVE_RETRIES) {
                console.warn('[VideoPlayer] Resolve retry cap reached — giving up.');
                setIsBuffering(false);
                setError('This title could not be played right now. Please try again in a moment.');
                return;
            }
            retryCountRef.current += 1;
            forceResolveRef.current = true;
            setResolveNonce(n => n + 1);
        },
        onError: (msg) => setError(msg),
    });

    // Mirror hls.js state into the existing player state so the settings
    // panels (quality / audio pickers) keep working unchanged.
    useEffect(() => { setQualityLevels(hlsQualityLevels); }, [hlsQualityLevels]);
    useEffect(() => { setCurrentQualityLevel(hlsCurrentQuality); }, [hlsCurrentQuality]);
    useEffect(() => { setAudioTracks(hlsAudioTracks); }, [hlsAudioTracks]);
    useEffect(() => { setCurrentAudioTrack(hlsCurrentAudioTrack); }, [hlsCurrentAudioTrack]);
    useEffect(() => { if (streamUrl) setIsBuffering(hlsBuffering); }, [hlsBuffering, streamUrl]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onSeeked = () => {
            const time = video.currentTime;
            if (!time || isNaN(time)) return;
            currentTimeRef.current = time;
            saveProgressImmediately(true);
        };
        video.addEventListener('seeked', onSeeked);
        return () => video.removeEventListener('seeked', onSeeked);
    }, [saveProgressImmediately]);

    // Bridge native <video> events → player state (time, duration, buffering,
    // play state, periodic progress-save, autoplay-next). This is what drives
    // the progress bar and subtitle cue matching.
    useVideoElementEvents(videoRef, streamUrl, {
        currentTimeRef, hasPlayedOnceRef, countdownCancelledRef,
        autoplayNextEpisode: settings.autoplayNextEpisode,
        hasNextEpisode: !!nextEpisodeInfo,
        setCurrentTime, setDuration, setProgress, setIsVideoReady, setIsPlaying,
        setIsBuffering, setBufferedAmount, setShowAutoplayCountdown,
        saveProgress: saveProgressImmediately, handleNextEpisode,
    });

    // Save progress on component unmount
    useEffect(() => {
        return () => {
            saveProgressImmediately(true);
        };
    }, [saveProgressImmediately]);

    // Save progress on tab close/unload, app minimize, or backgrounding
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                saveProgressImmediately(true);
                wasInFullscreenRef.current = !!document.fullscreenElement;
            } else if (document.visibilityState === 'visible') {
                if (wasInFullscreenRef.current && isMobile && !document.fullscreenElement) {
                    setShowFullscreenRestore(true);
                }
            }
        };
        const handleUnload = () => {
            saveProgressImmediately(true);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handleUnload);
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handleUnload);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [saveProgressImmediately]);


    // ——— Manual Autoplay Prompt Effect —————————————————————————————————————
    const TRIGGER_PERCENT = 98.5;
    const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

    useEffect(() => {
        // isVideoReady gates the popup — it is reset to false on every episode change,
        // so the popup can never appear during the initial embed load / transition period.
        // hasCreditsSegment intentionally removed: percentage is the only trigger.
        if (
            !settings.autoplayNextEpisode ||
            !nextEpisodeInfo ||
            duration <= 0 ||
            mediaType !== 'tv' ||
            !isVideoReady
        ) {
            setShowAutoplayCountdown(false);
            return;
        }

        if (currentProgress < TRIGGER_PERCENT - 2) {
            countdownCancelledRef.current = false;
            setShowAutoplayCountdown(false);
        }

        if (currentProgress >= TRIGGER_PERCENT && !countdownCancelledRef.current && !showAutoplayCountdown) {
            setShowAutoplayCountdown(true);
        }
    }, [currentProgress, duration, nextEpisodeInfo, settings.autoplayNextEpisode, mediaType, isVideoReady]);

    const handleCancelAutoplay = useCallback(() => {
        countdownCancelledRef.current = true;
        setShowAutoplayCountdown(false);
    }, []);

    const handlePlayNextNow = useCallback(() => {
        setShowAutoplayCountdown(false);
        handleNextEpisode();
    }, [handleNextEpisode]);

    useEffect(() => {
        if (mediaType !== 'tv') return;
        const init = async () => {
            try {
                const details = await getMovieDetails(String(movie.id), 'tv');
                if (details?.seasons) {
                    const validSeasons = details.seasons
                        .filter((s: any) => s.season_number > 0)
                        .map((s: any) => s.season_number);
                    setSeasonList(validSeasons);
                }
            } catch (e) { }
        };
        init();
    }, [movie.id, mediaType]);

    useEffect(() => {
        if (mediaType !== 'tv') return;
        let cancelled = false;
        const fetchEps = async () => {
            try {
                const seasonData = await getSeasonDetails(String(movie.id), playingSeasonNumber);
                if (!cancelled && seasonData?.episodes) setCurrentSeasonEpisodes(seasonData.episodes);
            } catch (e) { }
        };
        fetchEps();
        return () => { cancelled = true; };
    }, [movie.id, mediaType, playingSeasonNumber]);

    const isControlsHovered = useRef(false);
    const lastTouchTimeRef = useRef(0);

    const showControls = useCallback(() => {
        if (Date.now() - lastTouchTimeRef.current < 900) return;

        setShowUI(true);
        if (isControlsHovered.current || activePanel !== 'none') return;
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(() => {
            if (!isControlsHovered.current) setShowUI(false);
        }, 2500);
    }, [activePanel]);

    useEffect(() => {
        if (activePanel !== 'none') {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            setShowUI(true);
        } else {
            showControls();
        }
    }, [activePanel, showControls]);

    const handleInternalAudioChange = (id: number) => {
        setSelectedAudioTrackId(id);
        console.log(`[VideoPlayer] Switched internal audio to track ${id}`);
    };

    const handleInternalSubtitleChange = (id: number) => {
        setSelectedSubtitleTrackId(id);
        console.log(`[VideoPlayer] Switched internal subtitle to track ${id}`);
    };

    useVideoKeyboardShortcuts({
        videoRef, activePanel, isFullscreen, isPseudoFullscreen, isMuted, captions,
        currentCaption, subtitleOffset,
        hasNextEpisode: !!nextEpisodeInfo, hasPreviousEpisode: !!previousEpisodeInfo,
        userMutedRef, onClose, toggleFullscreen, handleNextEpisode, handlePreviousEpisode,
        setCurrentCaption, setSubtitleOffset, setVolume, setIsMuted,
        setPpRippleTrigger, setSeekFlash, showControls,
    });

    return (
        <div
            ref={containerRef}
            className={`fixed inset-0 z-[20000] flex flex-col font-sans select-none overflow-hidden bg-black w-full h-[100dvh]`}
            style={{
                ...(isPseudoFullscreen ? { position: 'fixed', zIndex: 20001 } : {}),
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                paddingLeft: 'env(safe-area-inset-left, 0px)',
                paddingRight: 'env(safe-area-inset-right, 0px)',
            }}
            onMouseMove={showControls}
            onClick={(e) => {
                const target = e.target as HTMLElement;

                if (activePanel !== 'none') {
                    const panelContainer = target.closest('.settings-panel') || target.closest('.settings-panel-touch');
                    if (!panelContainer) {
                        setActivePanel('none');
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                }

                const isInteractive = target.closest('button, input, select, textarea, .settings-panel, .settings-panel-touch, #video-controls-container, .no-gesture');
                if (isInteractive) {
                    showControls();
                    return;
                }

                if (Date.now() - lastTouchTimeRef.current < 900) return;

                if (isMobile) {
                    if (!showUIRef.current) {
                        showControls();
                    } else {
                        setShowUI(false);
                        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                    }
                } else {
                    if (!showUIRef.current) {
                        showControls();
                    } else {
                        if (videoRef.current) {
                            if (videoRef.current.paused) {
                                videoRef.current.muted = false;
                                videoRef.current.play().catch(() => {});
                            } else {
                                videoRef.current.pause();
                            }
                        }
                        setPpRippleTrigger(t => t + 1);
                        showControls();
                    }
                }
            }}
            onTouchStart={() => { lastTouchTimeRef.current = Date.now(); }}
            onDoubleClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.closest('button')) return;
                toggleFullscreen();
            }}
        >
            {/* The player: direct stream resolved from the backend, driven by useHls. */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full bg-black z-0"
                style={{ objectFit: videoFit }}
                playsInline
                {...{ 'webkit-playsinline': 'true' } as any}
                autoPlay
                preload="auto"
            />


            {/* ── Custom Subtitle Overlay ── */}
            {(isVideoReady || hasPlayedOnceRef.current) && subtitleObjectUrl && currentCueText && (
                <div
                    className="subtitle-overlay"
                    style={{
                        ...overlayStyle,
                        bottom: showUI ? (isMobile ? '4.5rem' : '5.5rem') : (isMobile ? '1.5rem' : '2.0rem'),
                        left: currentCueSettings?.position ? currentCueSettings.position : '50%',
                        transform: currentCueSettings?.position 
                            ? (currentCueSettings.align === 'right' || currentCueSettings.align === 'end' 
                                ? 'translateX(-100%)' 
                                : (currentCueSettings.align === 'center' || currentCueSettings.align === 'middle' 
                                    ? 'translateX(-50%)' 
                                    : 'none'))
                            : 'translateX(-50%)',
                        textAlign: currentCueSettings?.align 
                            ? (currentCueSettings.align === 'middle' 
                                ? 'center' 
                                : (currentCueSettings.align === 'start' 
                                    ? 'left' 
                                    : (currentCueSettings.align === 'end' 
                                        ? 'right' 
                                        : currentCueSettings.align))) as any
                            : 'center',
                        background: 'transparent',
                        backgroundColor: 'transparent',
                        backdropFilter: 'none',
                        padding: 0,
                        transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s ease, opacity 0.25s ease',
                    }}
                >
                    <span
                        className="subtitle-line"
                        style={{
                            color: overlayStyle.color,
                            fontFamily: overlayStyle.fontFamily,
                            fontSize: overlayStyle.fontSize,
                            textShadow: overlayStyle.textShadow,
                            backgroundColor: overlayStyle.backgroundColor,
                            padding: overlayStyle.padding,
                            borderRadius: overlayStyle.borderRadius,
                            backdropFilter: overlayStyle.backdropFilter,
                            fontWeight: overlayStyle.fontWeight,
                            textAlign: isRTL ? 'right' : isDialogue ? 'left' : 'center',
                            display: 'inline-block',
                            whiteSpace: 'normal',
                        }}
                    >
                        {renderCue(currentCueText, isDialogue)}
                    </span>
                </div>
            )}

            {isBuffering && (
                hasPlayedOnceRef.current ? (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
                            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-white/90 animate-spin" />
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(20,20,20,0.97) 0%, rgba(0,0,0,1) 100%)' }}>
                        <div className="relative w-14 h-14 mb-8">
                            <div className="absolute inset-0 rounded-full border-[3px] border-white/8" />
                            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-white/70 animate-spin" />
                            <div className="absolute inset-[6px] rounded-full border-[2px] border-transparent border-t-[#e50914]/60 animate-spin" style={{ animationDuration: '0.7s', animationDirection: 'reverse' }} />
                        </div>
                        <p className="text-white/40 text-[13px] font-medium tracking-[0.12em] uppercase select-none">{loadingMessage}</p>
                    </div>
                )
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 text-center px-6" style={{ backdropFilter: 'blur(8px)' }}>
                    <div className="w-16 h-16 rounded-full border-2 border-[#e50914]/40 flex items-center justify-center mb-6">
                        <span className="text-[#e50914] text-3xl font-bold">!</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                        {t('player.playbackError', { defaultValue: 'Playback Error' })}
                    </h2>
                    <p className="text-white/50 mb-8 max-w-sm text-sm leading-relaxed">{error}</p>
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={() => {
                                forceResolveRef.current = true;
                                setResolveNonce(n => n + 1);
                            }}
                            className="px-8 py-3 bg-white text-black font-bold text-sm rounded-full hover:bg-white/90 hover:scale-105 transition-all active:scale-95"
                        >
                            {t('player.retryConnection', { defaultValue: 'Retry Connection' })}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white/30 hover:text-white/70 text-sm transition-colors mt-1"
                        >
                            {t('player.exitPlayer', { defaultValue: 'Exit Player' })}
                        </button>
                    </div>
                </div>
            )}

            {isMobile && showFullscreenRestore && (
                <div
                    className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-black/70 cursor-pointer"
                    onClick={() => {
                        setShowFullscreenRestore(false);
                        const elem = containerRef.current;
                        if (!elem) return;
                        elem.requestFullscreen?.()
                            .then(() => {
                                (screen.orientation as any)?.lock?.('landscape').catch(() => {});
                            })
                            .catch(() => {});
                    }}
                >
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                        </svg>
                    </div>
                    <p className="text-white text-base font-medium">{t('player.tapToFullscreen', { defaultValue: 'Tap to resume fullscreen' })}</p>
                </div>
            )}

            {!isMobile && showPausedOverlay && !isBuffering && isVideoReady && !error && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-center p-12 z-[50] bg-black/60">
                    <div className="flex flex-col gap-1 max-w-2xl ml-24">
                        <p className="text-white/80 text-[1.1rem] font-normal tracking-wide drop-shadow-md">
                            {t('player.youreWatching', { defaultValue: "You're watching" })}
                        </p>
                        <h1 className="text-white text-6xl font-bold tracking-tight mb-2 drop-shadow-lg">{title}</h1>

                        {mediaType === 'tv' && (
                            <>
                                <h2 className="text-white font-bold text-2xl mt-1 drop-shadow-md">
                                    {t('player.season', { defaultValue: 'Season' })} {playingSeasonNumber}
                                </h2>
                                <h3 className="text-white font-bold text-xl mt-3 drop-shadow-md">{currentEpisodeName}: {t('player.episodeCodeShort', { episode: currentEpisode, defaultValue: `Ep. ${currentEpisode}` })}</h3>
                            </>
                        )}

                        <p className="text-white/90 text-[1.1rem] mt-3 leading-relaxed line-clamp-3 drop-shadow-md max-w-xl">
                            {mediaType === 'tv' ? (currentSeasonEpisodes.find(ep => ep.episode_number === currentEpisode)?.overview || movie.overview) : movie.overview}
                        </p>
                    </div>
                    <div className="absolute bottom-12 right-16">
                        <span className="text-white/80 text-[1.2rem] font-medium tracking-wide drop-shadow-md">
                            {t('player.paused', { defaultValue: 'Paused' })}
                        </span>
                    </div>
                </div>
            )}

            <>
                <VideoPlayerControls
                    showUI={showUI}
                    isPlaying={isPlaying}
                    isMuted={isMuted}
                    progress={progress}
                    duration={duration}
                    currentTime={currentTime}
                    buffered={bufferedAmount}
                    isBuffering={isBuffering}
                    title={title}
                    episodeNumber={mediaType === 'tv' ? currentEpisode : undefined}
                    episodeName={mediaType === 'tv' ? currentEpisodeName : undefined}
                    showAutoplayCountdown={showAutoplayCountdown}
                    onCancelAutoplay={handleCancelAutoplay}
                    onPlayNextNow={handlePlayNextNow}
                    onPlayPause={() => {
                        if (videoRef.current?.paused) {
                            videoRef.current.muted = false;
                            videoRef.current.play();
                        } else {
                            videoRef.current?.pause();
                        }
                    }}
                    onSeek={(amt) => {
                        videoRef.current && (videoRef.current.currentTime += amt);
                    }}
                    volume={volume}
                    onVolumeChange={(v) => {
                        setVolume(v);
                        if (videoRef.current) {
                            videoRef.current.volume = v;
                            if (v > 0) videoRef.current.muted = false;
                        }
                    }}
                    onToggleMute={() => {
                        const nextMuted = !isMuted;
                        userMutedRef.current = nextMuted;
                        setIsMuted(nextMuted);
                        if (videoRef.current) {
                            videoRef.current.muted = nextMuted;
                        }
                    }}
                    onTimelineSeek={(p) => {
                        videoRef.current && (videoRef.current.currentTime = (p / 100) * videoRef.current.duration);
                    }}
                    onToggleFullscreen={toggleFullscreen}
                    onClose={onClose || (() => window.history.back())}
                    activePanel={activePanel}
                    setActivePanel={setActivePanel}
                    mediaType={mediaType}
                    hasNextEpisode={!!nextEpisodeInfo}
                    onNextEpisode={() => {
                        handleNextEpisode();
                    }}
                    hasPreviousEpisode={!!previousEpisodeInfo}
                    onPrevEpisode={() => {
                        handlePreviousEpisode();
                    }}
                    showNextEp={!!nextEpisodeInfo}
                    onInteraction={showControls}
                    onControlsHoverChange={(h) => {
                        isControlsHovered.current = h;
                        if (h && inactivityTimerRef.current) {
                            clearTimeout(inactivityTimerRef.current);
                        }
                    }}
                    onSubtitlesClick={() => setActivePanel(p => p === 'audioSubtitles' ? 'none' : 'audioSubtitles')}
                    currentCaption={currentCaption}
                    onEpisodesClick={mediaType === 'tv'
                        ? () => {
                            setBrowsedSeasonNumber(playingSeasonNumber);
                            setActivePanel(p => (p === 'episodes' || p === 'seasons') ? 'none' : 'episodes');
                        }
                        : undefined}
                    videoFit={videoFit}
                    onToggleFit={() => setVideoFit(prev => prev === 'contain' ? 'cover' : 'contain')}
                    ppRippleTrigger={ppRippleTrigger}
                    setPpRippleTrigger={setPpRippleTrigger}
                    seekFlash={seekFlash}
                    setSeekFlash={setSeekFlash}
                    skipSegments={skipSegments}
                    onSkipSegment={handleSkipSegment}
                />


                {isMobile ? (
                    <VideoPlayerSettingsTouch
                        activePanel={activePanel}
                        setActivePanel={setActivePanel}
                        seasonList={seasonList}
                        currentSeasonEpisodes={currentSeasonEpisodes}
                        selectedSeason={browsedSeasonNumber}
                        currentEpisode={currentEpisode}
                        playingSeason={playingSeasonNumber}
                        showId={movie.id}
                        onSeasonSelect={(s) => {
                            setBrowsedSeasonNumber(s);
                            getSeasonDetails(String(movie.id), s).then(data => {
                                if (data?.episodes) setCurrentSeasonEpisodes(data.episodes);
                            }).catch(() => { });
                            setActivePanel('episodes');
                        }}
                        onEpisodeSelect={handleEpisodeSelect}
                        qualities={qualityLevels}
                        currentQuality={currentQualityLevel}
                        onQualityChange={changeQuality}
                        captions={captions}
                        currentCaption={currentCaption}
                        onSubtitleChange={setCurrentCaption}
                        subtitleOffset={subtitleOffset}
                        onSubtitleOffsetChange={setSubtitleOffset}
                        audioTracks={audioTracks}
                        currentAudioTrack={currentAudioTrack}
                        onAudioChange={changeAudioTrack}
                        internalTracks={internalTracks}
                        selectedAudioTrackId={selectedAudioTrackId}
                        selectedSubtitleTrackId={selectedSubtitleTrackId}
                        onInternalAudioChange={handleInternalAudioChange}
                        onInternalSubtitleChange={handleInternalSubtitleChange}
                        allSources={allSources}
                        currentSourceIndex={currentSourceIndex}
                        onSourceChange={handleSourceChange}
                        showTitle={title || movie.title || movie.name}
                        videoDuration={duration}
                    />
                ) : (
                    <VideoPlayerSettings
                        activePanel={activePanel}
                        setActivePanel={setActivePanel}
                        seasonList={seasonList}
                        currentSeasonEpisodes={currentSeasonEpisodes}
                        selectedSeason={browsedSeasonNumber}
                        currentEpisode={currentEpisode}
                        playingSeason={playingSeasonNumber}
                        showId={movie.id}
                        onSeasonSelect={(s) => {
                            setBrowsedSeasonNumber(s);
                            getSeasonDetails(String(movie.id), s).then(data => {
                                if (data?.episodes) setCurrentSeasonEpisodes(data.episodes);
                            }).catch(() => { });
                            setActivePanel('episodes');
                        }}
                        onEpisodeSelect={handleEpisodeSelect}
                        qualities={qualityLevels}
                        currentQuality={currentQualityLevel}
                        onQualityChange={changeQuality}
                        captions={captions}
                        currentCaption={currentCaption}
                        onSubtitleChange={setCurrentCaption}
                        subtitleOffset={subtitleOffset}
                        onSubtitleOffsetChange={setSubtitleOffset}
                        audioTracks={audioTracks}
                        currentAudioTrack={currentAudioTrack}
                        onAudioChange={changeAudioTrack}
                        internalTracks={internalTracks}
                        selectedAudioTrackId={selectedAudioTrackId}
                        selectedSubtitleTrackId={selectedSubtitleTrackId}
                        onInternalAudioChange={handleInternalAudioChange}
                        onInternalSubtitleChange={handleInternalSubtitleChange}
                        allSources={allSources}
                        currentSourceIndex={currentSourceIndex}
                        onSourceChange={handleSourceChange}
                        showTitle={title || movie.title || movie.name}
                        videoDuration={duration}
                    />
                )}
            </>

        </div>
    );
};

export default VideoPlayer;