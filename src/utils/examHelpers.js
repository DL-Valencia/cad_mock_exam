export const STORAGE_KEY = 'cad_mock_exam_v2';
export const LEGACY_STORAGE_KEY = 'cad_mock_exam_state_v1';

export function getDefaultState() {
  return {
    theme: 'dark',
    history: {}, // qId: { timesAnswered, correct, lastResult }
    starred: {}, // qId: true
    notes: {}, // qId: "text"
    domainHistory: {}, // topic: { qId: { timesAnswered, correct, lastResult } }
    savedSessions: {}, // sessionKey: serialized session snapshot
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

export const origLabel = (opt) => opt.originalLabel || opt.label;

/** Converts a live session into a storable snapshot keyed by question id + original option labels. */
export function serializeSession(session, idx = 0) {
  const order = [];
  const choices = {};
  const answers = {};
  const checked = {};
  const flagged = {};
  session.questions.forEach((q, i) => {
    order.push(q.id);
    choices[q.id] = q.options.map(origLabel);
    const ans = session.userAnswers[i] || [];
    if (ans.length) {
      answers[q.id] = ans.map((l) => {
        const o = q.options.find((x) => x.label === l);
        return o ? origLabel(o) : l;
      });
    }
    if (session.checked[i]) checked[q.id] = true;
    if (session.flagged[i]) flagged[q.id] = true;
  });
  return {
    order,
    choices,
    answers,
    checked,
    flagged,
    idx,
    shuffled: !!session.shuffled,
    updatedAt: Date.now()
  };
}

/** Rebuilds session questions/answers from a snapshot (order, choice order and answers preserved). */
export function restoreSession(saved, allQuestions) {
  const byId = new Map(allQuestions.map((q) => [q.id, q]));
  const questions = [];
  saved.order.forEach((id) => {
    const base = byId.get(id);
    if (!base) return;
    const byOrig = new Map(base.options.map((o) => [origLabel(o), o]));
    const wanted = saved.choices?.[id] || base.options.map(origLabel);
    let opts = wanted.map((l) => byOrig.get(l)).filter(Boolean);
    if (opts.length !== base.options.length) opts = base.options;
    questions.push({
      ...base,
      options: opts.map((o, i) => ({
        ...o,
        originalLabel: origLabel(o),
        label: OPTION_LABELS[i] || o.label
      }))
    });
  });

  const userAnswers = {};
  const checked = {};
  const flagged = {};
  questions.forEach((q, i) => {
    const ans = saved.answers?.[q.id];
    if (ans && ans.length) {
      userAnswers[i] = ans
        .map((l) => q.options.find((o) => origLabel(o) === l)?.label)
        .filter(Boolean);
    }
    if (saved.checked?.[q.id]) checked[i] = true;
    if (saved.flagged?.[q.id]) flagged[i] = true;
  });
  return { questions, userAnswers, checked, flagged };
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
