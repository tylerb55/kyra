import SystemPrompt from '@/components/SystemPrompt';
import Header from '@/components/global/header';
import Footer from '@/components/global/footer';
import '@/styles/App.css';

export default function SystemPromptPage() {
  return (
    <div className="chat">
      <Header />
      <SystemPrompt />
      <Footer />
    </div>
  );
}