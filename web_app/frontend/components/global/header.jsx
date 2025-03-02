'use client';

import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.png';

function Header() {
  return (
    <header className="header">
      <Image src={logo} alt="photo" className="header-image" width={60} height={60} />
      <div className="header-links">
        <Link href="/chat">Chat</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/">Log Out</Link>
      </div>
    </header>
  );
}

export default Header;