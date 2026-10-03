import { lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'

// Route-level code splitting: each page loads on first visit.
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const TopicsPage = lazy(() => import('./features/topics/TopicsPage').then((m) => ({ default: m.TopicsPage })))
const TopicDetailPage = lazy(() => import('./features/topics/TopicDetailPage').then((m) => ({ default: m.TopicDetailPage })))
const VisualPage = lazy(() => import('./features/visual/VisualPage').then((m) => ({ default: m.VisualPage })))
const DiagramDetailPage = lazy(() => import('./features/visual/DiagramDetailPage').then((m) => ({ default: m.DiagramDetailPage })))
const ComparePage = lazy(() => import('./features/compare/ComparePage').then((m) => ({ default: m.ComparePage })))
const ComparisonDetailPage = lazy(() => import('./features/compare/ComparisonDetailPage').then((m) => ({ default: m.ComparisonDetailPage })))
const FlashcardsPage = lazy(() => import('./features/flashcards/FlashcardsPage').then((m) => ({ default: m.FlashcardsPage })))
const PracticePage = lazy(() => import('./features/practice/PracticePage').then((m) => ({ default: m.PracticePage })))
const PracticeSessionPage = lazy(() => import('./features/practice/PracticeSessionPage').then((m) => ({ default: m.PracticeSessionPage })))
const ExamPage = lazy(() => import('./features/exam/ExamPage').then((m) => ({ default: m.ExamPage })))
const ExamRunPage = lazy(() => import('./features/exam/ExamRunPage').then((m) => ({ default: m.ExamRunPage })))
const ExamResultsPage = lazy(() => import('./features/exam/ExamResultsPage').then((m) => ({ default: m.ExamResultsPage })))
const ServicesPage = lazy(() => import('./features/services/ServicesPage').then((m) => ({ default: m.ServicesPage })))
const ServiceDetailPage = lazy(() => import('./features/services/ServiceDetailPage').then((m) => ({ default: m.ServiceDetailPage })))
const ReferencePage = lazy(() => import('./features/reference/ReferencePage').then((m) => ({ default: m.ReferencePage })))
const ReferenceDetailPage = lazy(() => import('./features/reference/ReferenceDetailPage').then((m) => ({ default: m.ReferenceDetailPage })))
const ProgressPage = lazy(() => import('./features/progress/ProgressPage').then((m) => ({ default: m.ProgressPage })))
const SearchPage = lazy(() => import('./features/search/SearchPage').then((m) => ({ default: m.SearchPage })))
const NotFoundPage = lazy(() => import('./features/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

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
