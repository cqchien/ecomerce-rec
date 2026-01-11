import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router';
import '@/styles/globals.css';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
