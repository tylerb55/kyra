'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts';
import logo from '@/public/logo.png';

function Header() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = (e) => {
    e.preventDefault(); 
    logout();
    router.push('/')
  };

  return (
    <header className="header">
      <Link href="/landing">
        <Image src={logo} alt="photo" className="header-image" width={60} height={60} />
      </Link>
      <div className="header-links">
        <Link href="/chat">Chat</Link>
        <Link href="/profile">Profile</Link>
        <Link href="#" onClick={handleLogout}>Log Out</Link>
      </div>
    </header>
  );
}

export default Header;