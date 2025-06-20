/* src/pages/CaseVideoPage.jsx */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ─── config ─────────────────────────────────────────────── */
const API_BASE =
  import.meta.env.VITE_API_URL || 'https://pc3mcwztgh.ap-south-1.awsapprunner.com';

/* ─── helpers ────────────────────────────────────────────── */
const getYouTubeId = (raw = '') => {
  if (!raw) return '';
  try {
    const url = new URL(raw);

    // youtu.be/abc123
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);

    // youtube.com/watch?v=abc123
    const v = url.searchParams.get('v');
    if (v) return v;

    // youtube.com/embed/abc123
    const m = url.pathname.match(/\/embed\/([^/?]+)/);
    if (m) return m[1];
  } catch {
    /* ignore bad URLs */
  }
  return '';
};

/* ─── component ──────────────────────────────────────────── */
export default function CaseVideoPage() {
  const nav = useNavigate();

  /* refs */
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastTime = useRef(0);
  const intervalRef = useRef(null);

  /* state */
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');

  /* 1️⃣  fetch video URL */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return nav('/login');

    axios
      .get(`${API_BASE}/api/case/video`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        if (data?.url) setUrl(data.url);
        else setError('No case‑study video configured.');
        setLoading(false);
      })
      .catch((err) => {
        console.error('[case‑video]', err);
        if (err.response?.status === 401) nav('/login');
        else setError('Failed to load video. Please try again.');
        setLoading(false);
      });
  }, [nav]);

  /* 2️⃣  YouTube setup */
  useEffect(() => {
    if (!url || loading) return;

    const id = getYouTubeId(url);
    if (!id) return; // not a YouTube link → handled by native video section

    /* load IFrame API once */
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }

    const init = () => {
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: id,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: ({ data, target }) => {
            if (data === window.YT.PlayerState.PLAYING) {
              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                const t = target.getCurrentTime();
                if (t - lastTime.current > 1.5)
                  target.seekTo(lastTime.current, true);
                else lastTime.current = t;
              }, 500);
            }
            if (data === window.YT.PlayerState.PAUSED) {
              setTimeout(() => {
                if (
                  target.getPlayerState() === window.YT.PlayerState.PAUSED
                )
                  target.playVideo();
              }, 800);
            }
            if (data === window.YT.PlayerState.ENDED) {
              clearInterval(intervalRef.current);
              setEnded(true);
            }
          },
          onError: () =>
            setError('Error playing video. Please refresh the page.'),
        },
      });
    };

    if (window.YT && window.YT.Player) init();
    else window.onYouTubeIframeAPIReady = init;

    return () => clearInterval(intervalRef.current);
  }, [url, loading]);

  /* 3️⃣  native video anti‑seek */
  useEffect(() => {
    if (!url || getYouTubeId(url) || loading) return;

    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (v.currentTime - lastTime.current > 1.5)
          v.currentTime = lastTime.current;
        else lastTime.current = v.currentTime;
      }, 500);
    };

    const onEnded = () => {
      clearInterval(intervalRef.current);
      setEnded(true);
    };

    const onPause = () =>
      setTimeout(() => {
        if (v.paused && !v.ended) v.play().catch(() => {});
      }, 800);

    v.addEventListener('play', onPlay);
    v.addEventListener('ended', onEnded);
    v.addEventListener('pause', onPause);

    /* autoplay (muted) */
    v.muted = true;
    v.play()
      .then(() => setTimeout(() => (v.muted = false), 1000))
      .catch(() =>
        setError('Autoplay blocked – click to start the video.')
      );

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('pause', onPause);
      clearInterval(intervalRef.current);
    };
  }, [url, loading]);

  /* 4️⃣  UI guards */
  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin h-12 w-12 border-b-2 border-white rounded-full mb-4" />
        Loading video…
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-red-600/20 border border-red-600 rounded-lg p-6 max-w-md text-center space-y-4">
          <h2 className="text-xl font-bold">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );

  /* 5️⃣  render */
  const isYT = Boolean(getYouTubeId(url));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 text-white flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Case Study Video</h1>

      <div className="w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl">
        {isYT ? (
          <div
            className="relative w-full"
            style={{ paddingBottom: '56.25%' }}
          >
            <div
              id="yt-player"
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={url}
            autoPlay
            muted
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
            className="w-full h-auto pointer-events-none"
            style={{ minHeight: '400px' }}
          />
        )}
      </div>

      <div className="mt-8 text-center">
        {ended ? (
          <div className="space-y-4">
            <p className="text-green-400 text-lg font-semibold">
              ✅ Video completed successfully!
            </p>
            <button
              onClick={() => nav('/case-questions')}
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-full text-lg font-bold transition-transform duration-200 hover:scale-105"
            >
              Continue to Questions →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-yellow-200 text-lg">
              📺 Please watch the entire video to continue
            </p>
            <p className="text-gray-200 text-sm">
              ⚠️ Skipping is disabled • Video must be watched completely
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
