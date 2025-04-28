'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ShieldAlert, ArrowRight } from "lucide-react";
import "../styles/App.css";
import { useAuth } from "@/app/contexts";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/server";
//import axios from "axios";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const supabase = createClientComponentClient({
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY
    });

    const [loginStatus, setLoginStatus] = useState('');
    const [statusHolder, setStatusHolder] = useState('message');

    const { login } = useAuth();

    // Scale up LLm
    //const scaleUpLlm = async () => {
    //    await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/scale-up`);
    //};

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

            // Store user ID in auth context
            if (data.user && data.user.id && data.session?.access_token) {
                login(data.session.access_token, data.user.id);
                //scaleUpLlm();
                router.push('/chat');
            }
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
        <div className='loginPage flex' style={{ flexDirection: 'column' }}>
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
                            onClick={() => {
                                router.push('/chat');
                                //scaleUpLlm();
                            }}
                            style={{ marginTop: '10px' }}
                        >
                            <span>Go to Chat</span>
                            <ArrowRight className="icon" />
                        </button>
                    </form>
                </div>
            </div>
            <footer className="disclaimerFooter" style={{ width: '100%', padding: '20px', marginTop: 'auto', backgroundColor: '#f8f8f8', borderTop: '1px solid #eee', fontSize: '0.8em', textAlign: 'center', color: '#666' }}>
                <p><strong>Welcome to the Kyra test environment. Please read the following disclaimer carefully before entering this platform:</strong></p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                    <li style={{ marginBottom: '5px' }}><strong>Non-Personal Data Usage:</strong> This test environment is intended for demonstration purposes only. Users must not input any personal, sensitive, or confidential information. All scenarios and data entered should be entirely fictional.</li>
                    <li style={{ marginBottom: '5px' }}><strong>Liability:</strong> The Kyra test environment is a prototype and not a fully developed product. Kyra is not liable for any outcomes, decisions, or actions taken based on the use of this test environment. Users acknowledge that the system is in a developmental stage and may contain errors or inaccuracies.</li>
                    <li style={{ marginBottom: '5px' }}><strong>Data Privacy:</strong> Any data entered into the Kyra test environment will not be stored, processed, or used for any purpose other than testing the functionalities of the prototype. Users are responsible for ensuring that no personal data is entered.</li>
                </ul>
                <p>By entering the Kyra test environment, you agree to comply with these terms and understand the limitations and intended use of this platform.</p>
            </footer>
        </div>
    );
};

export default Login;