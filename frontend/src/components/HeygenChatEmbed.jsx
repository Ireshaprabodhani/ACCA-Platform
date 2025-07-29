import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL || 'https://pc3mcwztgh.ap-south-1.awsapprunner.com';

const HeygenChatEmbed = ({ onEnded }) => {
  const [iframeUrl, setIframeUrl] = useState('');
  const [clientWidth, setClientWidth] = useState(window.innerWidth);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios
      .get(`${API_BASE}/api/case/video`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        if (data?.url) setIframeUrl(data.url);
      })
      .catch((err) => {
        console.error('Failed to load Heygen iframe:', err);
      });
  }, []);

  useEffect(() => {
    const handleResize = () => setClientWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMessage = (e) => {
      if (typeof e.origin !== 'string') return;
      if (e.origin.includes('heygen.com') && e.data?.type === 'streaming-embed') {
        if (e.data.action === 'init') setIsVisible(true);
        else if (e.data.action === 'show') setIsExpanded(true);
        else if (e.data.action === 'hide') setIsExpanded(false);

        if (e.data.action === 'ended' && typeof onEnded === 'function') {
          onEnded();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnded]);

  if (!iframeUrl) return null;

  return (
    <div className={`
      mx-auto relative
      ${isExpanded ? 
        (clientWidth < 540 ? 
          'w-full h-[calc(100vh-100px)] min-h-[600px] px-2' : 
          'w-full max-w-[calc(700px*16/9)] h-[700px] px-4'
        ) : 
        'w-[200px] h-[200px]'
      }
    `}>
      <iframe
        src={iframeUrl}
        title="Heygen AI Avatar"
        className="w-full h-full border-none rounded-none"
        allow="microphone; autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
};

export default HeygenChatEmbed;