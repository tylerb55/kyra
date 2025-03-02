'use client';

import { AccountProvider, SystemPromptProvider } from './contexts';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SystemPromptProvider>
      <AccountProvider>
        {children}
      </AccountProvider>
    </SystemPromptProvider>
  );
}