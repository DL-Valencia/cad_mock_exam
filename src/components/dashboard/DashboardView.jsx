import React from 'react';
import HeroBanner from './HeroBanner';
import StatsStrip from './StatsStrip';
import PracticeModesGrid from './PracticeModesGrid';
import DomainBreakdown from './DomainBreakdown';
import ExamHistoryTable from './ExamHistoryTable';

export default function DashboardView() {
  return (
    <div className="view-animate dashboard-stack">
      <HeroBanner />
      <StatsStrip />
      <PracticeModesGrid />
      <DomainBreakdown />
      <ExamHistoryTable />
    </div>
  );
}
