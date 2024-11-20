import React, {useState} from "react";
import Axios from "axios";
import "./Register.css";
import "../../App.css";
import video from "../../LoginAssets/video.mp4";
import photo from "../../LoginAssets/logo.png";
import { Link, useNavigate } from "react-router-dom";  
import { MdEmail } from "react-icons/md"; 
import { BsFillShieldLockFill } from "react-icons/bs";
import { AiOutlineArrowRight } from "react-icons/ai";
import { useAccount } from '../../App.jsx';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigateTo = useNavigate();

    const [RegisterStatus, setRegisterStatus] = useState('');
    const [StatusHolder, setStatusHolder] = useState('message');

    const {setAccountDetails} = useAccount();
    setAccountDetails(null);


    const createUser = (e) => {
        e.preventDefault();
        Axios.post('http://localhost:3000/api/register', {
            Email: email,
            Password: password,
        }).then((response) => {
            console.log(response);
            if (response.status === 201) {
                //alert('User created successfully');
                setAccountDetails({email: email});
                navigateTo('/profile');
            } else {
                alert(response.status);
                navigateTo('/register');
            }
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
            alert(error.response ? error.response.data : error.message);
            navigateTo('/register');
        });
    }

    const onSumbit = () => {
        setEmail('');
        setPassword('');
    }

    return (
        <div className='registerPage flex'>
            <div className='container flex'>

                <div className='videoDiv'>
                    <video src={video} autoPlay muted loop></video>

                    <div className='textDiv'>
                        <h2 className="title">The health companion platform and communication tool</h2>
                        <p className="p">(Beta)</p>
                    </div>

                <div className="footerDiv flex">
                    <span className="text">Have an account?</span>
                    <Link to="/" className="link">
                    <button className="btn">Sign In</button>
                    </Link>
                </div>
                </div>

                <div className="formDiv flex">
                    <div className="headerDiv">
                        <img src={photo} alt="photo" />
                        <h3>Join Us!</h3>
                </div>

                <form action="" className='form grid' onSubmit={onSumbit}>
                    <div className="inputDiv">
                        <label htmlFor="email">Email</label>
                        <div className="input flex">
                            <MdEmail className="icon" />
                            <input type="email" name="email" id="email" placeholder="Enter your email" onChange={((event)=>{
                                setEmail(event.target.value)
                            })}/>
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

                    <button type="submit" className="btn flex" onClick={createUser}>
                        <span>Register</span>
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

export default Register;