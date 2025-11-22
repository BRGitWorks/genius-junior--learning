import React, { useState, useEffect, useRef } from 'react';
import { SubjectType, ChatMessage, UserProfile, QuizQuestion, PathModule } from '../types';
import { generateExplanation, generateQuiz, suggestTopics } from '../services/geminiService';
import { Button } from './Button';
import { ArrowLeft, Send, Brain, CheckCircle, XCircle, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SessionViewProps {
  subject: SubjectType;
  user: UserProfile;
  activeModule?: PathModule | null;
  onBack: () => void;
  onCompleteQuiz: (score: number) => void;
}

export const SessionView: React.FC<SessionViewProps> = ({ 
  subject, 
  user, 
  activeModule,
  onBack, 
  onCompleteQuiz 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      
      // If there's an active module (Learning Path mode)
      if (activeModule) {
        setMessages([
          {
            id: 'system-intro',
            role: 'model',
            text: `**Current Lesson: ${activeModule.title}**\n\nLet's get started! I'm generating your personalized lesson for "${activeModule.topicQuery}"...`,
            timestamp: Date.now()
          }
        ]);
        
        // Automatically trigger the first explanation
        const explanation = await generateExplanation(subject, activeModule.topicQuery, user.age, []);
        setMessages(prev => [...prev, {
          id: 'lesson-content',
          role: 'model',
          text: explanation,
          timestamp: Date.now()
        }, {
          id: 'lesson-prompt',
          role: 'model',
          text: "Read through this carefully! When you're ready to prove your skills, click the **'Take Quiz'** button below.",
          timestamp: Date.now()
        }]);

      } else {
        // Free explore mode
        const topics = await suggestTopics(subject, user.age);
        setSuggestedTopics(topics);
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            text: `Hi ${user.name}! I'm ready to help you with **${subject}**. What would you like to learn about today?`,
            timestamp: Date.now()
          }
        ]);
      }
      setIsLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, activeModule]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const isQuizRequest = text.toLowerCase().includes('quiz') || text.toLowerCase().includes('test');
      const history = messages.map(m => m.text);

      if (isQuizRequest) {
        // If active module, quiz on that specific topic. Otherwise, on user text.
        const topicToQuiz = activeModule ? activeModule.topicQuery : text;
        
        const quizData = await generateQuiz(subject, topicToQuiz, user.age);
        const modelMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: activeModule ? `Time to test your knowledge on ${activeModule.title}!` : `Here is a quick quiz about "${text}"!`,
          isQuiz: true,
          quizData: quizData,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, modelMsg]);
      } else {
        const explanation = await generateExplanation(subject, text, user.age, history);
        const modelMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: explanation,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, modelMsg]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Oops, I had a bit of trouble thinking. Can you ask that again?",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startModuleQuiz = () => {
    handleSendMessage("I am ready for the quiz now!");
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center shadow-sm z-10 sticky top-0">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full mr-2">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-800">{activeModule ? activeModule.title : subject}</h2>
          <p className="text-xs text-slate-500">{activeModule ? 'Guided Lesson' : 'Free Exploration'}</p>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 border border-slate-200 shadow-sm'} rounded-2xl px-5 py-4`}>
              {msg.isQuiz && msg.quizData ? (
                <QuizBlock questions={msg.quizData} onComplete={(score) => {
                   setSessionComplete(true);
                   onCompleteQuiz(score);
                   setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: `Assessment Complete! You scored ${score}/${msg.quizData!.length}.`,
                    timestamp: Date.now()
                  }]);
                }} />
              ) : (
                <div className="prose prose-sm md:prose-base prose-indigo max-w-none dark:prose-invert">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex items-center space-x-2">
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Area */}
      {!isLoading && activeModule && !sessionComplete && messages.filter(m => m.isQuiz).length === 0 && (
        <div className="px-4 py-2 flex justify-center animate-fade-in">
           <Button onClick={startModuleQuiz} className="shadow-xl shadow-indigo-200">
              <Brain className="mr-2" size={18} /> Take Lesson Quiz
           </Button>
        </div>
      )}

      {/* Suggestions (Only show in free mode) */}
      {!activeModule && !isLoading && messages.length < 10 && (
        <div className="px-4 py-2 overflow-x-auto flex space-x-2 scrollbar-hide">
          {suggestedTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => handleSendMessage(topic)}
              className="flex-shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-full hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              Tell me about {topic}
            </button>
          ))}
           <button
              onClick={() => handleSendMessage(`Create a quiz about basics of ${subject}`)}
              className="flex-shrink-0 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm rounded-full hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1"
            >
              <Brain size={14} /> Take a Quiz
            </button>
        </div>
      )}

      {/* Session Complete Action */}
      {sessionComplete && activeModule && (
         <div className="p-4 bg-emerald-50 border-t border-emerald-100 flex justify-between items-center">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
               <Trophy size={20} /> Lesson Complete
            </div>
            <Button onClick={onBack} variant="secondary">Continue Path</Button>
         </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center space-x-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Thinking..." : "Ask a question..."}
            disabled={isLoading || sessionComplete}
            className="flex-1 bg-slate-100 border-0 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
          />
          <Button type="submit" disabled={isLoading || !input.trim() || sessionComplete} className="rounded-xl !px-3 !py-3">
            <Send size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
};

// Helper Component for Quiz Rendering (kept same but with improved styling)
const QuizBlock: React.FC<{ questions: QuizQuestion[], onComplete: (score: number) => void }> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = questions[currentIndex];

  const handleAnswer = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    
    if (option === currentQ.correctAnswer) {
      setScore(s => s + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
      onComplete(score + (selectedOption === currentQ.correctAnswer ? 0 : 0));
    }
  };

  if (quizFinished) {
    return (
      <div className="text-center py-4">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full text-indigo-600">
          <Brain size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Quiz Complete!</h3>
        <p className="text-slate-600 mb-4">You scored <span className="font-bold text-indigo-600 text-lg">{score}</span> out of {questions.length}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-[300px]">
      <div className="flex justify-between items-center mb-4 text-sm text-slate-500">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>Score: {score}</span>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{currentQ.question}</h3>
      
      <div className="space-y-2 mb-4">
        {currentQ.options.map((opt, idx) => {
          let btnClass = "w-full text-left px-4 py-3 rounded-lg border transition-all ";
          if (!selectedOption) {
            btnClass += "bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200";
          } else {
             if (opt === currentQ.correctAnswer) {
                btnClass += "bg-emerald-100 border-emerald-500 text-emerald-800";
             } else if (opt === selectedOption) {
                btnClass += "bg-red-100 border-red-500 text-red-800";
             } else {
                btnClass += "opacity-50 border-slate-200";
             }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(opt)}
              disabled={!!selectedOption}
              className={btnClass}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {selectedOption && opt === currentQ.correctAnswer && <CheckCircle size={18} className="text-emerald-600" />}
                {selectedOption && opt === selectedOption && opt !== currentQ.correctAnswer && <XCircle size={18} className="text-red-600" />}
              </div>
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4 animate-fade-in">
          <strong>Explanation:</strong> {currentQ.explanation}
        </div>
      )}

      {selectedOption && (
        <div className="flex justify-end">
           <Button size="sm" onClick={handleNext}>
             {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
           </Button>
        </div>
      )}
    </div>
  );
};