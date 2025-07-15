import React, { useEffect, useState } from 'react';

const HeygenChatEmbed = () => {
  const streamingLink = 'https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJhMDBkZmZkNDk2MjI0Yzk1OGI1MWFkYzI3NGY4NzhjMyIsInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3YzL2EwMGRmZmQ0OTYyMjRjOTU4YjUxYWRjMjc0Zjg3OGMzL2Z1bGwvMi4yL3ByZXZpZXdfdGFyZ2V0LndlYnAiLCJuZWVkUmVtb3ZlQmFja2dyb3VuZCI6ZmFsc2UsImtub3dsZWRnZUJhc2VJZCI6ImZkYjY2Mzc0MzMwMzQ5M2Q4MzZmZDg1ZDVhMDVhYThmIiwidXNlcm5hbWUiOiJkZmUzMmU4ZThkMmY0MDRjOTc0OTNiZmQ5MjhhMzBiYyJ9&inIFrame=1';
  const host = 'https://labs.heygen.com';

  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [clientWidth, setClientWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setClientWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin === host && e.data?.type === 'streaming-embed') {
        if (e.data.action === 'init') setIsVisible(true);
        else if (e.data.action === 'show') setIsExpanded(true);
        else if (e.data.action === 'hide') setIsExpanded(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div
      className={`chat-embed ${isVisible ? 'visible' : 'hidden'} ${isExpanded ? 'expanded' : ''}`}
      style={{
        margin: '0 auto',
        ...(isExpanded
          ? clientWidth < 540
            ? { height: 'calc(100vh - 120px)', width: 'calc(100% - 20px)' }
            : { height: '600px', width: 'calc(600px * 16 / 9)' }
          : { height: '180px', width: '180px' }),
      }}
    >
      <div className="chat-container">
        <iframe
          src={streamingLink}
          title="Streaming Embed"
          className="chat-iframe"
          allow="microphone"
          allowFullScreen={false}
          role="dialog"
        ></iframe>
      </div>
    </div>
  );
};

export default HeygenChatEmbed;
