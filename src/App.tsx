// src/App.tsx
import React from 'react';
import { BrowserRouter } from "react-router-dom";
import AppContent from "./AppContent"; // Import the new component
import { Toaster } from './components/ui/toaster'; // Import Toaster component


const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent /> {/* Render the content component inside BrowserRouter */}
      <Toaster /> {/* Render the Toaster component here */}
    </BrowserRouter>
  );
};

export default App;
