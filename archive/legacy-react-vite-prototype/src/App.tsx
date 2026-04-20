import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CanvasRuntimePage from './pages/CanvasRuntimePage'
import CreatorProfilePage from './pages/CreatorProfilePage'
import HomePage from './pages/HomePage'
import PublishPage from './pages/PublishPage'
import VideoDetailPage from './pages/VideoDetailPage'
import WorkflowDetailPage from './pages/WorkflowDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/creators/:creatorSlug" element={<CreatorProfilePage />} />
        <Route path="/publish" element={<PublishPage />} />
        <Route path="/videos/:videoId" element={<VideoDetailPage />} />
        <Route path="/workflows/:workflowId" element={<WorkflowDetailPage />} />
        <Route path="/canvas/:runtimeId" element={<CanvasRuntimePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
