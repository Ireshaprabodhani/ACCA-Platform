// src/pages/IntroductionVideoPage.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ─── tiny helpers ───────────────────────────────────────── */
const getYouTubeId = (url) =>
  (url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/) || [])[1] || '';
const isYouTubeUrl = (url) => /youtu\.?be/.test(url);

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
  const [url, setUrl] = useState('');
  const [isPlaying, setPlay] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const nav = useNavigate();
  const vidRef = useRef(null);
  const lastRef = useRef(0); // watch‑dog for seeking
  const ytPlayerRef = useRef(null);

  /* 1️⃣  gate‑keep: already completed quiz? */
  useEffect(() => {
    const tok = localStorage.getItem('token');
    if (!tok) {
      nav('/login');
      return;
    }

    axios
      .get('http://localhost:5000/api/quiz/has-attempted?language=English', {
        headers: { Authorization: `Bearer ${tok}` },
      })
      .then((r) => r.data.hasAttempted && nav('/thank-you'))
      .catch(console.error);
  }, [nav]);

  /* 2️⃣  fetch video url (intro) */
  useEffect(() => {
    axios
      .get('http://localhost:5000/api/video/intro', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((r) => setUrl(r.data.url))
      .catch(console.error);
  }, []);

  /* 3️⃣  YouTube handler */
  useEffect(() => {
    if (!isYouTubeUrl(url)) return;

    loadYT().then((YT) => {
      ytPlayerRef.current = new YT.Player('yt-player', {
        height: 450,
        width: 800,
        videoId: getYouTubeId(url),
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
        },
        events: {
          onReady: (e) => {
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              const interval = setInterval(() => {
                const t = ytPlayerRef.current.getCurrentTime();
                if (t - lastRef.current > 1.5) {
                  ytPlayerRef.current.seekTo(lastRef.current, true);
                } else {
                  lastRef.current = t;
                }
              }, 1000);
              const clear = () => clearInterval(interval);
              // Clear interval on pause or ended
              if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
                clear();
              }
            }
            if (e.data === YT.PlayerState.ENDED) {
              setHasEnded(true);
            }
          },
        },
      });
    });
  }, [url]);

  /* 4️⃣  HTML‑5 video handler */
  useEffect(() => {
    if (!vidRef.current || isYouTubeUrl(url)) return;

    const v = vidRef.current;
    const i = setInterval(() => {
      if (v.currentTime - lastRef.current > 1.5) v.currentTime = lastRef.current;
      else lastRef.current = v.currentTime;
    }, 1000);

    return () => clearInterval(i);
  }, [url]);

  const togglePlay = () => {
    if (!vidRef.current || isYouTubeUrl(url)) return;
    if (vidRef.current.paused) {
      vidRef.current.play();
      setPlay(true);
    } else {
      vidRef.current.pause();
      setPlay(false);
    }
  };

  const full = () => {
    const v = vidRef.current;
    if (!v || isYouTubeUrl(url)) return;
    (v.requestFullscreen || v.webkitRequestFullscreen || v.msRequestFullscreen)?.call(v);
  };

  const goNext = () => {
    nav('/language-selection');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 p-6"
    >
      <div
        className="bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-2xl
                      w-full max-w-4xl p-8 flex flex-col items-center"
      >
        <h1
          className="text-3xl md:text-4xl font-extrabold mb-6
                       bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
        >
          📽️ Introduction Video
        </h1>

        {/* video frame */}
        {isYouTubeUrl(url) ? (
          <div id="yt-player" className="rounded-xl overflow-hidden shadow-lg w-full" />
        ) : (
          <video
            ref={vidRef}
            src={url}
            autoPlay
            playsInline
            controls={false}
            onEnded={() => setHasEnded(true)}
            onCanPlay={() => vidRef.current?.play().catch(() => {})}
            className="rounded-xl w-full max-h-[60vh] shadow-lg"
          />
        )}

        {/* custom controls for HTML5 source */}
        {!isYouTubeUrl(url) && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={togglePlay}
              className="px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              {isPlaying ? '⏸ Pause' : '▶️ Play'}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              defaultValue="1"
              onChange={(e) => {
                if (vidRef.current) vidRef.current.volume = e.target.value;
              }}
              className="w-32 accent-purple-600"
            />

            <button
              onClick={full}
              className="px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              ⛶ Full Screen
            </button>
          </div>
        )}

        {/* Continue button shown only after video ends */}
        {hasEnded && (
          <button
            onClick={goNext}
            className="mt-8 px-6 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
