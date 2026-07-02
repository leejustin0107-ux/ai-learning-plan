import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary'
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
const Calendar = lazy(() => import('./pages/Calendar'));
const Progress = lazy(() => import('./pages/Progress'));
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}
export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/goals" element={<Goals />} />
            <Route
              path="/calendar"
              element={
                <Suspense fallback={<p className="page-loading">Loading calendar...</p>}>
                  <Calendar />
                </Suspense>
              }
            />

            <Route
              path="/progress"
              element={
                <Suspense fallback={<p className="page-loading">Loading progress...</p>}>
                  <Progress />
                </Suspense>
              }
            />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
