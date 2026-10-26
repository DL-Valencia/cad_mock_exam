import React from 'react';
import { useExam } from '../../context/ExamContext';

export default function Sidebar() {
  const {
    questions,
    activeView,
    showView,
    currentSession,
    dashboardStats,
    startExam,
    startStudy,
    startMistakesPractice,
    startStarredPractice,
    sidebarOpen,
    setSidebarOpen
  } = useExam();

  const masteryPct = Math.round((dashboardStats.totalAnswered / questions.length) * 100);

  return (
    <>
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" onClick={() => showView('dashboard')}>
          <div className="brand-logo">CAD</div>
          <div className="brand-text">
            <h1>
              ServiceNow CAD <span className="badge">Developer</span>
            </h1>
            <p>229 Mock Exam Questions & Practice Simulator</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div>
            <div className="sidebar-section-label">Navigation</div>
            <div className="sidebar-menu">
              <button
                className={`sidebar-link ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => showView('dashboard')}
              >
                <span className="sidebar-link-left">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Dashboard
                </span>
              </button>

              <button
                className={`sidebar-link ${activeView === 'bank' ? 'active' : ''}`}
                onClick={() => showView('bank')}
              >
                <span className="sidebar-link-left">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  Question Bank
                </span>
                <span className="sidebar-pill">{questions.length}</span>
              </button>

              {currentSession && (
                <button
                  className={`sidebar-link ${activeView === 'session' ? 'active' : ''}`}
                  onClick={() => showView('session')}
                >
                  <span className="sidebar-link-left">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Active Session
                  </span>
                  <span className="sidebar-pill">{currentSession.questions.length} Qs</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="sidebar-section-label">Quick Launch</div>
            <div className="sidebar-menu">
              <button
                className="sidebar-link"
                onClick={() => startExam(60, 'Timed CAD Exam Simulator', 90)}
              >
                <span className="sidebar-link-left">
                  <span>⏱️</span>
                  Timed 60-Q Exam
                </span>
                <span className="sidebar-pill">90m</span>
              </button>

              <button
                className="sidebar-link"
                onClick={() => startStudy(20, 'random', 'Quick 20 Workout')}
              >
                <span className="sidebar-link-left">
                  <span>⚡</span>
                  Quick 20 Drill
                </span>
                <span className="sidebar-pill">20 Qs</span>
              </button>

              <button className="sidebar-link" onClick={startMistakesPractice}>
                <span className="sidebar-link-left">
                  <span>⚠️</span>
                  Mistakes Bank
                </span>
                <span className="sidebar-pill">{dashboardStats.missedCount}</span>
              </button>

              <button className="sidebar-link" onClick={startStarredPractice}>
                <span className="sidebar-link-left">
                  <span>⭐</span>
                  Starred Questions
                </span>
                <span className="sidebar-pill">{dashboardStats.starredCount}</span>
              </button>

              <button
                className="sidebar-link"
                onClick={() => startStudy(229, 'all', 'All 229 Questions Marathon')}
              >
                <span className="sidebar-link-left">
                  <span>🏆</span>
                  All 229 Marathon
                </span>
                <span className="sidebar-pill">229</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-mastery-card">
            <div className="sidebar-mastery-top">
              <span>Bank Coverage</span>
              <span style={{ color: 'var(--primary)' }}>{masteryPct}%</span>
            </div>
            <div
              className="progress-bar-container"
              style={{ maxWidth: '100%', height: '6px' }}
            >
              <div
                className="progress-bar-fill"
                style={{ width: `${masteryPct}%` }}
              />
            </div>
            <div className="sidebar-mastery-sub">
              <span>
                {dashboardStats.totalAnswered} / {questions.length} Answered
              </span>
              <span>{dashboardStats.accuracy}% Accuracy</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
