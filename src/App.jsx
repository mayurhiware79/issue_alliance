import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import Home from "./components/Home";
import LoginPopup from "./components/LoginPopup";
import Register from "./components/Register";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./components/Dashboard";
import NetworkStatus from "./components/NetworkStatus";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import GeminiChatbot from "./components/GeminiChatbot";
import MobileNavbar from "./components/MobileNavbar";
import ModelTest from "./components/ModelTest";
import PersonalizedIssues from "./components/PersonalizedIssues";
import AnalyticsLogger from "./components/AnalyticsLogger";
import Analytics from "./components/Analytics";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import TestDashboard from "./pages/TestDashboard";
import TestChart from "./pages/TestChart";
import SimpleDashboard from "./pages/SimpleDashboard";
import UserAnalyticsDashboard from "./pages/UserAnalyticsDashboard";
import ThemeDemo from "./pages/ThemeDemo";
import Toast from "./components/Toast";
import DailyGitHubIssue from "./components/DailyGitHubIssue";
import Leaderboard from "./components/Leaderboard";
import { UserProvider } from './contexts/UserContext';
import About from './components/About';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import Forum from "./pages/Forum";
import AskQuestion from "./pages/AskQuestion";
import ThreadDetail from "./pages/ThreadDetail";
import Footer from './components/Footer';

// Lazy-loaded components to improve initial loading performance
const Projects = lazy(() => import("./components/Projects"));
const ProjectMatching = lazy(() => import("./components/ProjectMatching"));
const Messages = lazy(() => import("./components/Messages"));
const Profile = lazy(() => import("./components/Profile"));
const Settings = lazy(() => import("./components/Settings"));
const PrivateRoute = lazy(() => import("./components/PrivateRoute"));
const GitHubIssuesFetcher = lazy(() =>
  import("./components/GitHubIssuesFetcher")
);
const MyContributions = lazy(() => import("./components/MyContributions"));
const GitHubIssues = lazy(() => import("./components/GitHubIssuesFetcher"));
const SavedIssues = lazy(() => import("./pages/SavedIssues"));
const ScheduleMeeting = lazy(() => import("./pages/ScheduleMeeting"));
const SkillVerificationTest = lazy(() => import("./pages/SkillVerificationTest"));

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="ml-3">Loading...</p>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserProvider>
          <ThemeProvider>
            <ToastProvider>
              <ChatProvider>
                <Router>
                  <NetworkStatus />
                  {/* Toast component for notifications */}
                  <Toast />
                  {/* Analytics Logger - auto-logging disabled for now until server is set up */}
                  <AnalyticsLogger logOnMount={false} logInterval={null} />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<LoginPopup />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/model-test" element={<ModelTest />} />
                      <Route path="/analytics-direct" element={<AnalyticsDashboard />} />
                      <Route path="/test-public" element={<TestDashboard />} />
                      <Route path="/test-chart-public" element={<TestChart />} />
                      <Route path="/simple-dashboard-public" element={<SimpleDashboard />} />
                      <Route path="/theme-demo" element={<ThemeDemo />} />
                      
                      {/* New public information pages */}
                      <Route path="/about" element={<About />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/test-skill-verification" element={<SkillVerificationTest />} />

                      {/* Protected routes */}
                      <Route element={<PrivateRoute />}>
                        <Route element={<DashboardLayout />}>
                          <Route
                            path="/dashboard"
                            element={
                              <ProtectedRoute>
                                <Dashboard />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/projects"
                            element={
                              <ProtectedRoute>
                                <Projects />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/match-issues"
                            element={
                              <Suspense fallback={<LoadingFallback />}>
                                <ProjectMatching />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/personalized-issues"
                            element={
                              <ProtectedRoute>
                                <PersonalizedIssues />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/github-issues"
                            element={
                              <ProtectedRoute>
                                <GitHubIssues />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/saved-issues"
                            element={
                              <ProtectedRoute>
                                <SavedIssues />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/schedule-meeting"
                            element={
                              <ProtectedRoute>
                                <ScheduleMeeting />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/messages"
                            element={
                              <ProtectedRoute>
                                <Messages />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/profile"
                            element={
                              <Suspense fallback={<LoadingFallback />}>
                                <Profile />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/my-contributions"
                            element={
                              <Suspense fallback={<LoadingFallback />}>
                                <MyContributions />
                              </Suspense>
                            }
                          />
                          <Route 
                            path="/analytics" 
                            element={
                              <ProtectedRoute>
                                <Analytics />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/sheets-dashboard" 
                            element={
                              <ProtectedRoute>
                                <AnalyticsDashboard />
                              </ProtectedRoute>
                            } 
                          />
                          <Route
                            path="/user-analytics"
                            element={
                              <ProtectedRoute>
                                <UserAnalyticsDashboard />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/settings"
                            element={
                              <ProtectedRoute>
                                <Settings />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/leaderboard"
                            element={
                              <ProtectedRoute>
                                <Leaderboard />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/daily-challenge"
                            element={
                              <ProtectedRoute>
                                <DailyGitHubIssue />
                              </ProtectedRoute>
                            }
                          />
                          {/* Forum System Routes */}
                          <Route
                            path="/forum"
                            element={
                              <ProtectedRoute>
                                <Forum />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/ask-question"
                            element={
                              <ProtectedRoute>
                                <AskQuestion />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/thread/:threadId"
                            element={
                              <ProtectedRoute>
                                <ThreadDetail />
                              </ProtectedRoute>
                            }
                          />
                        </Route>
                      </Route>

                      {/* OAuth callback routes */}
                      <Route path="/auth/callback/google" element={<GoogleAuthCallback />} />
                      <Route path="/auth/callback" element={<HandleAuthCallback />} />

                      {/* Test routes */}
                      <Route
                        path="/test-dashboard"
                        element={
                          <ProtectedRoute>
                            <TestDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/test-chart"
                        element={
                          <ProtectedRoute>
                            <TestChart />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/simple-dashboard"
                        element={
                          <ProtectedRoute>
                            <SimpleDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Catch-all route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>

                  {/* Global Mobile Navbar - visible on all pages */}
                  <MobileNavbar />
                  
                  {/* Chatbot component */}
                  <GeminiChatbot />
                </Router>
              </ChatProvider>
            </ToastProvider>
          </ThemeProvider>
        </UserProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Component to handle auth callbacks
function HandleAuthCallback() {
  const { currentUser } = useAuth();

  React.useEffect(() => {
    console.log("Auth callback handler executed");
    // Firebase handles the callback automatically
    // This is just a placeholder page that redirects to dashboard after auth
  }, []);

  return currentUser ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="ml-3">Completing authentication...</p>
    </div>
  );
}

export default App;
