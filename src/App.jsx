import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRedirect } from './components/AdminRoute';
import { ConnectionGuard } from './components/ConnectionGuard';
import { AppLayout } from './components/Layout';
import { Login } from './pages/Login';
import { Setup } from './pages/Setup';
import { AcceptInvite } from './pages/AcceptInvite';
import { Activate } from './pages/Activate';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { InventoryList } from './pages/InventoryList';
import { AddItem } from './pages/AddItem';
import { ItemDetail } from './pages/ItemDetail';
import { SharedItemView } from './pages/SharedItemView';
import { ScanQR } from './pages/ScanQR';
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { HealthCheck } from './pages/HealthCheck';
import { UserManagement } from './pages/UserManagement';
import { CategoryManager } from './pages/CategoryManager';
import { PrintLabels } from './pages/PrintLabels';

function App() {
  return (
    <ConnectionGuard>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/share/:id" element={<SharedItemView />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/invite" element={<AcceptInvite />} />
            <Route path="/activate" element={<Activate />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<InventoryList />} />
              <Route path="inventory/add" element={<AddItem />} />
              <Route path="inventory/:id" element={<ItemDetail />} />
              <Route path="scan" element={<ScanQR />} />
              <Route path="reports" element={<Reports />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="health" element={<AdminRedirect><HealthCheck /></AdminRedirect>} />
              <Route path="categories" element={<AdminRedirect><CategoryManager /></AdminRedirect>} />
              <Route path="labels" element={<PrintLabels />} />
              <Route path="users" element={<AdminRedirect><UserManagement /></AdminRedirect>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
    </ConnectionGuard>
  );
}

export default App;
