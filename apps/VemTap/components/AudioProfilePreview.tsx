import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from 'lucide-react';
import { getDownloadUrl } from '../utils/upload';

interface AudioProfilePreviewProps {
  companyName?: string;
  title?: string;
  description?: string;
  name?: string;
  artist?: string;
  audioUrl?: string;
  coverImage?: string;
  themeColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonText?: string;
}

const AudioProfilePreview: React.FC<AudioProfilePreviewProps> = ({ 
  companyName = "QR Thrive Music",
  title = "Exclusive Audio Content",
  description = "Listen to our latest podcast episode or music track directly from your device.",
  name = "New Audio Track",
  artist = "Unknown Artist",
  audioUrl,
  coverImage = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
  themeColor = "#3b82f6",
  textColor = "#ffffff",
  buttonColor = "rgba(255, 255, 255, 0.2)",
  buttonTextColor = "#ffffff",
  buttonText = "Learn More",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const p = (audio.currentTime / audio.duration) * 100;
      setProgress(p || 0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => setIsPlaying(false));
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden" style={{ backgroundColor: themeColor }}>
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Header Info */}
        <div className="px-6 pt-12 pb-6 text-center" style={{ color: textColor }}>
          <p className="text-[11px] opacity-90 font-bold mb-2 tracking-[0.2em] uppercase">{companyName}</p>
          <h1 className="text-2xl font-black mb-3 leading-tight tracking-tight">{title}</h1>
          <p className="text-[12px] opacity-80 leading-relaxed max-w-[280px] mx-auto mb-8 font-medium">{description}</p>
          
          <div className="flex gap-3">
            <button 
              className="flex-1 py-4 rounded-2xl font-bold text-sm backdrop-blur-md transition-all active:scale-95 border border-white/20"
              style={{ backgroundColor: buttonColor, color: buttonTextColor }}
            >
              {buttonText}
            </button>
            <a 
              href={audioUrl ? getDownloadUrl(audioUrl) : '#'}
              download={name}
              className="w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all active:scale-95 border border-white/20"
              style={{ backgroundColor: buttonColor, color: buttonTextColor }}
            >
              <Download size={20} />
            </a>
          </div>
        </div>

        {/* Player Card */}
        <div className="bg-white rounded-t-[40px] p-8 shadow-2xl flex flex-col items-center min-h-[450px] mt-4 relative">
          {/* Animated Vinyl/Cover */}
          <div className="relative group mb-10 mt-2">
            <div className={`w-48 h-48 rounded-full bg-gray-900 flex items-center justify-center relative shadow-2xl transition-all duration-1000 ${isPlaying ? 'rotate-[360deg] animate-[spin_8s_linear_infinite]' : ''}`}>
              {/* Vinyl grooves effect */}
              <div className="absolute inset-0 rounded-full border-[10px] border-black/10 opacity-30" />
              <div className="absolute inset-4 rounded-full border-[1px] border-white/5 opacity-20" />
              
              <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-gray-800">
                <img src={coverImage} alt="Album Art" className="w-full h-full object-cover" />
              </div>
              
              {/* Center hole */}
              <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-4 border-gray-900 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
              </div>
            </div>
            
            {/* Play Button Overlay on Disc */}
            <button 
              onClick={togglePlay}
              className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-600/90 text-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} className="ml-1" fill="white" />}
            </button>
          </div>

          {/* Track Info */}
          <div className="text-center w-full mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-1 truncate px-4">{name}</h2>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{artist}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full px-2 mb-10">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-blue-600 transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400">
              <span>{Math.floor((audioRef.current?.currentTime || 0) / 60)}:{(Math.floor((audioRef.current?.currentTime || 0) % 60)).toString().padStart(2, '0')}</span>
              <span>{Math.floor((audioRef.current?.duration || 0) / 60) || 0}:{(Math.floor((audioRef.current?.duration || 0) % 60) || 0).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8 w-full">
            <button className="text-gray-300 hover:text-gray-600 transition-colors">
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} className="ml-1" fill="white" />}
            </button>
            <button className="text-gray-300 hover:text-gray-600 transition-colors">
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>

          <div className="mt-10 flex items-center gap-2 text-gray-400">
             <Volume2 size={16} />
             <div className="w-20 h-1 bg-gray-100 rounded-full">
                <div className="w-2/3 h-full bg-gray-300 rounded-full" />
             </div>
          </div>

          <audio 
            ref={audioRef}
            src={audioUrl}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioProfilePreview;
