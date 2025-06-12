import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import AuthPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import IntroductionVideoPage from './pages/IntroductionVideoPage';
import LanguageSelectionPage from './pages/LanguageSelectionPage';
import QuizPage from './pages/QuizPage';
import CaseStudyVideoPage from './pages/CaseStudyVideoPage';
import CaseStudyQuestionPage from './pages/CaseStudyQuestionPage';
import ThankYouPage from './pages/ThankYouPage';
import './App.css';



function App() {
  return (
   <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/introduction-video" element={<IntroductionVideoPage />} />
        <Route path="/language-selection" element={<LanguageSelectionPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/case-video" element={<CaseStudyVideoPage />} />
        <Route path="/case-questions" element={<CaseStudyQuestionPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
