import React from "react";
import "./Chat.css";
import '../../App.css';
import Header from '../../Components/global/header';
import ChatBlock from '../../Components/by_page/chat';
import Footer from '../../Components/global/footer';
import { useAccount } from '../../App.jsx';
import SystemPrompt from '../../Components/by_page/system_prompt';

function Chat() {

  const {accountDetails} = useAccount();

  return (
    <div className="chat flex">
      <Header />
      <ChatBlock accountDetails={accountDetails}/>
      <SystemPrompt />
      <Footer />  
    </div>
  );
}

export default Chat;