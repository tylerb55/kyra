'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ShieldAlert, ArrowRight } from "lucide-react";
import "../styles/App.css";
import { useAccount } from "@/app/contexts";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const supabase = createClientComponentClient({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_KEY
    });

    const [loginStatus, setLoginStatus] = useState('');
    const [statusHolder, setStatusHolder] = useState('message');

    const { setAccountDetails } = useAccount();
    
    // Use useEffect to set account details to null on component mount
    useEffect(() => {
        setAccountDetails(null);
    }, [setAccountDetails]);

    const loginUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                setLoginStatus('Invalid email or password');
                throw error;
            } else {
                setLoginStatus('Login successful');
            }

            setAccountDetails(data.user);
            router.push('/chat');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error:", errorMessage);
            setLoginStatus(`Login failed: ${errorMessage}`);
        }
    }


    useEffect(() => {
        if(loginStatus !== ''){
            setStatusHolder('showMessage');
            setTimeout(() => {
                setStatusHolder('message');
                setLoginStatus('');
            }, 3000);
        }
    }, [loginStatus]);

    const onSubmit = () => {
        setEmail('');
        setPassword('');
    }

    return (
        <div className='loginPage flex'>
            <div className='container flex'>
                <div className='videoDiv'>
                    <video src="/video.mp4" autoPlay muted loop></video>

                    <div className='textDiv'>
                        <h2 className="title">The health companion platform and communication tool</h2>
                        <p className="p">(Beta)</p>
                    </div>

                    <div className="footerDiv flex">
                        <span className="text">Don&apos;t have an account?</span>
                        <Link href="/register" className="link">
                            <button className="btn">Sign Up</button>
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
                        <h3>Welcome Back!</h3>
                    </div>

                    <form action="" className='form grid' onSubmit={onSubmit}>
                        <span className={statusHolder}>{loginStatus}</span>
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

                        <button type="submit" className="btn flex" onClick={loginUser}>
                            <span>Log In</span>
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

export default Login;