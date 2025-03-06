'use client';

import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ShieldAlert, ArrowRight } from "lucide-react";
import { useAccount } from "@/app/contexts";
import "../styles/App.css";

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const { setAccountDetails } = useAccount();
    
    // Use useEffect to set account details to null on component mount
    useEffect(() => {
        setAccountDetails(null);
    }, [setAccountDetails]);

    const createUser = (e: React.FormEvent) => {
        e.preventDefault();
        axios.post('http://16.171.196.43/api/register', {
            Email: email,
            Password: password,
        }).then((response) => {
            console.log(response);
            if (response.status === 201) {
                setAccountDetails({email: email});
                router.push('/profile');
            } else {
                alert(response.status);
                router.push('/register');
            }
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
            alert(error.response ? error.response.data : error.message);
            router.push('/register');
        });
    }

    const onSubmit = () => {
        setEmail('');
        setPassword('');
    }

    return (
        <div className='registerPage flex'>
            <div className='container flex'>
                <div className='videoDiv'>
                    <video src="/video.mp4" autoPlay muted loop></video>

                    <div className='textDiv'>
                        <h2 className="title">The health companion platform and communication tool</h2>
                        <p className="p">(Beta)</p>
                    </div>

                    <div className="footerDiv flex">
                        <span className="text">Have an account?</span>
                        <Link href="/" className="link">
                            <button className="btn">Sign In</button>
                        </Link>
                    </div>
                </div>

                <div className="formDiv flex">
                    <div className="headerDiv">
                        <Image 
                            src="/logo.png" 
                            alt="logo" 
                            width={60} 
                            height={60} 
                        />
                        <h3>Join Us!</h3>
                    </div>

                    <form action="" className='form grid' onSubmit={onSubmit}>
                        <div className="inputDiv">
                            <label htmlFor="email">Email</label>
                            <div className="input flex">
                                <Mail className="icon" />
                                <input 
                                    type="email" 
                                    name="email" 
                                    id="email" 
                                    placeholder="Enter your email" 
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="inputDiv">
                            <label htmlFor="password">Password</label>
                            <div className="input flex">
                                <ShieldAlert className="icon" />
                                <input 
                                    type="password" 
                                    name="password" 
                                    id="password" 
                                    placeholder="Enter Password" 
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn flex" onClick={createUser}>
                            <span>Register</span>
                            <ArrowRight className="icon" />
                        </button>

                        <span className="forgotPassword">
                            Forgot Password? <Link href="">Click Here</Link>
                        </span>
                        
                        <button 
                            type="button" 
                            className="btn flex" 
                            onClick={() => router.push('/chat')}
                            style={{ marginTop: '10px' }}
                        >
                            <span>Go to Chat</span>
                            <ArrowRight className="icon" />
                        </button>
                    </form>
                </div>
            </div>  
        </div>
    );
};

export default Register;