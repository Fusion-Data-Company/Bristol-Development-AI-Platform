import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  X, 
  Play, 
  Pause, 
  StopCircle, 
  MessageSquare,
  Zap,
  Brain,
  Cpu,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  preview_url?: string;
}

interface ElevenLabsWidgetProps {
  className?: string;
}

export function ElevenLabsWidget({ className }: ElevenLabsWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM'); // Default Rachel voice
  const [stability, setStability] = useState([0.5]);
  const [clarity, setClarity] = useState([0.75]);
  const [volume, setVolume] = useState([0.8]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Load voices on component mount
  useEffect(() => {
    loadVoices();
  }, []);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const loadVoices = async () => {
    try {
      const response = await fetch('/api/elevenlabs/voices');
      if (response.ok) {
        const voicesData = await response.json();
        setVoices(voicesData.voices || []);
      } else {
        // Set default voices if API fails
        setVoices([
          { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade' },
          { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade' },
          { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade' },
          { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade' },
          { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade' },
          { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade' },
        ]);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
      // Set default voices on error
      setVoices([
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade' },
        { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade' },
        { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade' },
        { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade' },
        { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade' },
      ]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/wav' });
        processRecordedAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: 'Recording Started',
        description: 'Speak now to convert speech to text',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Could not access microphone',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: 'Recording Stopped',
        description: 'Processing your audio...',
      });
    }
  };

  const processRecordedAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/elevenlabs/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setText(result.text || '');
        toast({
          title: 'Speech Converted',
          description: 'Your speech has been converted to text',
        });
      } else {
        toast({
          title: 'Conversion Failed',
          description: 'Could not convert speech to text',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Processing Error',
        description: 'Error processing recorded audio',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: 'No Text',
        description: 'Please enter text to convert to speech',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice_id: selectedVoice,
          stability: stability[0],
          clarity_boost: clarity[0],
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.src = '';
        }

        const audio = new Audio(audioUrl);
        audio.volume = volume[0];
        audio.onended = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);
        
        setCurrentAudio(audio);
        await audio.play();
        
        toast({
          title: 'Speech Generated',
          description: 'Audio is now playing',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Generation Failed',
          description: error.message || 'Could not generate speech',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      toast({
        title: 'Generation Error',
        description: 'Error generating speech',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
        setIsPlaying(false);
      } else {
        currentAudio.play();
        setIsPlaying(true);
      }
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (currentAudio) {
      currentAudio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-2xl border-2 border-purple-400/50 group transition-all duration-300 hover:scale-110"
        >
          <div className="relative">
            <Volume2 className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div 
        className={`bg-slate-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400/30 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-auto'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-400/20">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <h3 className="text-white font-semibold text-sm">ElevenLabs AI Voice</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-purple-300 hover:text-white hover:bg-purple-600/20"
            >
              {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-purple-300 hover:text-white hover:bg-red-600/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-4 space-y-4">
            {/* Voice Selection */}
            <div>
              <label className="text-purple-300 text-xs font-medium mb-2 block">Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-slate-800 border-purple-400/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-purple-400/30">
                  {voices.map((voice) => (
                    <SelectItem key={voice.voice_id} value={voice.voice_id} className="text-white hover:bg-purple-600/20">
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text Input */}
            <div>
              <label className="text-purple-300 text-xs font-medium mb-2 block">Text to Speech</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to convert to speech..."
                className="bg-slate-800 border-purple-400/30 text-white placeholder-purple-300/50 min-h-[80px] resize-none"
              />
            </div>

            {/* Voice Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-purple-300 text-xs font-medium mb-2 block">
                  Stability: {stability[0].toFixed(2)}
                </label>
                <Slider
                  value={stability}
                  onValueChange={setStability}
                  max={1}
                  min={0}
                  step={0.01}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-purple-300 text-xs font-medium mb-2 block">
                  Clarity: {clarity[0].toFixed(2)}
                </label>
                <Slider
                  value={clarity}
                  onValueChange={setClarity}
                  max={1}
                  min={0}
                  step={0.01}
                  className="w-full"
                />
              </div>
            </div>

            {/* Volume Control */}
            <div>
              <label className="text-purple-300 text-xs font-medium mb-2 block">
                Volume: {Math.round(volume[0] * 100)}%
              </label>
              <Slider
                value={volume}
                onValueChange={(value) => {
                  setVolume(value);
                  if (currentAudio) {
                    currentAudio.volume = value[0];
                  }
                }}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {/* Recording Button */}
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              {/* Generate Speech Button */}
              <Button
                onClick={generateSpeech}
                disabled={isLoading || !text.trim()}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>

              {/* Playback Controls */}
              {currentAudio && (
                <>
                  <Button
                    onClick={togglePlayPause}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={stopAudio}
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    <StopCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={toggleMute}
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>

            {/* Status */}
            <div className="text-xs text-purple-300 text-center">
              {isLoading && 'Processing...'}
              {isRecording && 'Recording... Click mic to stop'}
              {isPlaying && 'Playing audio...'}
              {!isLoading && !isRecording && !isPlaying && 'Ready for voice generation'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}