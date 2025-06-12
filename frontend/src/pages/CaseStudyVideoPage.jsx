import React, { useRef, useState, useEffect } from 'react';
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
  const [videoUrl, setVideoUrl] = useState('');
  const [isEnded, setIsEnded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/case/video', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => setVideoUrl(res.data.url))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!videoUrl) return;
    const youTubeId = getYouTubeId(videoUrl);

    if (youTubeId) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        const player = new window.YT.Player('yt-player', {
          videoId: youTubeId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            mute: 1, // ✅ Mute required for autoplay
          },
          events: {
            onReady: (e) => {
              e.target.playVideo();
            },
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.PLAYING) {
                const interval = setInterval(() => {
                  const t = player.getCurrentTime();
                  if (t - lastTimeRef.current > 1) {
                    player.seekTo(lastTimeRef.current);
                  } else {
                    lastTimeRef.current = t;
                  }
                }, 500);
                playerRef.current = { player, interval };
              }
              if (e.data === window.YT.PlayerState.ENDED) {
                clearInterval(playerRef.current.interval);
                setIsEnded(true);
              }
            },
          },
        });
      };
    }
  }, [videoUrl]);

  // Native video autoplay with protection against skipping
  useEffect(() => {
    if (!videoUrl || getYouTubeId(videoUrl)) return;
    const video = videoRef.current;
    if (!video) return;

    const interval = setInterval(() => {
      if (video.currentTime - lastTimeRef.current > 0.5) {
        video.currentTime = lastTimeRef.current;
      } else {
        lastTimeRef.current = video.currentTime;
      }
    }, 300);

    const tryPlay = async () => {
      try {
        await video.play();
      } catch (err) {
        console.error('Autoplay failed:', err);
      }
    };

    tryPlay();

    return () => clearInterval(interval);
  }, [videoUrl]);

  const handleContinue = () => navigate('/case-questions');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <h1 className="text-3xl mb-6">Case Study Video</h1>

      {getYouTubeId(videoUrl) ? (
        <div
          id="yt-player"
          className="w-full max-w-3xl h-[60vh] rounded-lg shadow-lg"
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          controls={false}
          className="w-full max-w-3xl rounded-lg shadow-lg"
          onEnded={() => setIsEnded(true)}
        />
      )}

      {isEnded ? (
        <button
          onClick={handleContinue}
          className="mt-6 bg-green-600 px-6 py-3 rounded-full hover:bg-green-700"
        >
          Continue to Questions
        </button>
      ) : (
        <p className="mt-6 italic text-gray-400">
          ⚠️ You must watch the entire video to continue.
        </p>
      )}
    </div>
  );
};

export default CaseVideoPage;
