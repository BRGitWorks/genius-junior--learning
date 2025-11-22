import React, { useMemo, useState } from 'react';
import { SubjectType, UserProfile, LearningStats, LearningPath } from '../types';
import { SubjectCard } from './SubjectCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User, Trophy, Map, Plus, Mic, Settings, Download, Upload, X, Check, Copy } from 'lucide-react';
import { Button } from './Button';

interface DashboardProps {
  user: UserProfile;
  stats: LearningStats;
  activePath: LearningPath | null;
  onSelectSubject: (subject: SubjectType) => void;
  onContinuePath: () => void;
  onCreatePath: (subject: SubjectType) => void;
  onOpenDictation: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  stats, 
  activePath,
  onSelectSubject,
  onContinuePath,
  onCreatePath,
  onOpenDictation
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [importError, setImportError] = useState('');

  const chartData = useMemo(() => [
    { name: 'Sessions', value: stats.sessionsCompleted, color: '#818cf8' },
    { name: 'Questions', value: stats.questionsAnswered, color: '#34d399' },
    { name: 'Correct', value: stats.correctAnswers, color: '#fbbf24' },
  ], [stats]);

  // Calculate current step in active path
  const currentStepIndex = activePath?.modules.findIndex(m => m.status === 'current') ?? 0;
  const progressPercent = activePath 
    ? ((activePath.modules.filter(m => m.status === 'completed').length) / activePath.modules.length) * 100 
    : 0;

  const handleExport = () => {
    const data = {
      user: localStorage.getItem('geniusJunior_user'),
      stats: localStorage.getItem('geniusJunior_stats'),
      path: localStorage.getItem('geniusJunior_activePath')
    };
    // Create a base64 string to make it easy to copy/paste
    const code = btoa(JSON.stringify(data));
    navigator.clipboard.writeText(code).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleImport = () => {
    try {
      if (!importCode.trim()) return;
      const jsonStr = atob(importCode.trim());
      const data = JSON.parse(jsonStr);

      if (data.user) localStorage.setItem('geniusJunior_user', data.user);
      if (data.stats) localStorage.setItem('geniusJunior_stats', data.stats);
      if (data.path) localStorage.setItem('geniusJunior_activePath', data.path);
      
      // Reload to reflect changes
      window.location.reload();
    } catch (e) {
      setImportError("Invalid code. Please ensure you copied the entire string.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 relative">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
               <User size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Hello, {user.name}! 👋</h1>
              <p className="text-slate-500">Ready to learn something new today?</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center space-x-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 text-amber-700">
               <Trophy size={20} className="text-amber-500" />
               <span className="font-bold">{stats.correctAnswers * 10} XP</span>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Sync Progress"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Active Path Section */}
        {activePath && (
          <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="p-4 bg-indigo-100 text-indigo-600 rounded-xl">
                      <Map size={32} />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-slate-900">Current Mission: {activePath.subject}</h3>
                      <p className="text-slate-500 text-sm">Step {currentStepIndex + 1}: {activePath.modules[currentStepIndex]?.title || "Complete!"}</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-6 w-full md:w-auto">
                   <div className="flex-1 md:w-48">
                      <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" style={{width: `${progressPercent}%`}}></div>
                      </div>
                   </div>
                   <Button onClick={onContinuePath}>Continue Path</Button>
                </div>
             </div>
          </div>
        )}

        {/* Special Module: Dictation */}
        <button 
          onClick={onOpenDictation}
          className="w-full bg-gradient-to-r from-rose-400 to-pink-600 rounded-2xl p-6 shadow-lg text-white text-left flex items-center justify-between group transition-transform hover:scale-[1.02]"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
              <Mic size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Dictation Master</h3>
              <p className="text-rose-100">Practice spelling with AI voice!</p>
            </div>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm text-sm font-semibold group-hover:bg-white/30 transition-colors">
            Start Practice
          </div>
        </button>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Progress</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} style={{fontSize: '14px', fontWeight: 500}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
           
           <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Current Level</h3>
                <p className="text-4xl font-bold mt-2">{user.age < 12 ? 'Explorer' : 'Scholar'}</p>
              </div>
              <div className="mt-4">
                 <p className="text-sm opacity-80 mb-2">Next Goal: 50 Correct Answers</p>
                 <div className="w-full bg-black/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-1000" 
                      style={{width: `${Math.min((stats.correctAnswers / 50) * 100, 100)}%`}}
                    ></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Subjects Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Start a New Adventure</h2>
            {!activePath && <span className="text-sm text-slate-500 flex items-center gap-1"><Plus size={16}/> Select a subject to create a path</span>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SubjectCard subject={SubjectType.MATH} onClick={() => onCreatePath(SubjectType.MATH)} />
            <SubjectCard subject={SubjectType.SCIENCE} onClick={() => onCreatePath(SubjectType.SCIENCE)} />
            <SubjectCard subject={SubjectType.COMPUTER} onClick={() => onCreatePath(SubjectType.COMPUTER)} />
            <SubjectCard subject={SubjectType.TAMIL} onClick={() => onCreatePath(SubjectType.TAMIL)} />
            <SubjectCard subject={SubjectType.HINDI} onClick={() => onCreatePath(SubjectType.HINDI)} />
            <SubjectCard subject={SubjectType.KANNADA} onClick={() => onCreatePath(SubjectType.KANNADA)} />
          </div>
          
          <div className="mt-8 pt-8 border-t">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Free Exploration</h3>
             <div className="flex flex-wrap gap-3">
                {Object.values(SubjectType).map(s => (
                  <button 
                    key={s}
                    onClick={() => onSelectSubject(s)} 
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-sm"
                  >
                    Quick Chat: {s}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Sync Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="text-slate-400" />
                Sync Progress
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              
              {/* Export Section */}
              <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                    <Download size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-indigo-900">Export Progress</h3>
                    <p className="text-sm text-indigo-700 mb-3">Copy this code to move Thanusha's progress to another device.</p>
                    <Button 
                      onClick={handleExport} 
                      size="sm" 
                      variant="primary"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                      {copySuccess ? 'Copied to Clipboard!' : 'Copy Sync Code'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Import Section */}
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                 <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-amber-600">
                    <Upload size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900">Import Progress</h3>
                    <p className="text-sm text-amber-800 mb-3">Paste the code from the other device here.</p>
                    <textarea
                      value={importCode}
                      onChange={(e) => {
                        setImportCode(e.target.value);
                        setImportError('');
                      }}
                      placeholder="Paste code here..."
                      className="w-full p-3 rounded-lg border border-amber-200 bg-white text-sm focus:ring-2 focus:ring-amber-500 outline-none mb-2"
                      rows={3}
                    />
                    {importError && <p className="text-xs text-red-600 font-bold mb-2">{importError}</p>}
                    <Button 
                      onClick={handleImport} 
                      size="sm" 
                      variant="secondary"
                      className="w-full bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                      disabled={!importCode}
                    >
                      Load Progress
                    </Button>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                Data is stored securely in your browser. No data is sent to any server.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};