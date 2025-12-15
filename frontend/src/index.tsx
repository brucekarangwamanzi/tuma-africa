import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import App from './App';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

// Filter out WebSocket errors from browser extensions/dev tools
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Filter out WebSocket connection errors from browser extensions
    const errorMessage = args.join(' ');
    if (
      errorMessage.includes('WebSocket connection to \'ws://localhost:3000/ws\' failed') ||
      errorMessage.includes('WebSocketClient.js') ||
      (errorMessage.includes('socket.js') && errorMessage.includes('localhost:3000'))
    ) {
      // Silently ignore these errors - they're from browser extensions
      return;
    }
    originalError.apply(console, args);
  };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Frontend logging setup
if (process.env.NODE_ENV === 'development') {
  console.log('\n' + '='.repeat(60));
  console.log('🎨 FRONTEND STARTING');
  console.log('='.repeat(60));
  console.log('🌐 Frontend URL: http://localhost:3002');
  console.log('🔗 Backend API: ' + (process.env.REACT_APP_API_URL || '/api'));
  console.log('📦 Environment: Development');
  console.log('='.repeat(60) + '\n');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);