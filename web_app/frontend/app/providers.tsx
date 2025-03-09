'use client';

import { AccountProvider, ProfileProvider, AuthProvider } from './contexts';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <AccountProvider>
        <AuthProvider>
          <ProfileProvider>
            {children}
          </ProfileProvider>
        </AuthProvider>
      </AccountProvider>
  );
}