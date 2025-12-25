import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAuth } from './hooks/useAuth';

// Layout component that conditionally shows header
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  // Pages where header should be hidden
  const hideHeaderPaths = ['/editor'];
  const shouldHideHeader = hideHeaderPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="min-h-screen flex flex-col">
      {!shouldHideHeader && <Header />}
      <main className="flex-1">{children}</main>
    </div>
  );
};

// App content with routes
const AppContent = () => {
  // Initialize auth state listener
  useAuth();

  return (
    <Layout>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:projectId"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
