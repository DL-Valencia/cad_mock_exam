export const STORAGE_KEY = 'cad_mock_exam_v2';
export const LEGACY_STORAGE_KEY = 'cad_mock_exam_state_v1';

export function getDefaultState() {
  return {
    theme: 'light',
    history: {}, // qId: { timesAnswered, correct, lastResult }
    starred: {}, // qId: true
    notes: {}, // qId: "text"
    examHistory: [] // [{ date, title, score, passed, total, correct, timeTaken }]
  };
}

export function loadPersistedState() {
  const defaultState = getDefaultState();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultState, ...JSON.parse(saved) };
    }
    const v1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (v1) {
      return { ...defaultState, ...JSON.parse(v1) };
    }
    return defaultState;
  } catch (err) {
    console.error('Error loading persisted state:', err);
    return defaultState;
  }
}

export function savePersistedState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Rearranges (shuffles) the answer choices of a question and re-indexes labels A, B, C...
 * so users cannot rely on memorized answer letter patterns.
 */
export function shuffleQuestionChoices(question) {
  const shuffledOpts = shuffleArray(question.options).map((opt, idx) => ({
    ...opt,
    originalLabel: opt.originalLabel || opt.label,
    label: OPTION_LABELS[idx] || opt.label
  }));
  return {
    ...question,
    options: shuffledOpts
  };
}

export function prepareSessionQuestions(
  questionList,
  { shuffleQuestions = false, shuffleChoices = false } = {}
) {
  let prepared = [...questionList];
  if (shuffleQuestions) {
    prepared = shuffleArray(prepared);
  }
  if (shuffleChoices) {
    prepared = prepared.map((q) => shuffleQuestionChoices(q));
  }
  return prepared;
}

export function isQuestionAnswerCorrect(question, userLabels = []) {
  const correctLabels = question.options
    .filter((o) => o.isCorrect)
    .map((o) => o.label)
    .sort();
  const userSorted = [...userLabels].sort();
  if (correctLabels.length !== userSorted.length) return false;
  return correctLabels.every((val, idx) => val === userSorted[idx]);
}

export function formatTimerDisplay(seconds) {
  const safeSecs = Math.max(0, seconds);
  const mins = Math.floor(safeSecs / 60);
  const secs = safeSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
