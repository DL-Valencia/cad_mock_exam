import React from 'react';
import { useExam } from '../../context/ExamContext';

export default function PracticeModesGrid() {
  const {
    questions,
    dashboardStats,
    marathonShuffle,
    setMarathonShuffle,
    startExam,
    startStudy,
    startMistakesPractice,
    startStarredPractice
  } = useExam();

  const totalQs = questions.length;
  const coveragePct = Math.round((dashboardStats.totalAnswered / totalQs) * 100);

  return (
    <section className="dashboard-section-block">
      <h2 className="section-title">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        Study & Practice Modes
      </h2>

      <div className="modes-grid">
        {/* MODE: REAL EXAM SIMULATOR */}
        <div
          className="mode-card"
          onClick={() => startExam(60, 'Timed CAD Exam Simulator', 90)}
        >
          <div className="mode-card-body">
            <span className="mode-badge primary">⏱️ Exam Simulation</span>
            <h3>Timed Exam Simulator</h3>
            <p>
              60 questions randomized from all 229 CAD questions, 90 minutes strict countdown
              timer, 70% passing grade threshold. Mimics the real ServiceNow CAD certification
              experience.
            </p>
          </div>
          <div className="mode-footer">
            <span>60 Questions · 90 Mins</span>
            <span className="btn btn-primary btn-sm">Launch</span>
          </div>
        </div>

        {/* MODE: QUICK 20 DRILL */}
        <div
          className="mode-card"
          onClick={() => startStudy(20, 'random', 'Quick 20 Workout')}
        >
          <div className="mode-card-body">
            <span className="mode-badge success">⚡ Quick Study</span>
            <h3>Quick 20 Drill</h3>
            <p>
              20 random developer questions with instant answers, checks, and feedback. Ideal for
              rapid revision between tasks.
            </p>
          </div>
          <div className="mode-footer">
            <span>20 Questions · Instant Feedback</span>
            <span className="btn btn-secondary btn-sm">Start Drill</span>
          </div>
        </div>

        {/* MODE: MISTAKES DRILL */}
        <div className="mode-card" onClick={startMistakesPractice}>
          <div className="mode-card-body">
            <span className="mode-badge danger">⚠️ Targeted Repair</span>
            <h3>Weak-Spot Mistakes Bank</h3>
            <p>
              Target only the questions you have answered incorrectly in previous study sessions
              until you achieve 100% mastery.
            </p>
          </div>
          <div className="mode-footer">
            <span>{dashboardStats.missedCount} Questions in Bank</span>
            <span className="btn btn-secondary btn-sm">Review Missed</span>
          </div>
        </div>

        {/* MODE: STARRED ITEMS */}
        <div className="mode-card" onClick={startStarredPractice}>
          <div className="mode-card-body">
            <span className="mode-badge warning">⭐ Bookmarked</span>
            <h3>Starred Questions</h3>
            <p>
              Revisit all questions you explicitly marked for later review and reinforcement before
              sitting the official exam.
            </p>
          </div>
          <div className="mode-footer">
            <span>{dashboardStats.starredCount} Bookmarked Questions</span>
            <span className="btn btn-secondary btn-sm">Review Starred</span>
          </div>
        </div>

        {/* MODE: ALL 229 MARATHON (FULL-WIDTH FEATURED CARD) */}
        <div
          className="mode-card mode-card-featured"
          onClick={() =>
            startStudy(229, 'all', 'All 229 Questions Marathon', marathonShuffle)
          }
        >
          <div className="marathon-top-layout">
            <div className="mode-card-body">
              <div className="marathon-badges-row">
                <span className="mode-badge success" style={{ marginBottom: 0 }}>
                  🏆 Ultimate
                </span>
                <span className="marathon-accuracy-pill">
                  🎯 Accuracy: <strong>{dashboardStats.accuracy}%</strong> (
                  {dashboardStats.totalAnswered}/{totalQs} Answered · {coveragePct}%)
                </span>
              </div>

              <h3 style={{ marginTop: '0.65rem' }}>All 229 Questions Marathon</h3>
              <p style={{ marginBottom: '0.75rem' }}>
                Practice all 229 real exam questions with instant feedback and study note
                recording. Activate Shuffle Mode to randomize both question order and answer
                choices to prevent pattern memorization.
              </p>

              <div className="marathon-progress-track">
                <div
                  className="marathon-progress-fill"
                  style={{ width: `${dashboardStats.accuracy}%` }}
                />
              </div>
            </div>

            <div
              className="marathon-controls-box"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={`shuffle-toggle-btn ${marathonShuffle ? 'active' : ''}`}
                onClick={() => setMarathonShuffle((prev) => !prev)}
                title="Shuffle both questions and their answer choices to avoid memory patterns"
              >
                <span>🔀 Shuffle Qs & Choices</span>
                <span className="shuffle-status-pill">
                  {marathonShuffle ? 'ACTIVE' : 'OFF'}
                </span>
              </button>

              <div className="marathon-action-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => startStudy(229, 'all', 'All 229 Questions Marathon', false)}
                >
                  Standard Order
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setMarathonShuffle(true);
                    startStudy(
                      229,
                      'all',
                      'All 229 Questions Marathon (Shuffled)',
                      true
                    );
                  }}
                >
                  🔀 Start Shuffled Marathon
                </button>
              </div>
            </div>
          </div>

          <div className="mode-footer">
            <span>
              All {totalQs} Questions ·{' '}
              {marathonShuffle
                ? 'Shuffled Questions & Rearranged Answer Choices Active'
                : 'Sequential Order (Click Shuffle to randomize Qs & Choices)'}
            </span>
            <span className="marathon-accuracy-text">
              Overall Accuracy: <strong>{dashboardStats.accuracy}%</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
