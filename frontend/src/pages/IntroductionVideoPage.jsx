/* src/pages/IntroductionVideoPage.jsx */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RedBackground from '../assets/background.jpg';

/* ─── config ─────────────────────────────────────────────── */
/* Use Vite/CRA env var in prod, fall back to localhost in dev */
const API_BASE =
  import.meta.env.VITE_API_URL || 'https://pc3mcwztgh.ap-south-1.awsapprunner.com';

/* ─── helpers ────────────────────────────────────────────── */
const isYouTubeUrl = (u = '') =>
  /youtu\.?be/.test(u) || /youtube\.com/.test(u);

const getYouTubeId = (raw = '') => {
  try {
    const url = new URL(raw);

    /*  youtu.be/abc123  */
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);

    /*  youtube.com/watch?v=abc123  */
    if (url.pathname.startsWith('/watch'))
      return url.searchParams.get('v');

    /*  youtube.com/embed/abc123  */
    if (url.pathname.startsWith('/embed/'))
      return url.pathname.split('/embed/')[1];
  } catch {
    /* ignore bad URLs */
  }
  return '';
};

const loadYT = () =>
  new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(s);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });

/* ─── component ──────────────────────────────────────────── */
export default function IntroductionVideoPage() {
  const nav = useNavigate();

  /*  component state  */
  const [url, setUrl] = useState('');
  const [playing, setPlaying] = useState(true);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');

  /*  refs  */
  const vidRef = useRef(null);
  const ytRef = useRef(null);
  const watchDog = useRef(0);

  /* 1️⃣  Gate‑keep: already completed quiz? */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      nav('/login');
      return;
    }

    axios
      .get(`${API_BASE}/api/quiz/has-attempted?language=English`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => data.hasAttempted && nav('/thank-you'))
      .catch((err) => console.error('[has-attempted]', err));
  }, [nav]);

  /* 2️⃣  Fetch intro‑video URL */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios
      .get(`${API_BASE}/api/video/intro`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        if (data?.url) setUrl(data.url);
        else setError('No introduction video configured.');
      })
      .catch((err) => {
        console.error('[intro-video]', err);
        setError('Could not load introduction video.');
      });
  }, []);

  /* 3️⃣  YouTube setup */
  useEffect(() => {
    if (!isYouTubeUrl(url)) return;

    const id = getYouTubeId(url);
    if (!id) {
      setError('Invalid YouTube URL.');
      return;
    }

    loadYT().then((YT) => {
      ytRef.current = new YT.Player('yt-player', {
        height: 450,
        width: 800,
        videoId: id,
        playerVars: { autoplay: 1, playsinline: 1, controls: 0, rel: 0 },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: ({ data, target }) => {
            if (data === YT.PlayerState.PLAYING) {
              const interval = setInterval(() => {
                const t = target.getCurrentTime();
                if (t - watchDog.current > 1.5)
                  target.seekTo(watchDog.current, true);
                else watchDog.current = t;
              }, 1000);

              /* clear if paused / ended */
              const clear = () => clearInterval(interval);
              target.addEventListener('onStateChange', ({ data }) => {
                if (
                  data === YT.PlayerState.PAUSED ||
                  data === YT.PlayerState.ENDED
                )
                  clear();
              });
            }
            if (data === YT.PlayerState.ENDED) setEnded(true);
          },
        },
      });
    });

    return () => ytRef.current?.destroy?.();
  }, [url]);

  /* 4️⃣  HTML‑5 anti‑seek */
  useEffect(() => {
    if (!vidRef.current || isYouTubeUrl(url)) return;

    const v = vidRef.current;
    const i = setInterval(() => {
      if (v.currentTime - watchDog.current > 1.5)
        v.currentTime = watchDog.current;
      else watchDog.current = v.currentTime;
    }, 1000);

    return () => clearInterval(i);
  }, [url]);

  /* 5️⃣  Controls */
  const togglePlay = () => {
    if (!vidRef.current || isYouTubeUrl(url)) return;
    if (vidRef.current.paused) {
      vidRef.current.play();
      setPlaying(true);
    } else {
      vidRef.current.pause();
      setPlaying(false);
    }
  };

  const fullScreen = () => {
    const v = vidRef.current;
    if (!v || isYouTubeUrl(url)) return;
    (v.requestFullscreen ||
      v.webkitRequestFullscreen ||
      v.msRequestFullscreen)?.call(v);
  };

  /* ─── render‑guards ─────────────────────────── */
  if (error)
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );

  if (!url)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading…
      </div>
    );

  /* ─── render ────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundImage: `url(${RedBackground})` }}>
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          📽️ Introduction Video
        </h1>

        {/* video frame */}
        {isYouTubeUrl(url) ? (
          <div
            id="yt-player"
            className="rounded-xl overflow-hidden shadow-lg w-full"
          />
        ) : (
          <video
            ref={vidRef}
            src={url}
            autoPlay
            playsInline
            controls={false}
            onEnded={() => setEnded(true)}
            onCanPlay={() => vidRef.current?.play().catch(() => {})}
            className="rounded-xl w-full max-h-[60vh] shadow-lg"
          />
        )}

        {/* custom controls for native video */}
        {!isYouTubeUrl(url) && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={togglePlay}
              className="px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              {playing ? '⏸ Pause' : '▶️ Play'}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              defaultValue="1"
              onChange={(e) =>
                (vidRef.current.volume = e.target.value)
              }
              className="w-32 accent-purple-600"
            />

            <button
              onClick={fullScreen}
              className="px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              ⛶ Full Screen
            </button>
          </div>
        )}

        {/* continue after finished */}
        {ended && (
          <button
            onClick={() => nav('/language-selection')}
            className="mt-8 px-6 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
