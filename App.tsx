import React, { useState, useEffect } from 'react';
import { Question, ExamState, ExamConfig, QuestionType, UserInfo, ExamResultLog } from './types';
import { shuffleArray } from './utils';
import FileUpload from './components/FileUpload';
import ExamConfigView from './components/ExamConfigView';
import ExamRunner from './components/ExamRunner';
import ResultView from './components/ResultView';
import LoginView from './components/LoginView';
import AdminDashboard from './components/AdminDashboard';

const HISTORY_KEY = 'mathpro_exam_history';

const App: React.FC = () => {
  const [appState, setAppState] = useState<ExamState>({
    status: 'LOGIN',
    userInfo: null,
    originalQuestions: [],
    activeQuestions: [],
    userAnswers: {},
    startTime: null,
    endTime: null,
    config: {
        mode: 'CUSTOM',
        difficulty: 'ALL',
        questionTypes: ['MCQ', 'Essay', 'TF', 'SA'], // Default all types
        limit: 20,
        durationMinutes: 30
    }
  });

  const [history, setHistory] = useState<ExamResultLog[]>([]);

  // Load history on mount
  useEffect(() => {
      try {
          const saved = localStorage.getItem(HISTORY_KEY);
          if (saved) {
              setHistory(JSON.parse(saved));
          }
      } catch (e) {
          console.error("Failed to load history", e);
      }
  }, []);

  const handleLogin = (info: UserInfo) => {
      // Check for Admin Credentials
      const isAdmin = info.name === 'admin' && info.class === 'admin';
      
      setAppState(prev => ({
          ...prev,
          userInfo: { ...info, isAdmin },
          status: 'UPLOAD'
      }));
  };

  const handleDataLoaded = (questions: Question[]) => {
    setAppState(prev => ({
      ...prev,
      // If admin, go to Admin Dashboard, else go to Student Config
      status: prev.userInfo?.isAdmin ? 'ADMIN_DASHBOARD' : 'CONFIG',
      originalQuestions: questions,
      // Reset other states
      activeQuestions: [],
      userAnswers: {},
      startTime: null,
      endTime: null
    }));
  };

  const handleStartExam = (config: ExamConfig) => {
    let finalQuestions: Question[] = [];

    if (config.mode === 'STANDARD') {
        // STANDARD MODE: 50% NB, 30% TH, 20% VD/VDC
        const nbCount = Math.round(config.limit * 0.5);
        const thCount = Math.round(config.limit * 0.3);
        const vdCount = config.limit - nbCount - thCount; // Remainder

        const nbQuestions = shuffleArray<Question>(appState.originalQuestions.filter(q => q.difficulty === 'NB')).slice(0, nbCount);
        const thQuestions = shuffleArray<Question>(appState.originalQuestions.filter(q => q.difficulty === 'TH')).slice(0, thCount);
        const vdQuestions = shuffleArray<Question>(appState.originalQuestions.filter(q => ['VD', 'VDC'].includes(q.difficulty))).slice(0, vdCount);

        finalQuestions = [...nbQuestions, ...thQuestions, ...vdQuestions];
    } else {
        // CUSTOM MODE
        let filtered = appState.originalQuestions.filter(q => {
            const matchDiff = config.difficulty === 'ALL' || q.difficulty === config.difficulty;
            const matchType = config.questionTypes.includes(q.type);
            return matchDiff && matchType;
        });
        finalQuestions = shuffleArray<Question>(filtered).slice(0, config.limit);
    }

    // Sort questions by difficulty: NB -> TH -> VD -> VDC
    const difficultyRank: Record<string, number> = {
        'NB': 1,
        'TH': 2,
        'VD': 3,
        'VDC': 4
    };

    finalQuestions.sort((a, b) => {
        return (difficultyRank[a.difficulty] || 5) - (difficultyRank[b.difficulty] || 5);
    });

    setAppState(prev => ({
      ...prev,
      status: 'RUNNING',
      activeQuestions: finalQuestions,
      config: config,
      startTime: Date.now(),
      userAnswers: {}
    }));
  };

  const handleCompleteExam = (answers: Record<string, string>) => {
      const endTime = Date.now();
      const startTime = appState.startTime || endTime;
      const timeSpent = Math.floor((endTime - startTime) / 1000);
      
      // Calculate Score for History
      let correctCount = 0;
      appState.activeQuestions.forEach(q => {
          if (q.type === 'MCQ' && q.correctAnswer) {
             // Normalize answers
             const userAns = String(answers[q.id] || '').trim().replace('.', '').toUpperCase();
             const correctAns = String(q.correctAnswer).trim().replace('.', '').toUpperCase();
             if (userAns === correctAns) correctCount++;
          }
      });

      // Create Log
      const newLog: ExamResultLog = {
          id: Date.now().toString(),
          timestamp: endTime,
          score: correctCount,
          totalQuestions: appState.activeQuestions.length,
          timeSpent: timeSpent,
          mode: appState.config.mode
      };

      // Update History State & LocalStorage
      const updatedHistory = [newLog, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      setAppState(prev => ({
          ...prev,
          status: 'RESULT',
          userAnswers: answers,
          endTime: endTime
      }));
  };

  const handleRetry = () => {
      // Restart with same config but reshuffle
      handleStartExam(appState.config);
  };

  const handleHome = () => {
      setAppState(prev => ({
          ...prev,
          status: 'UPLOAD', // Go back to upload but keep user info
          originalQuestions: [], 
          activeQuestions: [],
          userAnswers: {}
      }));
  };
  
  const handleLogout = () => {
      setAppState(prev => ({
          ...prev,
          status: 'LOGIN',
          userInfo: null
      }));
  };

  // Determine time spent in seconds
  const timeSpentSeconds = appState.startTime && appState.endTime 
    ? Math.floor((appState.endTime - appState.startTime) / 1000)
    : 0;

  return (
    <div className="min-h-screen font-sans">
      {appState.status === 'LOGIN' && (
          <LoginView onLogin={handleLogin} />
      )}

      {appState.status === 'UPLOAD' && (
        <FileUpload onDataLoaded={handleDataLoaded} />
      )}
      
      {appState.status === 'ADMIN_DASHBOARD' && (
          <AdminDashboard 
            questionBank={appState.originalQuestions}
            onLogout={handleLogout}
          />
      )}

      {appState.status === 'CONFIG' && (
        <ExamConfigView 
            totalQuestions={appState.originalQuestions} 
            onStart={handleStartExam} 
            onBack={handleHome}
        />
      )}

      {appState.status === 'RUNNING' && (
        <ExamRunner 
            questions={appState.activeQuestions}
            durationMinutes={appState.config.durationMinutes}
            onComplete={handleCompleteExam}
        />
      )}

      {appState.status === 'RESULT' && (
        <ResultView 
            questions={appState.activeQuestions}
            userAnswers={appState.userAnswers}
            timeSpent={timeSpentSeconds}
            userInfo={appState.userInfo}
            history={history}
            onRetry={handleRetry}
            onHome={handleHome} 
        />
      )}
    </div>
  );
};

export default App;