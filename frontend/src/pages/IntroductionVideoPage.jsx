// src/pages/IntroductionVideoPage.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ───── helpers ─────────────────────────────── */
const isYouTubeUrl = (u) => /youtu\.?be/.test(u);
const getYouTubeId = (raw) => {
  try {
    const url = new URL(raw);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    if (url.pathname.startsWith('/watch')) return url.searchParams.get('v');
    if (url.pathname.startsWith('/embed/')) return url.pathname.split('/embed/')[1];
  } catch { /**/ }
  return '';
};
const loadYT = () =>
  new Promise((res) => {
    if (window.YT?.Player) return res(window.YT);
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(s);
    window.onYouTubeIframeAPIReady = () => res(window.YT);
  });

/* ───── component ───────────────────────────── */
export default function IntroductionVideoPage() {
  const [url, setUrl] = useState('');
  const [isPlaying, setPlaying] = useState(true);
  const [ended, setEnded] = useState(false);
  const nav = useNavigate();
  const vidRef = useRef(null);
  const ytRef  = useRef(null);
  const watch  = useRef(0);

  /* 1️⃣ redirect if quiz already done */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return nav('/login');
    axios.get('/api/quiz/has-attempted?language=English',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(({data}) => data.hasAttempted && nav('/thank-you'))
    .catch(console.error);
  }, [nav]);

  /* 2️⃣ fetch intro video url */
  useEffect(() => {
    axios.get('/api/video/intro', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    .then(({data}) => setUrl(data.url || ''))
    .catch(console.error);
  }, []);

  /* 3️⃣ YouTube setup */
  useEffect(() => {
    if (!isYouTubeUrl(url)) return;
    const id = getYouTubeId(url);
    if (!id) return;                   // <- guard against invalid ID
    loadYT().then((YT) => {
      ytRef.current = new YT.Player('yt-player', {
        height: 450,
        width: 800,
        videoId: id,
        playerVars: { autoplay: 1, playsinline: 1, controls: 0, rel: 0 },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: ({data, target}) => {
            if (data === YT.PlayerState.ENDED) setEnded(true);
            if (data === YT.PlayerState.PLAYING) {
              const int = setInterval(() => {
                const t = target.getCurrentTime();
                if (t - watch.current > 1.5) target.seekTo(watch.current, true);
                else watch.current = t;
              }, 1000);
              const clear = () => clearInterval(int);
              window.addEventListener('beforeunload', clear, { once: true });
            }
          },
        },
      });
    });
    return () => ytRef.current?.destroy?.();
  }, [url]);

  /* 4️⃣ native video anti‑seek */
  useEffect(() => {
    if (!vidRef.current || isYouTubeUrl(url)) return;
    const v = vidRef.current;
    const int = setInterval(() => {
      if (v.currentTime - watch.current > 1.5) v.currentTime = watch.current;
      else watch.current = v.currentTime;
    }, 1000);
    return () => clearInterval(int);
  }, [url]);

  /* ───── render ─────────────────────────────── */
  if (!url)                   // still loading
    return <div className="h-screen flex items-center justify-center">Loading…</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 p-6">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          📽️ Introduction Video
        </h1>

        {isYouTubeUrl(url) ? (
          <div id="yt-player" className="rounded-xl overflow-hidden shadow-lg w-full" />
        ) : (
          <video
            ref={vidRef}
            src={url}
            autoPlay
            playsInline
            className="rounded-xl w-full max-h-[60vh] shadow-lg"
            onEnded={() => setEnded(true)}
          />
        )}

        {!isYouTubeUrl(url) && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => {vidRef.current[vidRef.current.paused?'play':'pause'](); setPlaying(!vidRef.current.paused);}}
              className="px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition">
              {isPlaying ? '⏸ Pause' : '▶️ Play'}
            </button>
            <input
              type="range" min="0" max="1" step="0.02" defaultValue="1"
              onChange={(e) => (vidRef.current.volume = e.target.value)}
              className="w-32 accent-purple-600"
            />
            <button
              onClick={() => vidRef.current?.requestFullscreen?.()}
              className="px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition">
              ⛶ Full Screen
            </button>
          </div>
        )}

        {ended && (
          <button
            onClick={() => nav('/language-selection')}
            className="mt-8 px-6 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition">
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
