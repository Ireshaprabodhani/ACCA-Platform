import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import AuthPage from './pages/LoginPage';
import IntroductionVideoPage from './pages/IntroductionVideoPage';
import LanguageSelectionPage from './pages/LanguageSelectionPage';
import QuizPage from './pages/QuizPage';
import CaseStudyVideoPage from './pages/CaseStudyVideoPage';
import CaseStudyQuestionPage from './pages/CaseStudyQuestionPage';
import ThankYouPage from './pages/ThankYouPage';
import AdminLayout from './admin/layout/AdminLayout';
import DashboardHome from './admin/pages/DashboardHome';
import UsersPage from './admin/pages/UsersPage';
import QuizQuestionsPage from './admin/pages/QuizQuestionsPage';
import CaseQuestionsPage from './admin/pages/CaseQuestionsPage';
import VideosPage from './admin/pages/VideosPage';
import LeaderboardPage from './admin/pages/LeaderboardPage';
import QuizAttemptsPage from './admin/pages/QuizAttemptsPage';
import CaseAttemptsPage from './admin/pages/CaseAttemptsPage';
import ResultsPage from './admin/pages/ResultsPage';
import AdminLoginPage from './admin/pages/AdminLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PdfAdminDashboard from './admin/pages/PdfAdminDashboard ';
import './App.css';




function App() {
  return (
   <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/login" element={<AuthPage />} />
        {/* <Route path="/register" element={<RegisterPage />} /> */}
        <Route path="/introduction-video" element={<IntroductionVideoPage />} />
        <Route path="/language-selection" element={<LanguageSelectionPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/case-video" element={<CaseStudyVideoPage />} />
        <Route path="/case-questions" element={<CaseStudyQuestionPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* ---------- ADMIN ---------- */}
        <Route path="/admin-login" element={<AdminLoginPage />} /> 
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="quiz-questions" element={<QuizQuestionsPage />} />
          <Route path="case-questions" element={<CaseQuestionsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="videos" element={<VideosPage />} />
          <Route path="quiz-attempts" element={<QuizAttemptsPage />} />
          <Route path="case-attempts" element={<CaseAttemptsPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="pdf" element={<PdfAdminDashboard />} />
          
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App
