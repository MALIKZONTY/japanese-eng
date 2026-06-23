import * as React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { Dictionary } from './pages/Dictionary';
import { WordDetails } from './pages/WordDetails';
import { AddWord } from './pages/AddWord';
import { Groups } from './pages/Groups';
import { GroupDetails } from './pages/GroupDetails';
import { Favorites } from './pages/Favorites';

// Create TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dictionary" element={<Dictionary />} />
              <Route path="/dictionary/:id" element={<WordDetails />} />
              <Route path="/add" element={<AddWord />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetails />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
