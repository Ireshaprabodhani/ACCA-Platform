/* src/pages/CaseVideoPage.jsx */
import React from 'react';
import HeygenChatEmbed from '../components/HeygenChatEmbed';

export default function CaseVideoPage() {
  return (
    <div className="min-h-screen bg-[#616a7c] text-white flex flex-col items-center p-4 relative justify-center">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Chat with People's Leasing</h1>

      {/* AI Avatar Embed */}
      <div className="w-full flex justify-center">
        <HeygenChatEmbed />
      </div>

      {/* Optional button to continue */}
      <div className="mt-8 text-center">
        <button
          onClick={() => window.location.href = '/case-questions'}
          className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-full text-lg font-bold transition-transform duration-200 hover:scale-105"
        >
          Continue to Questions →
        </button>
      </div>
    </div>
  );
}
