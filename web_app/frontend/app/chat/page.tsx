import Chat from '@/components/Chat';
import Header from '@/components/global/header';
import Footer from '@/components/global/footer';
import '@/styles/App.css';

export default function ChatPage() {
  return (
    <div className="chat">
      <Header />
      <Chat />
      <Footer />
    </div>
  );
}