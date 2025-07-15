import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL || 'https://pc3mcwztgh.ap-south-1.awsapprunner.com';

const HeygenChatEmbed = () => {
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
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!iframeUrl) return null;

  return (
    <div
      className={`chat-embed ${isVisible ? 'visible' : 'hidden'} ${
        isExpanded ? 'expanded' : ''
      }`}
      style={{
        margin: '0 auto',
        ...(isExpanded
          ? clientWidth < 540
            ? { height: 'calc(100vh - 120px)', width: 'calc(100% - 20px)' }
            : { height: '600px', width: 'calc(600px * 16 / 9)' }
          : { height: '180px', width: '180px' }),
      }}
    >
      <div className="chat-container" style={{ width: '100%', height: '100%' }}>
        <iframe
          src={iframeUrl}
          title="Heygen AI Avatar"
          className="chat-iframe"
          allow="microphone; autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none' }}
          role="dialog"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default HeygenChatEmbed;
