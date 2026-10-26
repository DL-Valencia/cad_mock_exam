import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import rawQuestions from '../data/questions.json';
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  getDefaultState,
  loadPersistedState,
  savePersistedState,
  shuffleArray,
  prepareSessionQuestions,
  isQuestionAnswerCorrect
} from '../utils/examHelpers';

const ExamContext = createContext(null);

export function ExamProvider({ children }) {
  const [questions] = useState(rawQuestions);
  const [state, setState] = useState(() => loadPersistedState());
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'session' | 'results' | 'bank'
  const [currentSession, setCurrentSession] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [paletteFilter, setPaletteFilter] = useState('all'); // 'all' | 'unanswered' | 'flagged'
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastExamConfig, setLastExamConfig] = useState(null);
  const [lastExamResults, setLastExamResults] = useState(null);
  const [resultsReviewFilter, setResultsReviewFilter] = useState('all'); // 'all' | 'wrong'
  const [marathonShuffle, setMarathonShuffle] = useState(false);

  // UI state: Toast & Modals & Mobile Sidebar
  const [toastMsg, setToastMsg] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', desc: '', onConfirm: null });
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bank filter state
  const [bankFilters, setBankFilters] = useState({
    query: '',
    source: 'all',
    topic: 'all',
    status: 'all'
  });

  const timerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Sync theme attribute & localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    savePersistedState(state);
  }, [state]);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  }, []);

  const showView = useCallback((viewName) => {
    setActiveView(viewName);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  }, []);

  // Dashboard computed statistics
  const dashboardStats = useMemo(() => {
    const answeredIds = Object.keys(state.history);
    const totalAnswered = answeredIds.length;
    let totalCorrect = 0;
    let missedCount = 0;

    answeredIds.forEach((id) => {
      const h = state.history[id];
      if (h && h.correct > 0) totalCorrect++;
      if (h && h.lastResult === false) missedCount++;
    });

    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const starredCount = Object.keys(state.starred).filter((k) => state.starred[k]).length;

    const topicCounts = {};
    const domainProgress = {};

    questions.forEach((q) => {
      const h = state.history[q.id];
      const isAnswered = !!h && h.timesAnswered > 0;
      const isCorrect = !!h && h.correct > 0;

      (q.tags || []).forEach((t) => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
        if (!domainProgress[t]) {
          domainProgress[t] = { total: 0, answered: 0, correct: 0, pctAnswered: 0, accuracy: 0 };
        }
        domainProgress[t].total += 1;
        if (isAnswered) domainProgress[t].answered += 1;
        if (isCorrect) domainProgress[t].correct += 1;
      });
    });

    Object.keys(domainProgress).forEach((t) => {
      const d = domainProgress[t];
      d.pctAnswered = d.total > 0 ? Math.round((d.answered / d.total) * 100) : 0;
      d.accuracy = d.answered > 0 ? Math.round((d.correct / d.answered) * 100) : 0;
    });

    return {
      totalAnswered,
      totalCorrect,
      missedCount,
      accuracy,
      starredCount,
      topicCounts,
      domainProgress
    };
  }, [state.history, state.starred, questions]);

  const allTopics = useMemo(() => {
    const topics = new Set();
    questions.forEach((q) => (q.tags || []).forEach((t) => topics.add(t)));
    return Array.from(topics).sort();
  }, [questions]);

  // Finish Exam calculation
  const finishExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!currentSession) return;

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const domainStats = {};
    const updatedHistory = { ...state.history };

    currentSession.questions.forEach((q, idx) => {
      const userAns = currentSession.userAnswers[idx] || [];
      const qId = q.id;
      const isRight = userAns.length > 0 && isQuestionAnswerCorrect(q, userAns);

      (q.tags || []).forEach((tag) => {
        if (!domainStats[tag]) domainStats[tag] = { total: 0, correct: 0 };
        domainStats[tag].total++;
        if (isRight) domainStats[tag].correct++;
      });

      if (userAns.length === 0) {
        unanswered++;
        const prev = updatedHistory[qId] || { timesAnswered: 0, correct: 0, lastResult: false };
        updatedHistory[qId] = {
          ...prev,
          timesAnswered: prev.timesAnswered + 1,
          lastResult: false
        };
      } else {
        if (isRight) {
          correct++;
        } else {
          incorrect++;
        }
        const prev = updatedHistory[qId] || { timesAnswered: 0, correct: 0, lastResult: true };
        updatedHistory[qId] = {
          timesAnswered: prev.timesAnswered + 1,
          correct: isRight ? prev.correct + 1 : prev.correct,
          lastResult: isRight
        };
      }
    });

    const total = currentSession.questions.length;
    const pct = Math.round((correct / total) * 100);
    const passed = pct >= 70;

    const elapsedSecs = currentSession.duration
      ? currentSession.duration - Math.max(0, timeRemaining)
      : Math.round((Date.now() - currentSession.startTime) / 1000);
    const elapsedMins = Math.floor(elapsedSecs / 60);
    const elapsedRemainSecs = elapsedSecs % 60;
    const timeStr = `${elapsedMins}m ${elapsedRemainSecs}s`;

    const newAttempt = {
      date: new Date().toLocaleDateString(),
      title: currentSession.title,
      score: pct,
      passed,
      total,
      correct,
      timeTaken: timeStr
    };

    setState((prev) => ({
      ...prev,
      history: updatedHistory,
      examHistory: [...(prev.examHistory || []), newAttempt]
    }));

    setLastExamResults({
      passed,
      pct,
      correct,
      incorrect,
      unanswered,
      total,
      timeStr,
      domainStats
    });
    setResultsReviewFilter('all');
    showView('results');
  }, [currentSession, state.history, timeRemaining, showView]);

  // Countdown timer effect for Exam Mode
  useEffect(() => {
    if (activeView === 'session' && currentSession?.mode === 'exam') {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            alert('Time is up! Submitting your CAD exam now.');
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [activeView, currentSession?.mode, finishExam]);

  // Session Initializer
  const initSession = useCallback(
    (questionList, mode, title, durationSeconds = 0, options = {}) => {
      if (!questionList || questionList.length === 0) {
        alert('No questions match this criteria.');
        return;
      }

      if (timerRef.current) clearInterval(timerRef.current);

      const { shuffleQuestions = false, shuffleChoices = false } = options;
      const preparedQuestions = prepareSessionQuestions(questionList, {
        shuffleQuestions,
        shuffleChoices
      });

      setLastExamConfig({
        questions: questionList,
        mode,
        title,
        duration: durationSeconds,
        options
      });

      setCurrentSession({
        mode, // 'study' | 'exam'
        title,
        baseQuestions: questionList,
        questions: preparedQuestions,
        shuffled: shuffleQuestions || shuffleChoices,
        userAnswers: {}, // index: [selected labels]
        checked: {}, // index: boolean
        startTime: Date.now(),
        duration: durationSeconds,
        flagged: {} // index: boolean
      });

      setCurrentQIndex(0);
      setPaletteFilter('all');
      setTimeRemaining(durationSeconds);
      showView('session');
    },
    [showView]
  );

  // Shuffle / Rearrange current study session questions and choices
  const reshuffleCurrentSession = useCallback(() => {
    if (!currentSession) return;
    const base = currentSession.baseQuestions || currentSession.questions;
    const shuffledQuestions = prepareSessionQuestions(base, {
      shuffleQuestions: true,
      shuffleChoices: true
    });
    setCurrentSession((prev) => ({
      ...prev,
      questions: shuffledQuestions,
      shuffled: true,
      userAnswers: {},
      checked: {},
      flagged: {}
    }));
    setCurrentQIndex(0);
    showToast('🔀 Questions & answer choices shuffled to avoid memory patterns!');
  }, [currentSession, showToast]);

  // Start Mode Helpers
  const startStudy = useCallback(
    (count, filterMode, title, shuffleOpts = null) => {
      let pool = [...questions];
      if (filterMode === 'random') {
        pool = shuffleArray(pool);
      }
      const selected = pool.slice(0, count);
      const shouldShuffle =
        shuffleOpts !== null ? shuffleOpts : filterMode === 'all' ? marathonShuffle : false;

      initSession(selected, 'study', title, 0, {
        shuffleQuestions: shouldShuffle,
        shuffleChoices: shouldShuffle
      });
      if (shouldShuffle) {
        showToast('🔀 Shuffled questions & answer choices active!');
      }
    },
    [questions, marathonShuffle, initSession, showToast]
  );

  const startBySourceFilter = useCallback(
    (keyword, title) => {
      const pool = questions.filter((q) => q.source.includes(keyword));
      initSession(pool, 'study', title);
    },
    [questions, initSession]
  );

  const startTopicPractice = useCallback(
    (topic) => {
      const pool = questions.filter((q) => (q.tags || []).includes(topic));
      initSession(pool, 'study', `Domain: ${topic} (${pool.length} Qs)`);
    },
    [questions, initSession]
  );

  const startMistakesPractice = useCallback(() => {
    const missedIds = Object.keys(state.history).filter(
      (id) => state.history[id]?.lastResult === false
    );
    if (missedIds.length === 0) {
      alert(
        'Great job! You have no questions in your Mistakes Bank. Keep practicing to identify weak spots.'
      );
      return;
    }
    const pool = questions.filter((q) => missedIds.includes(String(q.id)));
    initSession(pool, 'study', `Mistakes Bank Drill (${pool.length} Qs)`);
  }, [state.history, questions, initSession]);

  const startStarredPractice = useCallback(() => {
    const starredIds = Object.keys(state.starred).filter((id) => state.starred[id]);
    if (starredIds.length === 0) {
      alert(
        'You have no starred questions yet. Click the star icon ⭐ on any question to bookmark it.'
      );
      return;
    }
    const pool = questions.filter((q) => starredIds.includes(String(q.id)));
    initSession(pool, 'study', `Starred Questions Review (${pool.length} Qs)`);
  }, [state.starred, questions, initSession]);

  const startExam = useCallback(
    (count = 60, title = 'Timed CAD Exam Simulator', durationMinutes = 90) => {
      const pool = shuffleArray([...questions]).slice(0, count);
      initSession(pool, 'exam', title, durationMinutes * 60);
    },
    [questions, initSession]
  );

  const retakeCurrentExam = useCallback(() => {
    if (!lastExamConfig) {
      startExam(60, 'Timed CAD Exam Simulator', 90);
      return;
    }
    initSession(
      shuffleArray([...lastExamConfig.questions]),
      lastExamConfig.mode,
      lastExamConfig.title,
      lastExamConfig.duration,
      lastExamConfig.options
    );
  }, [lastExamConfig, startExam, initSession]);

  // Question interaction handlers
  const handleOptionClick = useCallback(
    (letter, question) => {
      if (!currentSession) return;
      if (currentSession.checked[currentQIndex] && currentSession.mode === 'study') return;

      const currentSelected = [...(currentSession.userAnswers[currentQIndex] || [])];
      const correctCount = question.options.filter((o) => o.isCorrect).length;
      const isMulti = correctCount > 1;

      let nextSelected;
      if (isMulti) {
        if (currentSelected.includes(letter)) {
          nextSelected = currentSelected.filter((l) => l !== letter);
        } else {
          nextSelected = [...currentSelected, letter];
        }
      } else {
        nextSelected = [letter];
      }

      setCurrentSession((prev) => ({
        ...prev,
        userAnswers: {
          ...prev.userAnswers,
          [currentQIndex]: nextSelected
        }
      }));
    },
    [currentSession, currentQIndex]
  );

  const clearCurrentSelection = useCallback(() => {
    if (!currentSession) return;
    if (currentSession.checked[currentQIndex] && currentSession.mode === 'study') return;
    setCurrentSession((prev) => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [currentQIndex]: []
      }
    }));
  }, [currentSession, currentQIndex]);

  const checkAnswer = useCallback(() => {
    if (!currentSession) return;
    const q = currentSession.questions[currentQIndex];
    const userSelected = currentSession.userAnswers[currentQIndex] || [];

    if (userSelected.length === 0) {
      showToast('Please select an option before checking.');
      return;
    }

    const isCorrect = isQuestionAnswerCorrect(q, userSelected);
    const qId = q.id;

    setCurrentSession((prev) => ({
      ...prev,
      checked: {
        ...prev.checked,
        [currentQIndex]: true
      }
    }));

    setState((prev) => {
      const existing = prev.history[qId] || { timesAnswered: 0, correct: 0, lastResult: true };
      return {
        ...prev,
        history: {
          ...prev.history,
          [qId]: {
            timesAnswered: existing.timesAnswered + 1,
            correct: isCorrect ? existing.correct + 1 : existing.correct,
            lastResult: isCorrect
          }
        }
      };
    });
  }, [currentSession, currentQIndex, showToast]);

  const prevQuestion = useCallback(() => {
    setCurrentQIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const nextQuestion = useCallback(() => {
    if (!currentSession) return;
    setCurrentQIndex((prev) =>
      prev < currentSession.questions.length - 1 ? prev + 1 : prev
    );
  }, [currentSession]);

  const jumpToQuestion = useCallback(
    (index) => {
      if (currentSession && index >= 0 && index < currentSession.questions.length) {
        setCurrentQIndex(index);
      }
    },
    [currentSession]
  );

  const toggleCurrentFlag = useCallback(() => {
    if (!currentSession) return;
    const nextFlagged = !currentSession.flagged[currentQIndex];
    setCurrentSession((prev) => ({
      ...prev,
      flagged: {
        ...prev.flagged,
        [currentQIndex]: nextFlagged
      }
    }));
    showToast(nextFlagged ? '🚩 Question flagged for exam review' : 'Flag removed');
  }, [currentSession, currentQIndex, showToast]);

  const toggleQuestionStar = useCallback(
    (qId) => {
      const nextStar = !state.starred[qId];
      setState((prev) => ({
        ...prev,
        starred: {
          ...prev.starred,
          [qId]: nextStar
        }
      }));
      showToast(nextStar ? '⭐ Question bookmarked' : 'Bookmark removed');
    },
    [state.starred, showToast]
  );

  const toggleCurrentStar = useCallback(() => {
    if (!currentSession) return;
    const q = currentSession.questions[currentQIndex];
    if (q) toggleQuestionStar(q.id);
  }, [currentSession, currentQIndex, toggleQuestionStar]);

  const updateQuestionNote = useCallback((qId, text) => {
    setState((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [qId]: text
      }
    }));
  }, []);

  // Modals & Confirmations
  const openModal = useCallback((title, desc, onConfirm) => {
    setConfirmModal({ open: true, title, desc, onConfirm });
  }, []);

  const closeModal = useCallback(() => {
    setConfirmModal({ open: false, title: '', desc: '', onConfirm: null });
  }, []);

  const handleModalConfirm = useCallback(() => {
    if (typeof confirmModal.onConfirm === 'function') {
      confirmModal.onConfirm();
    }
    closeModal();
  }, [confirmModal, closeModal]);

  const confirmExitSession = useCallback(() => {
    if (!currentSession) {
      showView('dashboard');
      return;
    }
    if (currentSession.mode === 'exam') {
      openModal(
        'Leave Exam?',
        'Your current CAD exam is in progress. Leaving will calculate your score based on answered questions.',
        () => finishExam()
      );
    } else {
      showView('dashboard');
    }
  }, [currentSession, showView, openModal, finishExam]);

  const confirmFinishExam = useCallback(() => {
    if (!currentSession) return;
    const total = currentSession.questions.length;
    const answered = Object.keys(currentSession.userAnswers).filter(
      (k) => currentSession.userAnswers[k] && currentSession.userAnswers[k].length > 0
    ).length;
    const unanswered = total - answered;

    let msg = `You have answered ${answered} of ${total} questions.`;
    if (unanswered > 0) {
      msg += ` There are ${unanswered} unanswered questions remaining.`;
    }
    msg += ' Are you ready to submit your CAD exam for scoring?';

    openModal('Submit CAD Exam?', msg, () => finishExam());
  }, [currentSession, openModal, finishExam]);

  const confirmReset = useCallback(() => {
    openModal(
      'Reset All Progress?',
      'This will clear your CAD answer history, test stats, exam attempts, bookmarks, and personal notes. This cannot be undone.',
      () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        setState(getDefaultState());
        setCurrentSession(null);
        setLastExamResults(null);
        showView('dashboard');
        showToast('Progress reset successfully.');
      }
    );
  }, [openModal, showView, showToast]);

  // Export & Import Data
  const exportData = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute(
      'download',
      `cad_mock_exam_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('✅ Progress backup downloaded');
  }, [state, showToast]);

  const importDataFromFile = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (imported.history && imported.starred) {
            setState((prev) => ({
              ...prev,
              ...imported
            }));
            setDataModalOpen(false);
            showToast('🎉 Progress restored successfully!');
          } else {
            alert('Invalid backup file format.');
          }
        } catch (err) {
          alert('Failed to parse JSON backup file: ' + err.message);
        }
      };
      reader.readAsText(file);
    },
    [showToast]
  );

  const value = {
    questions,
    state,
    activeView,
    showView,
    toggleTheme,
    dashboardStats,
    allTopics,
    currentSession,
    currentQIndex,
    paletteFilter,
    setPaletteFilter,
    timeRemaining,
    lastExamResults,
    resultsReviewFilter,
    setResultsReviewFilter,
    marathonShuffle,
    setMarathonShuffle,
    reshuffleCurrentSession,
    startStudy,
    startBySourceFilter,
    startTopicPractice,
    startMistakesPractice,
    startStarredPractice,
    startExam,
    retakeCurrentExam,
    handleOptionClick,
    clearCurrentSelection,
    checkAnswer,
    prevQuestion,
    nextQuestion,
    jumpToQuestion,
    toggleCurrentFlag,
    toggleQuestionStar,
    toggleCurrentStar,
    updateQuestionNote,
    confirmExitSession,
    confirmFinishExam,
    confirmReset,
    confirmModal,
    closeModal,
    handleModalConfirm,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    dataModalOpen,
    setDataModalOpen,
    sidebarOpen,
    setSidebarOpen,
    exportData,
    importDataFromFile,
    bankFilters,
    setBankFilters,
    toastMsg,
    showToast
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExam must be used within an ExamProvider');
  return ctx;
}
