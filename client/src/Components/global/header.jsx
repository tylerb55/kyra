import Container from "../ui/container";
import logo from "../../LoginAssets/logo.png";

function Header() {
  return (
    <header className="header">
        <img src={logo} alt="photo" className="header-image"/>
        <div className="header-links">
          <a href="/chat">Chat</a>
          <a href="/profile">Profile</a>
          <a href="/">Log Out</a>
        </div>
    </header>
  );
} 
export default Header;