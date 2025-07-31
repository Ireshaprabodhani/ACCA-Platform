import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeygenChatEmbed from '../components/HeygenChatEmbed';
import RedBackground from '../assets/background.jpg';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://pc3mcwztgh.ap-south-1.awsapprunner.com';

const getYouTubeId = (raw = '') => {
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    const v = url.searchParams.get('v');
    if (v) return v;
    const m = url.pathname.match(/\/embed\/([^/?]+)/);
    if (m) return m[1];
  } catch {}
  return '';
};

/* ─── component ──────────────────────────────────────────── */
export default function CaseVideoPage() {
  const nav = useNavigate();

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const watchdog = useRef(0);
  const intervalRef = useRef(null);
  const resumeHandlerRef = useRef(null);

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);

  // NEW: State to store PDF download URL
  const [pdfUrl, setPdfUrl] = useState('');

  const isHeygen = url.includes('labs.heygen.com');

  // Fetch video URL
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
        if (err.response?.status === 401) nav('/login');
        else setError('Failed to load video. Please try again.');
        setLoading(false);
      });
  }, [nav]);

  // NEW: Fetch PDF download URL
  useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return nav('/login');

  // Fetch list of PDFs
  axios.get(`${API_BASE}/api/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  .then(({ data }) => {
    if (data.length > 0) {
      // Use the first PDF for download, for example
      const firstPdfId = data[0]._id;
      setPdfUrl(`${API_BASE}/api/pdf/download/${firstPdfId}`);
    }
  })
  .catch((err) => {
    console.error('Failed to fetch PDFs', err);
  });
}, [nav]);


  useEffect(() => {
    if (!url || loading || isHeygen) return;

    const id = getYouTubeId(url);
    if (!id) return;

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
          mute: 0,
        },
        events: {
          onReady: (e) => {
            e.target.playVideo();
            setTimeout(() => {
              if (e.target.getPlayerState() !== window.YT.PlayerState.PLAYING) {
                setBlocked(true);
                const resume = () => {
                  e.target.playVideo();
                  setBlocked(false);
                  document.removeEventListener('click', resume);
                };
                resumeHandlerRef.current = resume;
                document.addEventListener('click', resume);
              }
            }, 1500);
          },
          onStateChange: ({ data, target }) => {
            if (data === window.YT.PlayerState.PLAYING) {
              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                const t = target.getCurrentTime();
                if (t - watchdog.current > 1.5)
                  target.seekTo(watchdog.current, true);
                else watchdog.current = t;
              }, 500);
            }
            if (data === window.YT.PlayerState.PAUSED) {
              setTimeout(() => {
                if (target.getPlayerState() === window.YT.PlayerState.PAUSED)
                  target.playVideo();
              }, 800);
            }
            if (data === window.YT.PlayerState.ENDED) {
              clearInterval(intervalRef.current);
              setEnded(true);
            }
          },
          onError: () =>
            setError(
              'Error playing video. Please refresh the page or contact support.'
            ),
        },
      });
    };

    if (window.YT && window.YT.Player) init();
    else window.onYouTubeIframeAPIReady = init;

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('click', resumeHandlerRef.current);
    };
  }, [url, loading, isHeygen]);

  useEffect(() => {
    if (!url || getYouTubeId(url) || loading || isHeygen) return;

    const v = videoRef.current;
    if (!v) return;

    const playWithSound = () =>
      v.play().catch(() => {
        setBlocked(true);
        const resume = () => {
          v.play().then(() => {
            setBlocked(false);
            document.removeEventListener('click', resume);
          });
        };
        resumeHandlerRef.current = resume;
        document.addEventListener('click', resume);
      });

    const onPlay = () => {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (v.currentTime - watchdog.current > 1.5)
          v.currentTime = watchdog.current;
        else watchdog.current = v.currentTime;
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

    playWithSound();

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('pause', onPause);
      clearInterval(intervalRef.current);
      document.removeEventListener('click', resumeHandlerRef.current);
    };
  }, [url, loading, isHeygen]);

  useEffect(() => {
    if (!isHeygen) return;
    setEnded(false);
    const timer = setTimeout(() => {
      setEnded(true);
    }, 13 * 60 * 1000); // 13 minutes
    return () => clearTimeout(timer);
  }, [isHeygen]);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin h-12 w-12 border-b-2 border-white rounded-full mb-4" />
        Loading video…
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4" >
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

  const isYT = Boolean(getYouTubeId(url));

  return (
  <div
    className="min-h-screen text-white flex flex-col items-center justify-center px-4 py-10 relative"
    style={{ backgroundImage: `url(${RedBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
  >
    {blocked && (
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
        <button
          className="bg-green-600 hover:bg-green-700 text-lg font-bold px-6 py-4 rounded-full shadow-xl"
          onClick={() => {
            if (isYT && playerRef.current) playerRef.current.playVideo();
            else if (videoRef.current) videoRef.current.play();
            setBlocked(false);
          }}
        >
          Click to start the video with sound
        </button>
      </div>
    )}

    <h1 className="text-4xl font-bold mb-8 text-center drop-shadow-lg">Case Study Video</h1>

    <div className="w-full max-w-5xl bg-black/80 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,0,0,0.4)] border border-red-700 mx-auto">
      {isYT ? (
        <div className="w-full p-4 md:p-6 flex justify-center items-center" style={{ paddingBottom: '56.25%' }}>
          <div id="yt-player" className="absolute top-0 left-0 w-full h-full" />
        </div>
      ) : isHeygen ? (
        !ended && (
            <div className="w-full p-4 md:p-6 flex justify-center items-center">
              <div className="w-full max-w-4xl aspect-video"> {/* Adjust max-w as needed */}
                <HeygenChatEmbed iframeUrl={url} />
              </div>
            </div>
        )
      ) : (
        <video
          ref={videoRef}
          src={url}
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate"
          className="w-full h-auto pointer-events-none"
          style={{ minHeight: '400px' }}
        />
      )}
    </div>

    <div className="mt-10 text-center">
      {ended ? (
        <>
          {isHeygen && (
            <div className="mt-10 w-full flex justify-center">
              <HeygenChatEmbed iframeUrl={url} />
            </div>
          )}

          <p className="text-green-400 text-xl font-semibold mt-6">
            ✅ Video completed successfully!
          </p>

          <div className="mt-8">
            <button
              onClick={() => nav('/case-questions')}
              className="bg-green-500 hover:bg-green-600 px-10 py-4 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(0,255,0,0.6)] hover:scale-105 transition-transform"
            >
              Continue to Questions →
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3 mt-6">
          {/* NEW: Download button above this text */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              download
              className="inline-block mb-4 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-white font-semibold"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download PDF
            </a>
          )}

          <p className="text-yellow-200 text-lg">
            📺 Please watch the entire video to continue
          </p>
          <p className="text-gray-300 text-sm">
            ⚠️ Skipping is disabled • Video must be watched completely
          </p>
        </div>
      )}
    </div>
  </div>
);
}
