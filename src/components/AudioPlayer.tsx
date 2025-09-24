import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, Download } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useGlobalAudioPlayer } from "@/hooks/useGlobalAudioPlayer";

interface AudioPlayerProps {
  fileUrl: string;
  fileName: string;
  fileId: string;
}

export const AudioPlayer = ({ fileUrl, fileName, fileId }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([50]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentlyPlaying, stopOthers, setCurrentlyPlaying } = useGlobalAudioPlayer();

  // Use file URL directly (assuming it's accessible)
  useEffect(() => {
    setAudioUrl(fileUrl);
  }, [fileUrl]);

  // Track play when audio is played (not download)
  const trackPlay = async () => {
    try {
      await apiClient.recordPlay(fileId);
    } catch (error) {
      console.error("Error tracking play:", error);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentlyPlaying(null);
    } else {
      // Stop any other audio players
      stopOthers(fileId);
      
      audioRef.current.play();
      setIsPlaying(true);
      
      // Track as play when first played
      if (currentTime === 0) {
        trackPlay();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (!audioUrl) return;
    
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      // Track download (not play)
      await apiClient.recordDownload(fileId);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground">Carregando áudio...</div>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground">Erro ao carregar áudio</div>
      </div>
    );
  }

  return (
    <div className="bg-muted p-4 rounded-lg space-y-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        data-file-id={fileId}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentlyPlaying(null);
        }}
        preload="metadata"
      />
      
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlayPause}
          className="h-8 w-8 p-0"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div className="flex-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer audio-progress"
          />
        </div>
        
        <div className="text-xs text-muted-foreground min-w-[80px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 max-w-[100px]">
          <Slider
            value={volume}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="cursor-pointer"
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownload}
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {fileName}
      </div>
    </div>
  );
};