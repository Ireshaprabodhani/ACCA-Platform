import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Utility to detect YouTube URLs
const getYouTubeId = (url) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
  return match ? match[1] : null;
};

const CaseVideoPage = () => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch video URL from API
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await axios.get('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/case/video', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setVideoUrl(response.data.url);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch video:', err);
        setError('Failed to load video. Please try again.');
        setIsLoading(false);
        
        // Redirect to login if unauthorized
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchVideo();
  }, [navigate]);

  // YouTube player setup
  useEffect(() => {
    if (!videoUrl || isLoading) return;
    const youTubeId = getYouTubeId(videoUrl);

    if (youTubeId) {
      // Load YouTube API if not already loaded
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.head.appendChild(tag);
      }

      const initializePlayer = () => {
        playerRef.current = new window.YT.Player('yt-player', {
          videoId: youTubeId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            mute: 1, // Required for autoplay in most browsers
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              console.log('YouTube player ready');
              event.target.unMute(); // Unmute after player is ready
              event.target.playVideo();
              lastTimeRef.current = 0;
            },
            onStateChange: (event) => {
              const player = event.target;
              
              if (event.data === window.YT.PlayerState.PLAYING) {
                console.log('Video started playing');
                
                // Clear any existing interval
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                }
                
                // Start skip protection
                intervalRef.current = setInterval(() => {
                  const currentTime = player.getCurrentTime();
                  
                  // If user skipped ahead more than 1 second, rewind
                  if (currentTime - lastTimeRef.current > 1.5) {
                    console.log('Skip detected, rewinding...');
                    player.seekTo(lastTimeRef.current, true);
                  } else {
                    lastTimeRef.current = currentTime;
                  }
                }, 500);
              }
              
              if (event.data === window.YT.PlayerState.ENDED) {
                console.log('Video ended');
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                }
                setIsEnded(true);
              }
              
              if (event.data === window.YT.PlayerState.PAUSED) {
                // Auto-resume if video is paused (prevents pausing)
                setTimeout(() => {
                  if (player.getPlayerState() === window.YT.PlayerState.PAUSED) {
                    player.playVideo();
                  }
                }, 1000);
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              setError('Error playing video. Please refresh the page.');
            }
          },
        });
      };

      // Initialize player when API is ready
      if (window.YT && window.YT.Player) {
        initializePlayer();
      } else {
        window.onYouTubeIframeAPIReady = initializePlayer;
      }
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoUrl, isLoading]);

  // Native video setup with skip protection
  useEffect(() => {
    if (!videoUrl || getYouTubeId(videoUrl) || isLoading) return;
    
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      console.log('Native video loaded');
      lastTimeRef.current = 0;
    };

    const handlePlay = () => {
      console.log('Native video started playing');
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Start skip protection
      intervalRef.current = setInterval(() => {
        const currentTime = video.currentTime;
        
        // If user skipped ahead more than 1 second, rewind
        if (currentTime - lastTimeRef.current > 1.5) {
          console.log('Skip detected, rewinding...');
          video.currentTime = lastTimeRef.current;
        } else {
          lastTimeRef.current = currentTime;
        }
      }, 500);
    };

    const handleEnded = () => {
      console.log('Native video ended');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsEnded(true);
    };

    const handlePause = () => {
      // Auto-resume if video is paused (prevents pausing)
      setTimeout(() => {
        if (video.paused && !video.ended) {
          video.play().catch(console.error);
        }
      }, 1000);
    };

    // Add event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('pause', handlePause);

    // Attempt autoplay
    const tryAutoplay = async () => {
      try {
        video.muted = true; // Ensure muted for autoplay
        await video.play();
        
        // Unmute after a short delay if autoplay succeeds
        setTimeout(() => {
          video.muted = false;
        }, 1000);
      } catch (err) {
        console.error('Autoplay failed:', err);
        setError('Please click the video to start playback.');
      }
    };

    if (video.readyState >= 2) {
      tryAutoplay();
    } else {
      video.addEventListener('loadeddata', tryAutoplay, { once: true });
    }

    // Cleanup
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('pause', handlePause);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoUrl, isLoading]);

  // Prevent right-click and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // Prevent common video control shortcuts
      if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
          e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'k' || 
          e.key === 'j' || e.key === 'l' || e.key === 'm') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleContinue = useCallback(() => {
    navigate('/case-questions');
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Case Study Video</h1>
      
      <div className="w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl">
        {getYouTubeId(videoUrl) ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <div
              id="yt-player"
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
            className="w-full h-auto"
            style={{ 
              pointerEvents: 'none', // Prevent interaction
              minHeight: '400px'
            }}
          />
        )}
      </div>

      <div className="mt-8 text-center">
        {isEnded ? (
          <div className="space-y-4">
            <p className="text-green-400 text-lg font-semibold">
              ✅ Video completed successfully!
            </p>
            <button
              onClick={handleContinue}
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-full text-lg font-bold transition-colors duration-200 transform hover:scale-105"
            >
              Continue to Questions →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-yellow-400 text-lg">
              📺 Please watch the entire video to continue
            </p>
            <p className="text-gray-400 text-sm">
              ⚠️ Skipping is not allowed • Video must be watched completely
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseVideoPage;