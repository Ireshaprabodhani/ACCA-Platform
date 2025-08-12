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
  const [pdfs, setPdfs] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  // Simplified timer state
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  const isHeygen = url.includes('labs.heygen.com');

  // Initialize timer from localStorage on mount
  useEffect(() => {
    const savedTimeLeft = localStorage.getItem('caseVideoTimeLeft');
    const savedTimestamp = localStorage.getItem('caseVideoTimestamp');
    const savedTimerActive = localStorage.getItem('caseVideoTimerActive');
    const savedTimerFinished = localStorage.getItem('caseVideoTimerFinished');

    if (savedTimerFinished === 'true') {
      setTimerFinished(true);
      setTimeLeft(0);
      return;
    }

    if (savedTimeLeft && savedTimestamp && savedTimerActive === 'true') {
      const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp, 10)) / 1000);
      const remaining = Math.max(0, parseInt(savedTimeLeft, 10) - elapsed);
      
      if (remaining <= 0) {
        setTimerFinished(true);
        setTimeLeft(0);
        localStorage.setItem('caseVideoTimerFinished', 'true');
      } else {
        setTimeLeft(remaining);
        setTimerActive(true);
      }
    }
  }, []);

  // Start timer when component is ready
  useEffect(() => {
    if (loading || timerActive || timerFinished) return;

    // Start the timer
    setTimerActive(true);
    localStorage.setItem('caseVideoTimerActive', 'true');
    localStorage.setItem('caseVideoTimestamp', Date.now().toString());
    localStorage.setItem('caseVideoTimeLeft', timeLeft.toString());
  }, [loading, timerActive, timerFinished, timeLeft]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timerFinished) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        
        // Update localStorage every 5 seconds
        if (newTime % 5 === 0) {
          localStorage.setItem('caseVideoTimeLeft', newTime.toString());
          localStorage.setItem('caseVideoTimestamp', Date.now().toString());
        }
        
        // Timer finished
        if (newTime <= 0) {
          setTimerActive(false);
          setTimerFinished(true);
          localStorage.setItem('caseVideoTimerActive', 'false');
          localStorage.setItem('caseVideoTimerFinished', 'true');
          localStorage.setItem('caseVideoTimeLeft', '0');
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timerActive, timerFinished]);

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

    axios
      .get(`${API_BASE}/api/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        setPdfs(data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch PDFs:', err);
      });
  }, [nav]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Clean up timer data when navigating to questions
  const handleContinueToQuestions = () => {
    localStorage.removeItem('caseVideoTimeLeft');
    localStorage.removeItem('caseVideoTimestamp');
    localStorage.removeItem('caseVideoTimerActive');
    localStorage.removeItem('caseVideoTimerFinished');
    nav('/case-questions');
  };

  const handlePdfDownload = async (pdfId, fileName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      nav('/login');
      return;
    }

    setDownloadingPdf(pdfId);

    try {
      const response = await fetch(`${API_BASE}/api/pdf/download/${pdfId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          nav('/login');
          return;
        }
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || `case-study-${pdfId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdf(null);
    }
  };

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
                if (t - watchdog.current > 1.5) target.seekTo(watchdog.current, true);
                else watchdog.current = t;
              }, 500);
            }
            if (data === window.YT.PlayerState.PAUSED) {
              setTimeout(() => {
                if (target.getPlayerState() === window.YT.PlayerState.PAUSED) target.playVideo();
              }, 800);
            }
            if (data === window.YT.PlayerState.ENDED) {
              clearInterval(intervalRef.current);
              setEnded(true);
            }
          },
          onError: () =>
            setError('Error playing video. Please refresh the page or contact support.'),
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
        if (v.currentTime - watchdog.current > 1.5) v.currentTime = watchdog.current;
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
    }, 13 * 60 * 1000);
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

      {/* Timer positioned above video */}
      <div className="w-full max-w-3xl flex justify-end mb-2">
        <div className={`font-mono text-lg px-4 py-2 rounded-lg shadow-lg border ${
          timerFinished 
            ? 'bg-green-600/80 text-white border-green-400/50' 
            : 'bg-black/70 text-yellow-300 border-yellow-600/50'
        }`}>
          {timerFinished ? (
            <span>✅ Time Complete!</span>
          ) : (
            <span>⏳ Time Remaining: {formatTime(timeLeft)}</span>
          )}
        </div>
      </div>

      {/* Video container */}
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,0,0,0.4)] border border-red-700 mx-auto relative"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          minHeight: '400px',
        }}
      >
        {isYT ? (
          <div
            className="w-full relative"
            style={{
              paddingBottom: '56.25%',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            }}
          >
            <div id="yt-player" className="absolute top-0 left-0 w-full h-full" />
          </div>
        ) : isHeygen ? (
          <div
            className="w-full flex items-center justify-center p-4"
            style={{
              minHeight: '400px',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #262626 0%, #3d3d3d 50%, #262626 100%)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                minHeight: '400px',
              }}
            >
              <div className="w-full h-full">
                <HeygenChatEmbed iframeUrl={url} />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-full flex items-center justify-center p-4"
            style={{
              minHeight: '400px',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            }}
          >
            <video
              ref={videoRef}
              src={url}
              controls={false}
              disablePictureInPicture
              controlsList="nodownload noplaybackrate"
              className="w-full h-auto object-contain pointer-events-none rounded-lg"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                boxShadow: '0 0 30px rgba(0,0,0,0.8)',
              }}
            />
          </div>
        )}
      </div>

      {/* PDF download button */}
      {pdfs.length > 0 && (
        <div className="w-full max-w-3xl flex justify-end mt-4">
          <button
            onClick={() => handlePdfDownload(pdfs[0]._id, pdfs[0].originalName)}
            disabled={downloadingPdf}
            className="bg-black/60 border border-red-600 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-[0_0_15px_rgba(255,0,0,0.6)] hover:border-red-400 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingPdf ? (
              <>
                <div className="inline-block animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />
                Downloading...
              </>
            ) : (
              <>📥 Download Case Materials</>
            )}
          </button>
        </div>
      )}

      {/* Continue button - shown only when timer is finished */}
      <div className="mt-8 text-center">
        {timerFinished && (
          <>
            <p className="text-green-400 text-xl font-semibold mb-6">
              ✅ Required viewing time completed!
            </p>
            <button
              onClick={handleContinueToQuestions}
              className="bg-green-500 hover:bg-green-600 px-10 py-4 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(0,255,0,0.6)] hover:scale-105 transition-transform"
            >
              Continue to Questions →
            </button>
          </>
        )}

        {!timerFinished && (
          <p className="text-gray-400 text-sm">
            Please wait for the timer to complete before proceeding.
          </p>
        )}
      </div>
    </div>
  );
}