import React, {useEffect, useState} from "react";
import Axios from "axios";
import "./Login.css";
import "../../App.css";
import video from "../../LoginAssets/video.mp4";
import photo from "../../LoginAssets/logo.png";
import { Link, useNavigate } from "react-router-dom";  
import { MdEmail } from "react-icons/md"; 
import { BsFillShieldLockFill } from "react-icons/bs";
import { AiOutlineArrowRight } from "react-icons/ai";
import { useAccount } from '../../App.jsx';

const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigateTo = useNavigate();

    const [LoginStatus, setLoginStatus] = useState('');
    const [StatusHolder, setStatusHolder] = useState('message');

    const {setAccountDetails} = useAccount();
    setAccountDetails(null);

    const LoginUser = (e) => {
        e.preventDefault();
        Axios.post('http://16.171.196.43:3000/api/login', {
            Email: email,
            Password: password,
        }).then((response) => {
            console.log(response);
            if (response.status === 200) {
                //alert('Login successful');
                setAccountDetails(response);
                navigateTo('/chat')
            } else {
                //alert('Login failed');
                navigateTo('/');
                setLoginStatus('Login failed');
            }
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
            //alert('Login failed');
            navigateTo('/');
            setLoginStatus('Login failed');
          });;
    }

    useEffect(() => {
        if(LoginStatus !== ''){
            setStatusHolder('showMessage')
            setTimeout(() => {
                setStatusHolder('message')
                setLoginStatus('')
            }, 3000);
        }
    }, [LoginStatus]);

    const onSumbit = () => {
        setEmail('');
        setPassword('');
    }


    return (
        <div className='loginPage flex'>
            <div className='container flex'>

                <div className='videoDiv'>
                    <video src={video} autoPlay muted loop></video>

                    <div className='textDiv'>
                        <h2 className="title">The health companion platform and communication tool</h2>
                        <p className="p">(Beta)</p>
                    </div>

                <div className="footerDiv flex">
                    <span className="text">Don't have an account?</span>
                    <Link to="/register" className="link">
                    <button className="btn">Sign Up</button>
                    </Link>
                </div>
                </div>

                <div className="formDiv flex">
                    <div className="headerDiv">
                        <img src={photo} alt="photo" />
                        <h3>Welcome Back!</h3>
                </div>

                <form action="" className='form grid' onSubmit={onSumbit}>
                    <span className={StatusHolder}>{LoginStatus}</span>
                    <div className="inputDiv">
                        <label htmlFor="email">Email</label>
                        <div className="input flex">
                            <MdEmail className="icon" />
                            <input type="email" name="email" id="email" placeholder="Enter your email" onChange={(event)=>{
                                setEmail(event.target.value)
                            }}/>
                        </div>
                    </div>

                    <div className="inputDiv">
                        <label htmlFor="password">Password</label>
                        <div className="input flex">
                            <BsFillShieldLockFill className="icon" />
                            <input type="password" name="password" id="password" placeholder="Enter Password" onChange={(event)=>{
                                setPassword(event.target.value)
                            }}/>
                        </div>
                    </div>

                    <button type="submit" className="btn flex" onClick={LoginUser}>
                        <span>Log In</span>
                        <AiOutlineArrowRight className="icon" />
                    </button>

                    <span className="forgotPassword">
                        Forgot Password? <a href="">Click Here</a>
                    </span>

                </form>
                </div>


            </div>  
        </div>
    )
}

export default Login;