'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ShieldAlert, ArrowRight } from "lucide-react";
import { useAuth } from "@/app/contexts";
import "../styles/App.css";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/server";
import axios from "axios";

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const supabase = createClientComponentClient({
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY
});

    const [registerStatus, setRegisterStatus] = useState('');
    const [statusHolder, setStatusHolder] = useState('message');

    const { login } = useAuth();

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterStatus('Registering...');
        setStatusHolder('showMessage');

        try{
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) {
                setRegisterStatus(`Registration failed: ${error.message}`);
                setStatusHolder('showMessage error');
                throw error;
            }

            if (!data.user || !data.user.id || !data.session?.access_token) {
                setRegisterStatus('Registration successful, but failed to get session data.');
                setStatusHolder('showMessage error');
                throw new Error('Missing user/session data after successful sign up.');
            }

            const userId = data.user.id;
            const accessToken = data.session.access_token;

            login(accessToken, userId);

            const authHeaders = {
                'Authorization': `Bearer ${accessToken}`
            };

            setRegisterStatus('Fetching profile...');
            try {
                const profileResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/${userId}`, { headers: authHeaders });
                console.log("Profile data after registration:", profileResponse.data);
            } catch (profileError) {
                console.error("Failed to fetch profile after registration:", profileError);
                setRegisterStatus('Registration successful, but failed to fetch profile.');
            }

            setRegisterStatus('Fetching system prompt...');
            try {
                const systemPromptResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/system-prompt`, { headers: authHeaders });
                console.log("System prompt:", systemPromptResponse.data);
            } catch (promptError) {
                console.error("Failed to fetch system prompt after registration:", promptError);
                setRegisterStatus('Registration successful, but failed to fetch system prompt.');
            }

            setRegisterStatus('Registration successful');
            setStatusHolder('showMessage');
            router.push('/profile');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Registration process error:", errorMessage);
            if (!registerStatus.toLowerCase().includes('failed')) {
                 setRegisterStatus(`Registration failed: ${errorMessage}`);
            }
            setStatusHolder('showMessage error');
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
        createUser(e);
    }

    return (
        <div className='registerPage flex' style={{ flexDirection: 'column' }}>
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
                        <span className={statusHolder}>{registerStatus}</span>
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
                            <span>Register</span>
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

export default Register;