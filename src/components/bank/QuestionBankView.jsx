import React, { useMemo } from 'react';
import { useExam } from '../../context/ExamContext';
import BankQuestionItem from './BankQuestionItem';

export default function QuestionBankView() {
  const {
    questions,
    state,
    allTopics,
    dashboardStats,
    bankFilters,
    setBankFilters
  } = useExam();

  const filteredQuestions = useMemo(() => {
    const query = bankFilters.query.toLowerCase().trim();
    const { source, topic, status } = bankFilters;

    return questions.filter((q) => {
      if (source !== 'all' && !q.source.includes(source)) return false;
      if (topic !== 'all' && !(q.tags || []).includes(topic)) return false;

      const qId = q.id;
      if (status === 'starred' && !state.starred[qId]) return false;
      if (status === 'mistakes' && state.history[qId]?.lastResult !== false) return false;
      if (status === 'answered' && !state.history[qId]) return false;
      if (status === 'unanswered' && state.history[qId]) return false;

      if (query) {
        const inId = String(q.id) === query;
        const inQ = q.question.toLowerCase().includes(query);
        const inOpts = q.options.some((o) => o.text.toLowerCase().includes(query));
        if (!inId && !inQ && !inOpts) return false;
      }

      return true;
    });
  }, [questions, state.starred, state.history, bankFilters]);

  const displayedQuestions = filteredQuestions.slice(0, 100);

  return (
    <div className="view-animate">
      <div className="bank-header">
        <div>
          <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>
            Full CAD Question Bank Explorer
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Browse, search, and inspect all 229 ServiceNow CAD developer exam questions with
            instant answers, tags, and filters.
          </p>
        </div>

        <div className="search-bar-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search keywords (e.g., GlideRecord, ACL, Record Producer, Script Include, Stash, Flow)..."
            value={bankFilters.query}
            onChange={(e) =>
              setBankFilters((prev) => ({ ...prev, query: e.target.value }))
            }
          />

          <select
            className="filter-select"
            value={bankFilters.source}
            onChange={(e) =>
              setBankFilters((prev) => ({ ...prev, source: e.target.value }))
            }
          >
            <option value="all">All Sets (229)</option>
            <option value="Page 1 (Q1-50)">Page 1 (Q1-50)</option>
            <option value="Page 1 (Q51-79)">Page 1 (Q51-79)</option>
            <option value="Set 3 (Part 1)">Set 3 (Part 1)</option>
            <option value="Set 3 (Part 2)">Set 3 (Part 2)</option>
            <option value="Set 4 (Part 1)">Set 4 (Part 1)</option>
            <option value="Set 4 (Part 2)">Set 4 (Part 2)</option>
          </select>

          <select
            className="filter-select"
            value={bankFilters.topic}
            onChange={(e) =>
              setBankFilters((prev) => ({ ...prev, topic: e.target.value }))
            }
          >
            <option value="all">All Topics</option>
            {allTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={bankFilters.status}
            onChange={(e) =>
              setBankFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="all">All Status</option>
            <option value="starred">Starred Only</option>
            <option value="mistakes">Mistakes Bank Only</option>
            <option value="answered">Answered</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>

        {/* TOPIC FILTER BUTTONS */}
        <div className="bank-topic-buttons">
          <button
            type="button"
            className={`topic-filter-chip ${bankFilters.topic === 'all' ? 'active' : ''}`}
            onClick={() => setBankFilters((prev) => ({ ...prev, topic: 'all' }))}
          >
            <span>All Topics</span>
            <span className="chip-count">{questions.length}</span>
          </button>

          {allTopics.map((topic) => {
            const count = dashboardStats.topicCounts?.[topic] || 0;
            const isActive = bankFilters.topic === topic;
            return (
              <button
                key={topic}
                type="button"
                className={`topic-filter-chip ${isActive ? 'active' : ''}`}
                onClick={() =>
                  setBankFilters((prev) => ({
                    ...prev,
                    topic: isActive ? 'all' : topic
                  }))
                }
              >
                <span>{topic}</span>
                <span className="chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <span>
          Showing <strong>{filteredQuestions.length}</strong> of {questions.length} questions
          {bankFilters.topic !== 'all' ? ` in "${bankFilters.topic}"` : ''}
        </span>
        {(bankFilters.topic !== 'all' ||
          bankFilters.source !== 'all' ||
          bankFilters.status !== 'all' ||
          bankFilters.query) && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() =>
              setBankFilters({ query: '', source: 'all', topic: 'all', status: 'all' })
            }
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="bank-list">
        {filteredQuestions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-muted)'
            }}
          >
            No questions match your filter criteria.
          </div>
        ) : (
          displayedQuestions.map((q) => <BankQuestionItem key={q.id} question={q} />)
        )}

        {filteredQuestions.length > 100 && (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Showing 100 of {filteredQuestions.length} results. Use the search bar or topic
              buttons above to refine.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
