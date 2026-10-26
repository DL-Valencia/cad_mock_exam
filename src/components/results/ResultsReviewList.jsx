import React from 'react';
import { useExam } from '../../context/ExamContext';
import { isQuestionAnswerCorrect } from '../../utils/examHelpers';

export default function ResultsReviewList() {
  const { currentSession, resultsReviewFilter } = useExam();

  if (!currentSession) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {currentSession.questions.map((q, idx) => {
        const userAns = currentSession.userAnswers[idx] || [];
        const isRight = userAns.length > 0 && isQuestionAnswerCorrect(q, userAns);

        if (resultsReviewFilter === 'wrong' && isRight) return null;

        return (
          <div
            key={q.id}
            className="bank-item"
            style={{
              borderLeft: isRight
                ? '4px solid var(--sn-green)'
                : '4px solid var(--danger)'
            }}
          >
            <div className="bank-item-header">
              <span className={`mode-badge ${isRight ? 'success' : 'danger'}`}>
                {isRight ? 'Correct' : 'Incorrect'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Q{idx + 1} of {currentSession.questions.length} · {q.source}
              </span>
            </div>

            <div className="bank-q-text">{q.question}</div>

            <div className="bank-options">
              {q.options.map((opt) => {
                const isUserChosen = userAns.includes(opt.label);
                let optClass = 'bank-opt';
                let mark = '';

                if (opt.isCorrect) {
                  optClass += ' correct';
                  mark = ' ✓ (Correct Answer)';
                }
                if (isUserChosen && !opt.isCorrect) {
                  optClass += ' incorrect';
                  mark = ' ✕ (Your Answer)';
                } else if (isUserChosen && opt.isCorrect) {
                  mark = ' ✓ (Your Answer - Correct)';
                }

                return (
                  <div key={opt.label} className={optClass}>
                    <strong>[{opt.label}]</strong> {opt.text} {mark}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

