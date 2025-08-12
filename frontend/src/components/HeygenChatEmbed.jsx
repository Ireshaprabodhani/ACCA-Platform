import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL || 'https://pc3mcwztgh.ap-south-1.awsapprunner.com';

const HeygenChatEmbed = ({ iframeUrl, onEnded }) => {
  const [clientWidth, setClientWidth] = useState(window.innerWidth);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

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
        // Force expanded state even when HeyGen tries to minimize
        else if (e.data.action === 'hide') setIsExpanded(true);

        if (e.data.action === 'ended' && typeof onEnded === 'function') {
          onEnded();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnded]);

  if (!iframeUrl) return null;

  // Always maintain full width regardless of HeyGen's internal state
  return (
    <div className="w-full h-full min-h-[400px] relative">
      <iframe
        src={iframeUrl}
        title="Heygen AI Avatar"
        className="w-full h-full border-none rounded-lg"
        style={{
          minHeight: '400px',
          width: '100%',
          height: '100%'
        }}
        allow="microphone; autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
};

export default HeygenChatEmbed;