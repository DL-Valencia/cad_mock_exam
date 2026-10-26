import React from 'react';
import { useExam } from '../../context/ExamContext';

export default function HeroBanner() {
  const { startExam } = useExam();

  return (
    <div className="hero-banner">
      <div className="hero-content">
        <h2>Pass the ServiceNow Certified Application Developer (CAD) Exam</h2>
        <p>
          Master 229 verified practice exam questions spanning all official blueprint domains:
          Client Scripts, Business Rules, Flow Designer, Access Controls (ACLs), Script Includes,
          and Application Scope.
        </p>
      </div>
      <div className="hero-actions">
        <button
          className="btn btn-primary"
          style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
          onClick={() => startExam(60, 'Real CAD Exam (60 Qs)', 90)}
        >
          ⚡ Start 60-Q Practice Exam
        </button>
      </div>
    </div>
  );
}

