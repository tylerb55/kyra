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
        try{
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) {
                setRegisterStatus('Registration failed');
                throw error;
            } else {
                setRegisterStatus('Registration successful');
            }

            // Store user ID in auth context
            if (data.user && data.user.id && data.session?.access_token) {
                login(data.session.access_token, data.user.id);
                router.push('/profile');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error:", errorMessage);
            setRegisterStatus(`Registration failed: ${errorMessage}`);
        }
    }

    useEffect(() => {
        if(registerStatus !== ''){
            setStatusHolder('showMessage');
            setTimeout(() => {
                setStatusHolder('message');
                setRegisterStatus('');
            }, 3000);
        }
    }, [registerStatus]);

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
                        <Link href="/landing">
                            <Image 
                                src="/logo.png" 
                                alt="logo" 
                                width={60} 
                                height={60} 
                            />
                        </Link>
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