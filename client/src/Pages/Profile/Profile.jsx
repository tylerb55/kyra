import React from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import "./Profile.css";
import '../../App.css';
import Header from '../../Components/global/header';
import AccountDetails from '../../Components/by_page/account_details';
import Footer from '../../Components/global/footer';

function Profile() {
  return (
    <div className="profile">
      <Header />
      <AccountDetails />
      <Footer /> 
    </div>
  );
}

export default Profile;