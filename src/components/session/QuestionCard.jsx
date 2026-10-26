import React from 'react';
import { useExam } from '../../context/ExamContext';
import { isQuestionAnswerCorrect } from '../../utils/examHelpers';
import StudyNotesBox from './StudyNotesBox';

export default function QuestionCard() {
  const {
    currentSession,
    currentQIndex,
    handleOptionClick,
    clearCurrentSelection,
    checkAnswer,
    prevQuestion,
    nextQuestion,
    confirmFinishExam,
    setShortcutsModalOpen
  } = useExam();

  if (!currentSession) return null;

  const q = currentSession.questions[currentQIndex];
  const total = currentSession.questions.length;
  const userSelected = currentSession.userAnswers[currentQIndex] || [];
  const isChecked = !!currentSession.checked[currentQIndex];
  const isStudy = currentSession.mode === 'study';

  const correctOptions = q.options.filter((o) => o.isCorrect);
  const correctCount = correctOptions.length;
  const isMulti = correctCount > 1;
  const isAllCorrect = isQuestionAnswerCorrect(q, userSelected);
  const correctLabels = correctOptions.map((o) => o.label).join(', ');

  return (
    <div className="question-card">
      <div className="q-top-row">
        <div className="q-tags">
          <span className="tag-badge">#{q.id}</span>
          {(q.tags || ['ServiceNow CAD']).map((t) => (
            <span key={t} className="tag-badge">
              {t}
            </span>
          ))}
          <span
            className="tag-badge"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
          >
            {q.source}
          </span>
        </div>

        <div className="q-type-badge">
          {isMulti ? `Multiple Choice (Choose ${correctCount})` : 'Single Choice (Choose 1)'}
        </div>
      </div>

      <div className="question-text">{q.question}</div>

      <div className="options-list">
        {q.options.map((opt) => {
          const isSelected = userSelected.includes(opt.label);
          let optClass = 'option-item';
          if (isSelected) optClass += ' selected';

          let showStatus = false;
          if (isChecked && isStudy) {
            optClass += ' locked';
            if (opt.isCorrect) {
              optClass += ' correct';
              showStatus = true;
            } else if (isSelected && !opt.isCorrect) {
              optClass += ' incorrect';
              showStatus = true;
            }
          }

          return (
            <div
              key={opt.label}
              className={optClass}
              onClick={() => handleOptionClick(opt.label, q)}
            >
              <div className="opt-letter">{opt.label}</div>
              <div className="opt-text">{opt.text}</div>
              {showStatus && (
                <div className="opt-status-icon">{opt.isCorrect ? '✓' : '✕'}</div>
              )}
            </div>
          );
        })}
      </div>

      {isChecked && isStudy && (
        <div className={`feedback-box ${isAllCorrect ? 'correct' : 'incorrect'}`}>
          <div className="feedback-title">
            {isAllCorrect ? '✓ Correct Answer!' : '✕ Incorrect'}
          </div>
          <div className="feedback-explanation">
            <strong>Correct Answer(s): Option {correctLabels}</strong>
            <br />
            Refer to ServiceNow Certified Application Developer (CAD) guidelines and developer
            documentation for detailed concepts.
          </div>
        </div>
      )}

      <div className="q-controls">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            disabled={currentQIndex === 0}
            onClick={prevQuestion}
          >
            ← Prev
          </button>
          <button
            className="btn btn-outline"
            disabled={currentQIndex === total - 1}
            onClick={nextQuestion}
          >
            Next →
          </button>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
            onClick={clearCurrentSelection}
            title="Clear Selection (C)"
          >
            Clear
          </button>
          <span
            className="kbd-hint"
            onClick={() => setShortcutsModalOpen(true)}
            title="View Keyboard Shortcuts"
          >
            ⌨️ Shortcuts (?)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isStudy ? (
            <button className="btn btn-secondary" onClick={checkAnswer}>
              Check Answer
            </button>
          ) : (
            <button className="btn btn-primary" onClick={confirmFinishExam}>
              Finish & Submit Exam
            </button>
          )}
        </div>
      </div>

      <StudyNotesBox questionId={q.id} />
    </div>
  );
}

