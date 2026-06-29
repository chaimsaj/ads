import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout, ProtectedRoute } from './components/layout';
import { Dashboard, Users, Campaigns, Settings, Login, StripePayments, SendGridEmails } from './pages';
import { AuditLog } from './pages/audit/AuditLog';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/payments" element={<StripePayments />} />
            <Route path="/emails" element={<SendGridEmails />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
