import React, { useState } from 'react';
import { Question, ExamState, ExamConfig } from './types';
import { shuffleArray } from './utils';
import FileUpload from './components/FileUpload';
import ExamConfigView from './components/ExamConfigView';
import ExamRunner from './components/ExamRunner';
import ResultView from './components/ResultView';

const App: React.FC = () => {
  const [appState, setAppState] = useState<ExamState>({
    status: 'UPLOAD',
    originalQuestions: [],
    activeQuestions: [],
    userAnswers: {},
    startTime: null,
    endTime: null,
    config: {
        mode: 'CUSTOM',
        difficulty: 'ALL',
        questionType: 'ALL',
        limit: 20,
        durationMinutes: 30
    }
  });

  const handleDataLoaded = (questions: Question[]) => {
    setAppState(prev => ({
      ...prev,
      status: 'CONFIG',
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

        finalQuestions = shuffleArray<Question>([...nbQuestions, ...thQuestions, ...vdQuestions]);
    } else {
        // CUSTOM MODE
        let filtered = appState.originalQuestions.filter(q => {
            const matchDiff = config.difficulty === 'ALL' || q.difficulty === config.difficulty;
            const matchType = config.questionType === 'ALL' || q.type === config.questionType;
            return matchDiff && matchType;
        });
        finalQuestions = shuffleArray<Question>(filtered).slice(0, config.limit);
    }

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
      setAppState(prev => ({
          ...prev,
          status: 'RESULT',
          userAnswers: answers,
          endTime: Date.now()
      }));
  };

  const handleRetry = () => {
      // Restart with same config but reshuffle
      handleStartExam(appState.config);
  };

  const handleHome = () => {
      setAppState(prev => ({
          ...prev,
          status: 'UPLOAD', // Or CONFIG if we want to keep data
          originalQuestions: [], // Clearing for upload new file, or keep if changing UX
          activeQuestions: [],
          userAnswers: {}
      }));
  };
  
  const handleConfigReset = () => {
      setAppState(prev => ({ ...prev, status: 'CONFIG' }));
  }

  // Determine time spent in seconds
  const timeSpentSeconds = appState.startTime && appState.endTime 
    ? Math.floor((appState.endTime - appState.startTime) / 1000)
    : 0;

  return (
    <div className="min-h-screen font-sans">
      {appState.status === 'UPLOAD' && (
        <FileUpload onDataLoaded={handleDataLoaded} />
      )}

      {appState.status === 'CONFIG' && (
        <ExamConfigView 
            totalQuestions={appState.originalQuestions} 
            onStart={handleStartExam} 
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
            onRetry={handleRetry}
            onHome={handleConfigReset}
        />
      )}
    </div>
  );
};

export default App;