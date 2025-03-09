import Login from '@/components/Login';
import Chat from '@/components/Chat';
import { useProfileRedirect } from './hooks';

export default function HomePage() {
  return <Login />;
}

export function ChatPage() {
  const { loading, isProfileComplete } = useProfileRedirect(true);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isProfileComplete) {
    return null; // Will redirect to profile
  }
  
  return (
    <div>
      <Chat />
    </div>
  );
}

