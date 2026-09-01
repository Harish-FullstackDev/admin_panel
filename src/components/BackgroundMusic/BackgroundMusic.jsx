"use client";
import { useRef, useState } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleMusic = async () => {
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.volume = 1.0;
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        loop
        onError={(e) => console.error("Audio error:", e)}
      >
        <source src="/backgroundmusic1.mp3" type="audio/mpeg" />
        <source src="/backgroundmusic.ogg" type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>

      <button
        onClick={toggleMusic}
        className="fixed bottom-4 right-4 z-40 p-3 bg-[#51A2FF] hover:bg-blue-500 text-white rounded-full shadow-lg transition-colors duration-200 sm:right-6 sm:bottom-2" // Adjusted positioning
        aria-label={isPlaying ? "Pause background music" : "Play background music"}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    </>
  );
}