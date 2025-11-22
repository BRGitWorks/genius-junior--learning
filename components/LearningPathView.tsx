import React from 'react';
import { PathModule, LearningPath } from '../types';
import { Button } from './Button';
import { CheckCircle, Lock, Play, Map, Star } from 'lucide-react';

interface LearningPathViewProps {
  path: LearningPath;
  onStartModule: (module: PathModule) => void;
  onBack: () => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({ path, onStartModule, onBack }) => {
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>Back</Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{path.subject} Adventure</h2>
            <div className="flex items-center text-xs text-slate-500 gap-1">
              <Map size={12} />
              <span>Custom Learning Path</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
          <Star size={16} className="text-amber-500 fill-amber-500" />
          <span className="font-bold text-amber-700">{path.totalXp} XP</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto relative">
          {/* Connecting Line */}
          <div className="absolute left-8 top-8 bottom-8 w-1 bg-slate-200 z-0 rounded-full"></div>

          <div className="space-y-12 relative z-10">
            {path.modules.map((module, index) => {
              const isLocked = module.status === 'locked';
              const isCompleted = module.status === 'completed';
              const isCurrent = module.status === 'current';

              return (
                <div key={module.id} className="flex items-start gap-6 group">
                  {/* Status Icon */}
                  <div className={`w-16 h-16 flex-shrink-0 rounded-full flex items-center justify-center border-4 transition-all ${
                    isCompleted 
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-600' 
                      : isCurrent 
                        ? 'bg-indigo-100 border-indigo-600 text-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.2)]' 
                        : 'bg-slate-100 border-slate-300 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle size={32} /> : isLocked ? <Lock size={24} /> : <Play size={32} className="ml-1" />}
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 bg-white p-5 rounded-2xl border transition-all ${
                    isCurrent 
                      ? 'border-indigo-200 shadow-lg ring-1 ring-indigo-100' 
                      : isLocked 
                        ? 'border-slate-100 opacity-75' 
                        : 'border-emerald-100 shadow-sm'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        isCompleted ? 'bg-emerald-50 text-emerald-700' : isCurrent ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Step {index + 1}
                      </span>
                      {module.score !== undefined && (
                        <span className="text-xs font-semibold text-emerald-600">Score: {module.score}/3</span>
                      )}
                    </div>
                    
                    <h3 className={`text-lg font-bold mb-1 ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                      {module.title}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4">
                      {module.description}
                    </p>

                    {!isLocked && (
                      <Button 
                        variant={isCompleted ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => onStartModule(module)}
                        className="w-full sm:w-auto"
                      >
                        {isCompleted ? 'Review Lesson' : 'Start Lesson'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {path.modules.every(m => m.status === 'completed') && (
             <div className="mt-12 text-center p-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl text-white shadow-xl animate-fade-in">
                <Star size={48} className="mx-auto mb-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                <h3 className="text-2xl font-bold mb-2">Path Completed!</h3>
                <p className="opacity-90">You are a {path.subject} Master! Time to start a new journey.</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
