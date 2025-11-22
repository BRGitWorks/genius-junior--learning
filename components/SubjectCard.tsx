import React from 'react';
import { SubjectType } from '../types';
import { Calculator, Beaker, Monitor, Globe } from 'lucide-react';

interface SubjectCardProps {
  subject: SubjectType;
  onClick: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick }) => {
  const getIcon = () => {
    switch (subject) {
      case SubjectType.MATH: return <Calculator className="w-8 h-8 text-white" />;
      case SubjectType.SCIENCE: return <Beaker className="w-8 h-8 text-white" />;
      case SubjectType.COMPUTER: return <Monitor className="w-8 h-8 text-white" />;
      default: return <Globe className="w-8 h-8 text-white" />;
    }
  };

  const getGradient = () => {
    switch (subject) {
      case SubjectType.MATH: return "bg-gradient-to-br from-blue-400 to-blue-600";
      case SubjectType.SCIENCE: return "bg-gradient-to-br from-emerald-400 to-emerald-600";
      case SubjectType.COMPUTER: return "bg-gradient-to-br from-violet-400 to-violet-600";
      case SubjectType.TAMIL: return "bg-gradient-to-br from-orange-400 to-red-500";
      case SubjectType.HINDI: return "bg-gradient-to-br from-amber-400 to-orange-500";
      case SubjectType.KANNADA: return "bg-gradient-to-br from-yellow-400 to-amber-600";
      default: return "bg-slate-500";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`relative group overflow-hidden rounded-2xl p-6 h-40 transition-all duration-300 hover:scale-105 hover:shadow-xl text-left flex flex-col justify-between ${getGradient()}`}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative z-10 bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-sm">
        {getIcon()}
      </div>

      <h3 className="relative z-10 text-2xl font-bold text-white tracking-tight">
        {subject}
      </h3>
    </button>
  );
};