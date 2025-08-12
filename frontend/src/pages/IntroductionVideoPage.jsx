/* src/pages/IntroductionVideoPage.jsx */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RedBackground from '../assets/background.jpg';

const API_BASE =
  import.meta.env.VITE_API_URL || 'https://pc3mcwztgh.ap-south-1.awsapprunner.com';

const STORAGE_KEY_TIME = "introVideoTime";
const STORAGE_KEY_MUTED = "introVideoMuted";
const STORAGE_KEY_VOLUME = "introVideoVolume";

const isYouTubeUrl = (u = '') =>
  /youtu\.?be/.test(u) || /youtube\.com/.test(u);

const getYouTubeId = (raw = '') => {
  try {
    const url = new URL(raw);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    if (url.pathname.startsWith('/watch'))
      return url.searchParams.get('v');
    if (url.pathname.startsWith('/embed/'))
      return url.pathname.split('/embed/')[1];
  } catch {}
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

export default function IntroductionVideoPage() {
  const nav = useNavigate();

  const [url, setUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);

  const vidRef = useRef(null);
  const ytRef = useRef(null);
  const watchDog = useRef(0);

  const [resumeApplied, setResumeApplied] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  // Simple polling-based timer that checks video status every second
  useEffect(() => {
    if (!videoDuration || ended) return;

    const interval = setInterval(() => {
      let currentTime = 0;
      let isPlaying = false;

      // Get current time and playing status from appropriate player
      if (isYouTubeUrl(url) && ytRef.current) {
        try {
          currentTime = ytRef.current.getCurrentTime() || 0;
          isPlaying = ytRef.current.getPlayerState() === window.YT?.PlayerState?.PLAYING;
        } catch (e) {
          // YouTube not ready yet
          return;
        }
      } else if (vidRef.current && !isNaN(vidRef.current.duration)) {
        currentTime = vidRef.current.currentTime || 0;
        isPlaying = !vidRef.current.paused && !vidRef.current.ended;
      } else {
        // Video not ready yet
        return;
      }

      console.log(`Timer check - Current: ${currentTime}, Duration: ${videoDuration}, Playing: ${isPlaying}`);

      // Update playing state if different
      if (isPlaying !== playing) {
        setPlaying(isPlaying);
      }

      // Calculate remaining time
      const remaining = Math.max(0, Math.floor(videoDuration - currentTime));
      setTimeLeft(remaining);

      // Save current time
      if (currentTime > 0) {
        localStorage.setItem(STORAGE_KEY_TIME, currentTime.toString());
      }

      // Check if video ended
      if (remaining <= 0 || currentTime >= videoDuration - 1) {
        setEnded(true);
        setPlaying(false);
        localStorage.removeItem(STORAGE_KEY_TIME);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [url, videoDuration, ended, playing]);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  // Load saved muted and volume from localStorage on mount
  useEffect(() => {
    const savedMuted = localStorage.getItem(STORAGE_KEY_MUTED);
    if (savedMuted !== null) setMuted(savedMuted === 'true');
    const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (savedVolume !== null) setVolume(parseFloat(savedVolume));
  }, []);

  // YouTube setup with improved resume functionality
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
        playerVars: {
          autoplay: 0, // Don't autoplay initially
          playsinline: 1,
          controls: 0,
          rel: 0,
          mute: muted ? 1 : 0,
          start: Math.floor(parseFloat(localStorage.getItem(STORAGE_KEY_TIME)) || 0), // Start from saved time
        },
        events: {
          onReady: (e) => {
            const dur = Math.floor(e.target.getDuration());
            setVideoDuration(dur);

            const savedTime = parseFloat(localStorage.getItem(STORAGE_KEY_TIME)) || 0;

            // Set volume and mute state
            e.target.setVolume(muted ? 0 : volume * 100);
            if (muted) {
              e.target.mute();
            } else {
              e.target.unMute();
            }

            // Resume from saved position if exists and not at the end
            if (savedTime && savedTime < dur - 5) { // Resume if not within 5 seconds of end
              console.log(`Resuming YouTube video from ${savedTime} seconds`);
              
              // Calculate remaining time from saved position
              const remainingTime = dur - savedTime;
              setTimeLeft(Math.max(0, Math.floor(remainingTime)));
              
              // Start playing immediately (video should already be at correct position due to start parameter)
              setTimeout(() => {
                e.target.playVideo();
              }, 500);
            } else if (savedTime >= dur - 5) {
              // Video was completed, remove saved time and show continue button
              localStorage.removeItem(STORAGE_KEY_TIME);
              setEnded(true);
              setTimeLeft(0);
            } else {
              // No saved time, start from beginning
              setTimeLeft(dur);
              e.target.playVideo();
            }
            
            setResumeApplied(true);
            setIsInitialLoad(false);
          },
          onStateChange: ({ data, target }) => {
            console.log('YouTube state changed:', data);
            // Let the polling timer handle everything
            // Just update basic states here
            if (data === YT.PlayerState.ENDED) {
              setEnded(true);
              setPlaying(false);
              localStorage.removeItem(STORAGE_KEY_TIME);
            }
          },
        },
      });
    });

    return () => {
      ytRef.current?.destroy?.();
      // Polling timer will be cleaned up by useEffect
    };
  }, [url, muted, volume]);

  // Native HTML5 video setup with improved resume functionality
  useEffect(() => {
    if (!vidRef.current || isYouTubeUrl(url)) return;
    const v = vidRef.current;

    const handleMeta = () => {
      const dur = Math.floor(v.duration);
      setVideoDuration(dur);
      console.log('Native video metadata loaded. Duration:', dur);

      const savedTime = parseFloat(localStorage.getItem(STORAGE_KEY_TIME)) || 0;
      console.log('Saved time found:', savedTime);

      // Resume from saved position if exists and not at the end
      if (savedTime && savedTime < dur - 5) { // Resume if not within 5 seconds of end
        console.log(`Resuming native video from ${savedTime} seconds`);
        v.currentTime = savedTime;
        watchDog.current = savedTime; // Update watchdog
        
        // Calculate remaining time from saved position
        const remainingTime = dur - savedTime;
        setTimeLeft(Math.max(0, Math.floor(remainingTime)));
        console.log('Set time left to:', Math.floor(remainingTime));
        
        // Ensure video plays after seeking (with user interaction fallback)
        setTimeout(() => {
          v.play().then(() => {
            console.log('Native video resumed successfully');
          }).catch(() => {
            console.log('Autoplay prevented - showing play button');
            setShowPlayButton(true);
          });
        }, 500);
      } else if (savedTime >= dur - 5) {
        // Video was completed, remove saved time and show continue button
        localStorage.removeItem(STORAGE_KEY_TIME);
        setEnded(true);
        setTimeLeft(0);
        console.log('Video was completed, showing continue button');
        return; // Don't auto-play completed video
      } else {
        // No saved time, start from beginning
        setTimeLeft(dur);
        console.log('Starting from beginning, set time left to:', dur);
        v.play().then(() => {
          console.log('Native video started from beginning successfully');
        }).catch(() => {
          console.log('Autoplay prevented - showing play button');
          setShowPlayButton(true);
        });
      }
      
      setResumeApplied(true);
      setIsInitialLoad(false);
    };

    const handlePlay = () => {
      console.log('Native video started playing');
      setShowPlayButton(false);
      // Let polling timer handle the rest
    };

    const handlePause = () => {
      console.log('Native video paused');
      // Let polling timer handle the rest
    };

    const handleEnd = () => {
      console.log('Native video ended');
      setEnded(true);
      setPlaying(false);
      localStorage.removeItem(STORAGE_KEY_TIME);
    };

    const handleTimeUpdate = () => {
      // Additional safeguard to save time during playback
      if (v.played && v.played.length > 0) {
        localStorage.setItem(STORAGE_KEY_TIME, v.currentTime.toString());
      }
      
      // Backup timer in case handlePlay didn't trigger properly
      if (!playing && !v.paused && !ended) {
        console.log('Video is playing but state not updated - fixing');
        setPlaying(true);
        setShowPlayButton(false);
      }
    };

    v.addEventListener('loadedmetadata', handleMeta);
    v.addEventListener('play', handlePlay);
    v.addEventListener('pause', handlePause);
    v.addEventListener('ended', handleEnd);
    v.addEventListener('timeupdate', handleTimeUpdate);

    v.muted = muted;
    v.volume = volume;

    // Don't auto-play here since we handle it in handleMeta

    return () => {
      v.removeEventListener('loadedmetadata', handleMeta);
      v.removeEventListener('play', handlePlay);
      v.removeEventListener('pause', handlePause);
      v.removeEventListener('ended', handleEnd);
      v.removeEventListener('timeupdate', handleTimeUpdate);
      // No need to clear timers - polling timer handles everything
    };
  }, [url, muted, volume, ended]);

  // Anti-seek protection only after resume applied
  useEffect(() => {
    if (!vidRef.current || isYouTubeUrl(url) || !resumeApplied) return;
    const v = vidRef.current;
    const i = setInterval(() => {
      if (v.currentTime - watchDog.current > 1.5) {
        console.log('Preventing forward seek');
        v.currentTime = watchDog.current;
      } else {
        watchDog.current = v.currentTime;
      }
    }, 1000);
    return () => clearInterval(i);
  }, [url, resumeApplied]);

  // Mute/unmute toggle handler
  const toggleMute = () => {
    setMuted((m) => {
      const newMuted = !m;
      localStorage.setItem(STORAGE_KEY_MUTED, newMuted.toString());
      
      // Apply mute/unmute to YouTube player if exists
      if (ytRef.current) {
        if (newMuted) {
          ytRef.current.mute();
        } else {
          ytRef.current.unMute();
        }
      }
      
      return newMuted;
    });
  };

  // Volume change handler (only for native video)
  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    localStorage.setItem(STORAGE_KEY_VOLUME, vol.toString());
    if (vidRef.current) {
      vidRef.current.volume = vol;
      if (vol === 0) {
        setMuted(true);
        localStorage.setItem(STORAGE_KEY_MUTED, 'true');
      } else if (muted) {
        setMuted(false);
        localStorage.setItem(STORAGE_KEY_MUTED, 'false');
      }
    }
  };

  const togglePlay = () => {
    if (isYouTubeUrl(url) && ytRef.current) {
      if (playing) {
        ytRef.current.pauseVideo();
      } else {
        ytRef.current.playVideo();
      }
    } else if (vidRef.current) {
      if (vidRef.current.paused) {
        vidRef.current.play().then(() => {
          setShowPlayButton(false); // Hide play button when successfully playing
        }).catch(console.error);
      } else {
        vidRef.current.pause();
      }
    }
  };

  // Function to handle manual play button click (for autoplay restrictions)
  const handleManualPlay = () => {
    if (isYouTubeUrl(url) && ytRef.current) {
      ytRef.current.playVideo();
    } else if (vidRef.current) {
      vidRef.current.play().then(() => {
        setShowPlayButton(false);
        console.log('Manual play started successfully');
      }).catch(console.error);
    }
  };

  const fullScreen = () => {
    const v = vidRef.current;
    if (!v || isYouTubeUrl(url)) return;
    (v.requestFullscreen || v.webkitRequestFullscreen || v.msRequestFullscreen)?.call(v);
  };

  // Debug timer updates
  useEffect(() => {
    console.log(`Timer updated - Duration: ${videoDuration}, Time Left: ${timeLeft}, Playing: ${playing}`);
  }, [timeLeft, videoDuration, playing]);

  // Add beforeunload event to save current time when user leaves/refreshes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isYouTubeUrl(url) && ytRef.current) {
        try {
          const currentTime = ytRef.current.getCurrentTime();
          if (currentTime > 0) {
            localStorage.setItem(STORAGE_KEY_TIME, currentTime.toString());
          }
        } catch (e) {
          console.log('Could not save YouTube time on unload');
        }
      } else if (vidRef.current) {
        const currentTime = vidRef.current.currentTime;
        if (currentTime > 0) {
          localStorage.setItem(STORAGE_KEY_TIME, currentTime.toString());
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [url]);

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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-6"
      style={{ backgroundImage: `url(${RedBackground})`, backgroundSize: 'cover' }}
    >
      <div className="bg-[#000000b3] backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl p-4 md:p-8 flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-extrabold mb-4 md:mb-6 text-white text-center">
          📽️ Introduction Video
        </h1>

        <div className="relative w-full aspect-video">
          {/* Show manual play button if autoplay was prevented */}
          {showPlayButton && !playing && !ended && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl z-10">
              <button
                onClick={handleManualPlay}
                className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-white text-lg md:text-xl transition-transform hover:scale-105"
                style={{
                  background: 'linear-gradient(45deg, #9a0000, #ff0034 50%, maroon)',
                }}
              >
                ▶️ Play Video
              </button>
            </div>
          )}

          {/* video frame */}
          {isYouTubeUrl(url) ? (
            <div
              id="yt-player"
              className="rounded-xl overflow-hidden shadow-lg w-full h-full"
            />
          ) : (
            <video
              ref={vidRef}
              src={url}
              autoPlay
              playsInline
              controls={false}
              onEnded={() => setEnded(true)}
              onCanPlay={() => {}}
              className="rounded-xl w-full h-full object-contain shadow-lg"
            />
          )}
        </div>

        {/* Timer display */}
        {videoDuration > 0 && (
          <div className="mt-3 md:mt-4 text-center w-full">
            <p className="text-white font-semibold text-sm md:text-base">
              ⏳ Time left: {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, '0')}
            </p>
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <p className="text-gray-400 text-xs md:text-sm mt-1">
                  Duration: {videoDuration}s | Time Left: {timeLeft}s | Playing: {playing ? 'Yes' : 'No'}
                </p>
                <p className="text-gray-400 text-xs md:text-sm">
                  Current Position: {videoDuration - timeLeft}s
                </p>
              </>
            )}
          </div>
        )}

        {/* custom controls */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-4 md:mt-6 items-center w-full">
          <button
            onClick={togglePlay}
            className="px-3 py-1 md:px-4 md:py-2 rounded-lg font-semibold text-white text-sm md:text-base transition"
            style={{
              background: 'linear-gradient(45deg, #9a0000, #ff0034 50%, maroon)',
            }}
          >
            {playing ? '⏸ Pause' : '▶️ Play'}
          </button>

          <button
            onClick={toggleMute}
            className="px-3 py-1 md:px-4 md:py-2 rounded-lg font-semibold text-white text-sm md:text-base transition"
            style={{
              background: 'linear-gradient(45deg, #9a0000, #ff0034 50%, maroon)',
            }}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? '🔇 Mute' : '🔊 Unmute'}
          </button>

          {/* Volume control only for native video */}
          {!isYouTubeUrl(url) && (
            <>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 md:w-32 accent-red-600"
              />

              <button
                onClick={fullScreen}
                className="px-3 py-1 md:px-4 md:py-2 rounded-lg font-semibold text-white text-sm md:text-base transition"
                style={{
                  background: 'linear-gradient(45deg, #9a0000, #ff0034 50%, maroon)',
                }}
              >
                ⛶ Full Screen
              </button>
            </>
          )}
        </div>

        {/* Show resume indicator */}
        {!isInitialLoad && resumeApplied && !ended && (
          <p className="mt-1 md:mt-2 text-green-400 text-xs md:text-sm">
            ✓ Resumed from where you left off
          </p>
        )}

        {/* continue after finished */}
        {ended && (
          <button
            onClick={() => nav('/language-selection')}
            style={{
              background: 'linear-gradient(45deg, #9a0000, #ff0034 50%, maroon)',
              color: 'white',
            }}
            className="mt-4 md:mt-8 px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold hover:brightness-110 transition text-sm md:text-base"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}