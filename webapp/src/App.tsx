import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import {
  LandingPage,
  Dashboard,
  Reports,
  StripeSuccess,
  SignIn,
  SignUp,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  SelectAdType,
  SearchUser,
  SearchEvent,
  BrandDetails,
  AudienceTargeting,
  SelectBoostType,
  SelectAdFormat,
  CampaignDetails,
  CreateAd,
  UserAdPreview,
  EventPreview,
  Targeting,
  Payment,
  Review,
  EditCampaign,
  CampaignPerformance,
  ConversionTracking,
  Settings,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/stripe-success" element={<StripeSuccess />} />

          {/* Auth Routes */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Campaign Creation Flow */}
          <Route path="/campaign/new" element={<ProtectedRoute><SelectAdType /></ProtectedRoute>} />
          <Route path="/campaign/new/search-user" element={<ProtectedRoute><SearchUser /></ProtectedRoute>} />
          <Route path="/campaign/new/search-event" element={<ProtectedRoute><SearchEvent /></ProtectedRoute>} />
          <Route path="/campaign/new/brand-details" element={<ProtectedRoute><BrandDetails /></ProtectedRoute>} />
          <Route path="/campaign/new/audience-targeting" element={<ProtectedRoute><AudienceTargeting /></ProtectedRoute>} />
          <Route path="/campaign/new/boost-type" element={<ProtectedRoute><SelectBoostType /></ProtectedRoute>} />
          <Route path="/campaign/new/user-ad-preview" element={<ProtectedRoute><UserAdPreview /></ProtectedRoute>} />
          <Route path="/campaign/new/event-preview" element={<ProtectedRoute><EventPreview /></ProtectedRoute>} />
          <Route path="/campaign/new/ad-format" element={<ProtectedRoute><SelectAdFormat /></ProtectedRoute>} />
          <Route path="/campaign/new/create-ad" element={<ProtectedRoute><CreateAd /></ProtectedRoute>} />
          <Route path="/campaign/new/targeting" element={<ProtectedRoute><Targeting /></ProtectedRoute>} />
          <Route path="/campaign/new/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/campaign/new/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />

          {/* Campaign Management */}
          <Route path="/campaign/:id" element={<ProtectedRoute><CampaignDetails /></ProtectedRoute>} />
          <Route path="/campaign/:id/edit" element={<ProtectedRoute><EditCampaign /></ProtectedRoute>} />
          <Route path="/campaign/:id/performance" element={<ProtectedRoute><CampaignPerformance /></ProtectedRoute>} />
          <Route path="/campaign/:id/tracking" element={<ProtectedRoute><ConversionTracking /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
