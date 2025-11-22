import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { SessionView } from './components/SessionView';
import { LearningPathView } from './components/LearningPathView';
import { DictationView } from './components/DictationView';
import { AppView, UserProfile, SubjectType, LearningStats, LearningPath, PathModule } from './types';
import { generateLearningPath } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.ONBOARDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentSubject, setCurrentSubject] = useState<SubjectType | null>(null);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [currentModule, setCurrentModule] = useState<PathModule | null>(null);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);

  const [stats, setStats] = useState<LearningStats>({
    sessionsCompleted: 0,
    questionsAnswered: 0,
    correctAnswers: 0
  });

  // Load user from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('geniusJunior_user');
    const savedStats = localStorage.getItem('geniusJunior_stats');
    const savedPath = localStorage.getItem('geniusJunior_activePath');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView(AppView.DASHBOARD);
    }
    
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    if (savedPath) {
      setActivePath(JSON.parse(savedPath));
    }
  }, []);

  // Save stats and path whenever they change
  useEffect(() => {
    localStorage.setItem('geniusJunior_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (activePath) {
      localStorage.setItem('geniusJunior_activePath', JSON.stringify(activePath));
    }
  }, [activePath]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('geniusJunior_user', JSON.stringify(profile));
    setView(AppView.DASHBOARD);
  };

  const handleSubjectSelect = (subject: SubjectType) => {
    // Free explore mode
    setCurrentSubject(subject);
    setCurrentModule(null);
    setView(AppView.SESSION);
    setStats(prev => ({
      ...prev,
      sessionsCompleted: prev.sessionsCompleted + 1
    }));
  };

  const handleCreatePath = async (subject: SubjectType) => {
    if (!user) return;
    setIsGeneratingPath(true);
    
    const modules = await generateLearningPath(subject, user.age);
    const newPath: LearningPath = {
      id: Date.now().toString(),
      subject: subject,
      modules: modules,
      totalXp: 0
    };

    setActivePath(newPath);
    setIsGeneratingPath(false);
    setView(AppView.PATH_VIEW);
  };

  const handleContinuePath = () => {
    setView(AppView.PATH_VIEW);
  };

  const handleStartModule = (module: PathModule) => {
    if (!activePath) return;
    setCurrentSubject(activePath.subject);
    setCurrentModule(module);
    setView(AppView.SESSION);
  };

  const handleBackToDashboard = () => {
    setCurrentSubject(null);
    setCurrentModule(null);
    setView(AppView.DASHBOARD);
  };

  const handleBackToPath = () => {
    setCurrentModule(null);
    setView(AppView.PATH_VIEW);
  };

  const handleQuizComplete = (score: number) => {
    // Update Global Stats
    setStats(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 3,
      correctAnswers: prev.correctAnswers + score
    }));

    // Update Path Progress if inside a module
    if (activePath && currentModule) {
       const updatedModules = activePath.modules.map((m, idx) => {
         if (m.id === currentModule.id) {
           return { ...m, status: 'completed' as const, score };
         }
         // Unlock next module if previous is just completed
         if (idx > 0 && activePath.modules[idx - 1].id === currentModule.id && score >= 1) { // unlock if at least 1 correct
           return { ...m, status: 'current' as const };
         }
         return m;
       });

       setActivePath({
         ...activePath,
         modules: updatedModules,
         totalXp: activePath.totalXp + (score * 10)
       });
    }
  };

  // Render Loading Overlay for Path Generation
  if (isGeneratingPath) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold text-slate-800">Creating your Learning Path...</h2>
        <p className="text-slate-500">Our AI is analyzing your age and subject to build a custom curriculum.</p>
      </div>
    );
  }

  if (view === AppView.ONBOARDING) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (view === AppView.PATH_VIEW && activePath) {
    return (
      <LearningPathView 
        path={activePath} 
        onStartModule={handleStartModule}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (view === AppView.DICTATION && user) {
    return (
      <DictationView 
        user={user}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (view === AppView.SESSION && currentSubject && user) {
    return (
      <SessionView 
        subject={currentSubject} 
        user={user} 
        activeModule={currentModule}
        onBack={currentModule ? handleBackToPath : handleBackToDashboard}
        onCompleteQuiz={handleQuizComplete}
      />
    );
  }

  if (view === AppView.DASHBOARD && user) {
    return (
      <Dashboard 
        user={user} 
        stats={stats}
        activePath={activePath}
        onSelectSubject={handleSubjectSelect} 
        onContinuePath={handleContinuePath}
        onCreatePath={handleCreatePath}
        onOpenDictation={() => setView(AppView.DICTATION)}
      />
    );
  }

  return null;
};

export default App;
