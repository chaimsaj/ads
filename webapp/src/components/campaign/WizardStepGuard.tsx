import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getWizardData, type CampaignWizardData } from '../../hooks/useCampaignWizard';

interface WizardStepGuardProps {
  isReady: (data: CampaignWizardData) => boolean;
  children: ReactNode;
}

export function WizardStepGuard({ isReady, children }: WizardStepGuardProps) {
  const data = getWizardData();
  if (!isReady(data)) {
    return <Navigate to="/campaign/new" replace />;
  }
  return <>{children}</>;
}
