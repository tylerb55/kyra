import Insights from '@/components/Insights';
import Header from '@/components/global/header';
import Footer from '@/components/global/footer';
import '@/styles/App.css';

export default function InsightsPage() {
  return (
    <div className="chat">
      <Header />
      <Insights />
      <Footer />
    </div>
  );
}