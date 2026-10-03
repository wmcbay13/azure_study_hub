import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { TopicsPage } from './features/topics/TopicsPage'
import { TopicDetailPage } from './features/topics/TopicDetailPage'
import { VisualPage } from './features/visual/VisualPage'
import { DiagramDetailPage } from './features/visual/DiagramDetailPage'
import { ComparePage } from './features/compare/ComparePage'
import { ComparisonDetailPage } from './features/compare/ComparisonDetailPage'
import { FlashcardsPage } from './features/flashcards/FlashcardsPage'
import { PracticePage } from './features/practice/PracticePage'
import { PracticeSessionPage } from './features/practice/PracticeSessionPage'
import { ExamPage } from './features/exam/ExamPage'
import { ExamRunPage } from './features/exam/ExamRunPage'
import { ExamResultsPage } from './features/exam/ExamResultsPage'
import { ServicesPage } from './features/services/ServicesPage'
import { ServiceDetailPage } from './features/services/ServiceDetailPage'
import { ReferencePage } from './features/reference/ReferencePage'
import { ReferenceDetailPage } from './features/reference/ReferenceDetailPage'
import { ProgressPage } from './features/progress/ProgressPage'
import { SearchPage } from './features/search/SearchPage'
import { NotFoundPage } from './features/NotFoundPage'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="topics" element={<TopicsPage />} />
          <Route path="topics/:slug" element={<TopicDetailPage />} />
          <Route path="visual" element={<VisualPage />} />
          <Route path="visual/:id" element={<DiagramDetailPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="compare/:id" element={<ComparisonDetailPage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="practice/session" element={<PracticeSessionPage />} />
          <Route path="exam" element={<ExamPage />} />
          <Route path="exam/run" element={<ExamRunPage />} />
          <Route path="exam/results/:id" element={<ExamResultsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:id" element={<ServiceDetailPage />} />
          <Route path="reference" element={<ReferencePage />} />
          <Route path="reference/:id" element={<ReferenceDetailPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
