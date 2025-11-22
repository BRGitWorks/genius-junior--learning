import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { Rocket, Calendar, Star } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  // Name is now fixed for the personalized app
  const name = 'Thanusha';
  const [age, setAge] = useState<number>(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (age >= 8 && age <= 16) {
      onComplete({ name, age, interests: [] });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-8 text-center">
        <div className="flex justify-center relative">
          <div className="p-4 bg-indigo-100 rounded-full relative z-10">
            <Rocket className="w-12 h-12 text-indigo-600" />
          </div>
          <Star className="absolute top-0 right-1/3 text-yellow-400 w-8 h-8 animate-bounce" style={{ animationDelay: '0.5s' }} fill="currentColor" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {name}! 🌟</h1>
          <p className="text-slate-500">Your personal AI tutor is ready to help you learn.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <p className="text-indigo-800 text-sm font-medium text-center">
              We've set up a special workspace just for you, {name}.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Calendar size={16} /> How old are you today? (8-16)
            </label>
            <input
              type="number"
              min="8"
              max="16"
              required
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            <div className="mt-2">
              <input 
                type="range" 
                min="8" 
                max="16" 
                value={age} 
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <p className="text-right text-sm text-indigo-600 font-medium mt-1">{age} Years Old</p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={age < 8 || age > 16}
          >
            Start Learning Adventure
          </Button>
        </form>
      </div>
    </div>
  );
};