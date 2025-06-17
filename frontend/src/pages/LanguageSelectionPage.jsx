import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import music from '/1.mp3'

const LanguageSelectionPage = () => {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const handleSelectLanguage = (lang) => {
    // Stop music before navigation
    audioRef.current?.pause();
    navigate(`/quiz?language=${lang}`);
  };

  // Autoplay background music
  useEffect(() => {
    const audio = audioRef.current;
    const playMusic = () => {
      if (audio && audio.paused) {
        audio.volume = 0.5;
        audio.loop = true;
        audio.play().catch((e) => {
          // Some browsers block autoplay until interaction
          console.warn("Autoplay blocked:", e);
        });
      }
    };

    playMusic();

    return () => audio?.pause(); // Cleanup on unmount
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 p-6">
      {/* 🎵 Background Music */}
      <audio ref={audioRef} src={music} preload="auto" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white bg-opacity-90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl flex flex-col items-center w-full max-w-xl"
      >
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600 text-center mb-8"
        >
          🌐 Choose Your Language
        </motion.h1>

        <motion.div
          className="flex flex-col md:flex-row gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectLanguage('Sinhala')}
            className="bg-yellow-300 text-purple-800 px-8 py-4 rounded-2xl shadow-md text-2xl font-bold hover:bg-yellow-400 transition"
          >
            Sinhala
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectLanguage('English')}
            className="bg-blue-400 text-white px-8 py-4 rounded-2xl shadow-md text-2xl font-bold hover:bg-blue-500 transition"
          >
            English
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 text-lg italic text-purple-900/70 text-center"
        >
          Pick your preferred language to begin your fun quiz!
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LanguageSelectionPage;
