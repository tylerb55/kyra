import Profile from '@/components/Profile';
import Header from '@/components/global/header';
import Footer from '@/components/global/footer';
import '@/styles/App.css';

export default function ProfilePage() {
  return (
    <div className="chat">
      <Header />
      <Profile />
      <Footer />
    </div>
  );
}