import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Programs from './pages/Programs';
import Classes from './pages/Classes';
import Schedule from './pages/Schedule';
import Articles from './pages/Articles';
import Nutrition from './pages/Nutrition';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Plans from './pages/Plans';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="login-container"><div>Loading...</div></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <AppLayout><Users /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/programs" element={
            <ProtectedRoute>
              <AppLayout><Programs /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/classes" element={
            <ProtectedRoute>
              <AppLayout><Classes /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute>
              <AppLayout><Schedule /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/articles" element={
            <ProtectedRoute>
              <AppLayout><Articles /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/nutrition" element={
            <ProtectedRoute>
              <AppLayout><Nutrition /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <AppLayout><Products /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <AppLayout><Orders /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/plans" element={
            <ProtectedRoute>
              <AppLayout><Plans /></AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
