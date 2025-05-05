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
import axios from "axios";

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

    const loginUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginStatus('Logging in...');
        setStatusHolder('showMessage');

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            console.log("Auth data:", authData);

            if (authError) {
                setLoginStatus('Invalid email or password');
                setStatusHolder('showMessage error');
                setTimeout(() => setStatusHolder('message'), 3000);
                throw authError;
            }

            if (!authData.user || !authData.user.id || !authData.session?.access_token) {
                setLoginStatus('Login failed: Missing user data.');
                setStatusHolder('showMessage error');
                setTimeout(() => setStatusHolder('message'), 3000);
                throw new Error('Missing user data after successful sign in.');
            }

            const userId = authData.user.id;
            const accessToken = authData.session.access_token;

            login(accessToken, userId);

            const authHeaders = {
                'Authorization': `Bearer ${accessToken}`
            };

            setLoginStatus('Fetching profile...');
            try {
                const profileResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profile?id=${userId}`, { headers: authHeaders });
                console.log("Profile data:", profileResponse.data);

                setLoginStatus('Fetching system prompt...');
                try {
                    const systemPromptResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/system-prompt`, { headers: authHeaders });
                    console.log("System prompt:", systemPromptResponse.data);

                    setLoginStatus('Login successful');
                    setStatusHolder('showMessage');
                    router.push('/chat');

                } catch (promptError) {
                    console.error("Failed to fetch system prompt:", promptError);
                    setLoginStatus('Login successful, but failed to fetch system prompt.');
                    setStatusHolder('showMessage error');
                    throw promptError;
                }

            } catch (profileError) {
                console.error("Failed to fetch profile:", profileError);
                setLoginStatus('Login successful, but failed to fetch profile.');
                setStatusHolder('showMessage error');
                throw profileError;
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Login process error:", error);
            if (!loginStatus.includes('failed') && !loginStatus.includes('Invalid')) {
                setLoginStatus(`Login failed: ${errorMessage}`);
            }
            if (!statusHolder.includes('error')) {
                setStatusHolder('showMessage error');
            }
            setTimeout(() => {
                setStatusHolder('message');
                setLoginStatus('');
            }, 3000);
        }
    }

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (statusHolder.includes('showMessage')) {
            timer = setTimeout(() => {
                setStatusHolder('message');
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [statusHolder]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginUser(e);
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

                        <button type="submit" className="btn flex">
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