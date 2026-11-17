import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/src/components/common/ErrorBoundary';
import { AuthProvider } from '@/src/hooks/authContext';
import { AppRoutes } from '@/src/routes/AppRoutes';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
