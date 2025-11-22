import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { ArrowLeft, Mic, CheckCircle, XCircle, Play, RefreshCw, Volume2, Award, Languages } from 'lucide-react';
import { DictationItem, UserProfile } from '../types';
import { generateDictationList, generateSpeech } from '../services/geminiService';

interface DictationViewProps {
  user: UserProfile;
  onBack: () => void;
}

// Helper to decode base64 to bytes
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode raw PCM data from Gemini API
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const SUPPORTED_LANGUAGES = ['English', 'Tamil', 'Hindi', 'Kannada'];

export const DictationView: React.FC<DictationViewProps> = ({ user, onBack }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [words, setWords] = useState<DictationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  // Use Ref for AudioContext to persist across renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Cleanup audio context on unmount
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const startDictation = async (language: string) => {
    setSelectedLanguage(language);
    setIsLoading(true);
    
    // Initialize AudioContext with specific sample rate for Gemini
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new Ctx({ sampleRate: 24000 });

    const items = await generateDictationList(user.age, language);
    setWords(items);
    setIsLoading(false);
  };

  const playWord = async () => {
    if (!words[currentIndex] || !audioContextRef.current) return;
    
    // Resume context if suspended (browsers block autoplay)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsPlayingAudio(true);

    const base64Audio = await generateSpeech(words[currentIndex].text, selectedLanguage || 'English');
    
    if (base64Audio) {
      try {
        const audioData = decodeBase64(base64Audio);
        // Use the manual PCM decoder
        const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        source.onended = () => setIsPlayingAudio(false);
      } catch (e) {
        console.error("Audio play error", e);
        setIsPlayingAudio(false);
      }
    } else {
      setIsPlayingAudio(false);
    }
  };

  const handleCheck = () => {
    if (!userInput.trim()) return;
    const isCorrect = userInput.trim().toLowerCase() === words[currentIndex].text.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setFeedback(null);
    } else {
      setIsComplete(true);
    }
  };

  // Language Selection Screen
  if (!selectedLanguage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b px-4 py-3 flex items-center shadow-sm sticky top-0">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full mr-2">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">New Dictation Session</h2>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
           <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Languages size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Choose a Language</h2>
              <p className="text-slate-500 mb-8">Which language do you want to practice spelling in today?</p>
              
              <div className="space-y-3">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => startDictation(lang)}
                    className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-semibold text-slate-700 flex items-center justify-between group"
                  >
                    <span>{lang}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-indigo-600 text-sm">Select →</span>
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        <p className="text-slate-500">Creating your {selectedLanguage} spelling list...</p>
      </div>
    );
  }

  // Completion Screen
  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-600">
            <Award size={48} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Great Job, {user.name}!</h2>
          <p className="text-slate-500 mb-8">You've completed today's {selectedLanguage} dictation.</p>
          <Button onClick={onBack} size="lg" className="w-full">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center shadow-sm sticky top-0">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full mr-2">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Dictation Practice</h2>
          <p className="text-xs text-slate-500 font-medium">{selectedLanguage}</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
        <div className="w-full bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
          
          {/* Progress */}
          <div className="flex justify-between items-center mb-8 text-slate-400 text-sm font-semibold tracking-wide uppercase">
            <span>Word {currentIndex + 1} of {words.length}</span>
            <span>Spelling Bee</span>
          </div>

          {/* Play Button Area */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <button 
              onClick={playWord}
              disabled={isPlayingAudio}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                isPlayingAudio 
                  ? 'bg-pink-100 text-pink-400 scale-95' 
                  : 'bg-gradient-to-br from-rose-400 to-pink-600 text-white hover:scale-105 hover:shadow-pink-300'
              }`}
            >
               {isPlayingAudio ? (
                 <Volume2 size={48} className="animate-pulse" />
               ) : (
                 <Play size={48} className="ml-2" />
               )}
            </button>
            <p className="text-slate-500 text-sm">Tap to listen to the word</p>
            
            {/* Hint */}
            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
               <span className="font-bold">Hint:</span> {currentWord.hint}
            </div>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => {
                 setUserInput(e.target.value);
                 setFeedback(null);
              }}
              disabled={feedback === 'correct'}
              placeholder={`Type in ${selectedLanguage}...`}
              className={`w-full text-center text-2xl font-bold p-4 rounded-2xl border-2 outline-none transition-all ${
                feedback === 'correct' 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                  : feedback === 'incorrect' 
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100'
              }`}
            />

            {/* Feedback Message */}
            {feedback === 'incorrect' && (
               <div className="text-center text-red-600 font-medium animate-fade-in">
                  Not quite! Try listening again.
               </div>
            )}
            {feedback === 'correct' && (
               <div className="text-center text-emerald-600 font-bold text-lg animate-fade-in flex items-center justify-center gap-2">
                  <CheckCircle size={24} /> Correct! The word is "{currentWord.text}".
               </div>
            )}

            {/* Actions */}
            <div className="pt-4">
               {feedback === 'correct' ? (
                  <Button onClick={handleNext} className="w-full" size="lg" variant="secondary">
                     Next Word
                  </Button>
               ) : (
                  <Button 
                     onClick={handleCheck} 
                     disabled={!userInput.trim()} 
                     className="w-full bg-pink-600 hover:bg-pink-700 shadow-pink-200" 
                     size="lg"
                  >
                     Check Spelling
                  </Button>
               )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};