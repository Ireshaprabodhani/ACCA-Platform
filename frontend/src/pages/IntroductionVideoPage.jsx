import React, { useRef, useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const getYouTubeId = (url) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : null;
};

const isYouTubeUrl = (url) => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const loadYouTubeAPI = () => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
      };
    }
  });
};

const IntroductionVideoPage = () => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastAllowedTimeRef = useRef(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [isEnded, setIsEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const navigate = useNavigate();

  // ✅ Check with backend if user already attempted quiz
  useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) { navigate('/login'); return; }

  axios.get(
      `http://localhost:5000/api/quiz/has-attempted?language=English`,
      { headers:{Authorization:`Bearer ${token}`} }
  )
  .then(res => {
      if (res.data.hasAttempted) {
         // already did the quiz – send to thank‑you *now*
         navigate('/thank-you');
      }
  })
  .catch(err => {
      console.error('hasAttempted check:', err.response?.data || err);
      // do **not** redirect on error – just let the user continue
  });
}, [navigate]);


  // ✅ Fetch video URL
  useEffect(() => {
    axios
      .get('http://localhost:5000/api/video/intro', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then((res) => setVideoUrl(res.data.url))
      .catch((err) => console.error('Failed to load video:', err));
  }, []);

  // YouTube video handler
  useEffect(() => {
    if (!isYouTubeUrl(videoUrl)) return;

    loadYouTubeAPI().then((YT) => {
      const player = new YT.Player('youtube-player', {
        height: '450',
        width: '800',
        videoId: getYouTubeId(videoUrl),
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
        },
        events: {
          onReady: (event) => {
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              const interval = setInterval(() => {
                const currentTime = player.getCurrentTime();
                if (currentTime - lastAllowedTimeRef.current > 1.5) {
                  player.seekTo(lastAllowedTimeRef.current, true);
                } else {
                  lastAllowedTimeRef.current = currentTime;
                }
              }, 1000);
              playerRef.current = { player, interval };
            }

            if (event.data === YT.PlayerState.ENDED) {
              clearInterval(playerRef.current?.interval);
              setIsEnded(true);
              navigate('/language-selection');
            }
          },
        },
      });
    });
  }, [videoUrl, navigate]);

  // HTML5 video handler
  useEffect(() => {
    if (!videoRef.current || isYouTubeUrl(videoUrl)) return;

    const video = videoRef.current;
    const interval = setInterval(() => {
      if (video.currentTime - lastAllowedTimeRef.current > 1.5) {
        video.currentTime = lastAllowedTimeRef.current;
      } else {
        lastAllowedTimeRef.current = video.currentTime;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [videoUrl]);

  const handleEnded = () => {
    setIsEnded(true);
    navigate('/language-selection');
  };

  const handleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current || isYouTubeUrl(videoUrl)) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Introduction Video</h1>

      {isYouTubeUrl(videoUrl) ? (
        <div id="youtube-player" className="rounded-lg shadow-lg" />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          autoPlay
          playsInline
          controls={false}
          onEnded={handleEnded}
          onCanPlay={() => {
            videoRef.current?.play().catch((e) => console.log('Play failed:', e));
          }}
          className="rounded-lg max-w-full max-h-[60vh] shadow-lg"
        />
      )}

      {!isYouTubeUrl(videoUrl) && (
        <div className="flex items-center justify-center space-x-4 mt-4">
          <button
            onClick={togglePlayPause}
            className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            onChange={(e) => {
              if (videoRef.current) {
                videoRef.current.volume = e.target.value;
              }
            }}
            className="w-24"
            defaultValue="1"
          />
          <button
            onClick={handleFullScreen}
            className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
          >
            Full Screen
          </button>
        </div>
      )}
    </div>
  );
};

export default IntroductionVideoPage;
