// src/AppContent.tsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlayerDashboard from "./pages/dashboard/PlayerDashboard";
import CoachDashboard from "./pages/dashboard/CoachDashboard";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import NotFound from "./pages/NotFound";
import authService from './services/auth.service';
import { Button } from './components/ui/button';
import { useToast } from './hooks/use-toast';
import { User } from './types/database.types'; // Import User type

const AppContent: React.FC = () => {
  // State to track authentication status and user role
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isLoggedIn());
  const [userRole, setUserRole] = useState<User['role'] | null>(localStorage.getItem('userRole') as User['role'] || null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const location = useLocation(); // Now called inside a component rendered within BrowserRouter
  const navigate = useNavigate(); // Now called inside a component rendered within BrowserRouter
  const { toast } = useToast();

  // Check authentication status and role on mount and when location changes
  useEffect(() => {
      const checkAuth = async () => {
          setLoadingAuth(true);
          const loggedIn = authService.isLoggedIn();
          setIsAuthenticated(loggedIn);
          if (loggedIn) {
              const currentUserResult = await authService.getCurrentUser();
              if (currentUserResult.success && currentUserResult.data) {
                  setUserRole(currentUserResult.data.role);
              } else {
                  // If token is invalid or user data fetch fails, log out
                  authService.logout();
                  setIsAuthenticated(false);
                  setUserRole(null);
                  toast({
                      title: "Authentication Failed",
                      description: "Your session has expired or is invalid. Please log in again.",
                      variant: "destructive"
                  });
                   // Redirect to login if on a protected route
                   if (location.pathname.startsWith('/dashboard')) {
                       navigate('/login');
                   }
              }
          } else {
              setUserRole(null);
               // Redirect to login if on a protected route
               if (location.pathname.startsWith('/dashboard')) {
                   navigate('/login');
               }
          }
          setLoadingAuth(false);
      };

      checkAuth();

  }, [location.pathname, navigate, toast]);


  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    toast({
        title: "Logged out",
        description: "You have been successfully logged out."
    });
    navigate('/login'); // Redirect to login page after logout
  };


  // Redirect to the appropriate dashboard based on user role
  const getDashboardForRole = () => {
    switch (userRole) {
      case 'admin':
        return <SuperAdminDashboard />;
      case 'coach':
        return <CoachDashboard />;
      case 'player':
      default:
        return <PlayerDashboard />;
    }
  };

  // Show a loading indicator while checking auth
  if (loadingAuth) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="app-container"> {/* Add a container for layout */}
      {/* Optional: Add a persistent header with logout button */}
      {isAuthenticated && (
          <header className="bg-white shadow sticky top-0 z-10">
              <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                   <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sports Campus</h1>
                   <Button onClick={handleLogout} variant="outline" size="sm">Logout</Button>
              </div>
          </header>
      )}

      <Routes>
        {/* Redirect authenticated users from login/register to dashboard */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />

        <Route path="/" element={<HomePage />} />

        {/* Dashboard route requiring authentication */}
        <Route path="/dashboard" element={
          isAuthenticated ? getDashboardForRole() : <Navigate to="/login" />
        } />

        {/* Explicit routes for each dashboard type (protected) */}
        {/* These can still be accessed directly if authenticated, but will redirect if role doesn't match for admin */}
        <Route path="/dashboard/player" element={
          isAuthenticated ? <PlayerDashboard /> : <Navigate to="/login" />
        } />
        <Route path="/dashboard/coach" element={
          isAuthenticated ? <CoachDashboard /> : <Navigate to="/login" />
        } />
        <Route path="/dashboard/admin" element={
          isAuthenticated && userRole === 'admin' ?
          <SuperAdminDashboard /> :
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} /> // Redirect non-admins to their default dashboard or login
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default AppContent;
