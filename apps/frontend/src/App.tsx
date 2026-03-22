import React from 'react';

import { ErrorBoundary } from '@/components/templates/ErrorBoundary';

import { Providers } from './providers';
import { AppRoutes } from './routes';

// MemoryLeakDebugger削除済み

function App() {
  return (
    <Providers>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </Providers>
  );
}

export default App;
