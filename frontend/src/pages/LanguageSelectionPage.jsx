import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import music from '/1.mp3';
import RedBackground from '../assets/background.jpg';

const LanguageSelectionPage = () => {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const handleSelectLanguage = (lang) => {
    audioRef.current?.pause();
    navigate(`/quiz?language=${lang}`);
  };

  useEffect(() => {
    const audio = audioRef.current;
    const playMusic = () => {
      if (audio && audio.paused) {
        audio.volume = 0.5;
        audio.loop = true;
        audio.play().catch((e) => {
          console.warn("Autoplay blocked:", e);
        });
      }
    };
    playMusic();
    return () => audio?.pause();
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: `url(${RedBackground})` }}
    >
      {/* 🎵 Background Music */}
      <audio ref={audioRef} src={music} preload="auto" />

      <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-[#000000b3] backdrop-blur-lg rounded-3xl px-12 py-10 shadow-2xl flex flex-col items-center justify-center w-full max-w-3xl min-h-[550px]"
              >
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold text-white text-center mb-8 leading-snug"
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
            className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-black px-8 py-4 rounded-2xl shadow-lg text-2xl font-bold hover:brightness-110 transition"
          >
            Sinhala
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectLanguage('English')}
            className="bg-gradient-to-br from-red-500 to-pink-600 text-white px-8 py-4 rounded-2xl shadow-lg text-2xl font-bold hover:brightness-110 transition"
          >
            English
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 text-lg italic text-white/80 text-center"
        >
          Pick your preferred language to begin your fun quiz!
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LanguageSelectionPage;
