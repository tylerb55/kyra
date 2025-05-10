'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, MessageCircle, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const router = useRouter();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would add the email to your mailing list
    console.log('Subscribed with email:', email);
    setSubscribed(true);
    setEmail('');
    // Reset the subscribed state after 3 seconds
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f5f7ff]">
      <header className="container mx-auto px-4 py-8 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/landing">
            <Image src="/logo.png" alt="Kyra Logo" width={60} height={60} className="cursor-pointer" />
          </Link>
          <h1 className="text-3xl font-bold ml-2 text-[#333]">Kyra</h1>
        </div>
        <div className="space-x-4">
          <Link href="/login" className="px-4 py-2 rounded-md text-[#333] hover:bg-[#f0f0f0] transition">
            Login
          </Link>
          <Link href="/register" className="px-4 py-2 bg-[#6366f1] text-white rounded-md hover:bg-[#4f46e5] transition">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="flex flex-col gap-0">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-4xl md:text-5xl font-bold text-[#333] leading-tight mb-6">
              Your AI Health Companion for Medical Diagnosis Clarity
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Kyra helps you understand your medical diagnosis in a safe, private, and informative environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="px-6 py-3 bg-[#6366f1] text-white rounded-md hover:bg-[#4f46e5] transition text-center font-medium">
                Get Started
              </Link>
              <button 
                onClick={() => router.push('/chat?guest=true')} 
                className="px-6 py-3 bg-white border border-[#6366f1] text-[#6366f1] rounded-md hover:bg-[#f5f5ff] transition flex items-center justify-center font-medium"
              >
                Try as Guest <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="bg-white rounded-lg shadow-lg h-[400px] flex items-center justify-center overflow-hidden border border-gray-100">
              <Image 
                src="/chat-screenshot.png" 
                alt="Kyra chat interface" 
                width={600} 
                height={400} 
                className="object-cover"
                // Fallback if image doesn't exist
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='%23adb5bd' text-anchor='middle' dominant-baseline='middle'%3EKyra Chat Interface%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Why Choose Kyra?</h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">Our platform is designed with your health journey in mind.</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#f8f9ff] p-6 rounded-lg">
                <MessageCircle className="h-12 w-12 text-[#6366f1] mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-powered Chat</h3>
                <p className="text-gray-600">
                  Have natural conversations about your diagnosis with our advanced AI assistant.
                </p>
              </div>
              <div className="bg-[#f8f9ff] p-6 rounded-lg">
                <Shield className="h-12 w-12 text-[#6366f1] mb-4" />
                <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
                <p className="text-gray-600">
                  Your health information stays confidential with our secure authentication system.
                </p>
              </div>
              <div className="bg-[#f8f9ff] p-6 rounded-lg">
                <Zap className="h-12 w-12 text-[#6366f1] mb-4" />
                <h3 className="text-xl font-semibold mb-2">Fast & Responsive</h3>
                <p className="text-gray-600">
                  Get immediate answers with our optimized backend and frontend performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How Kyra Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-[#6366f1] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
                <p className="text-gray-600">
                  Sign up and enter your diagnosis and prescription information.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-[#6366f1] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Ask Questions</h3>
                <p className="text-gray-600">
                  Chat with Kyra about your diagnosis, medications, or general health concerns.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-[#6366f1] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Get Clarity</h3>
                <p className="text-gray-600">
                  Receive clear, informative responses tailored to your specific health situation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshots Section */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">See Kyra in Action</h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">Experience our intuitive interface designed for clarity and ease of use.</p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-[#6366f1] text-white py-2 px-4 font-medium">Profile Dashboard</div>
                <div className="h-[250px] flex items-center justify-center">
                  <Image 
                    src="/profile-screenshot.png" 
                    alt="Profile dashboard" 
                    width={500} 
                    height={250}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='250' viewBox='0 0 500 250'%3E%3Crect width='500' height='250' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%23adb5bd' text-anchor='middle' dominant-baseline='middle'%3EProfile Dashboard%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-[#6366f1] text-white py-2 px-4 font-medium">Chat Conversation</div>
                <div className="h-[250px] flex items-center justify-center">
                  <Image 
                    src="/chat-conversation.png" 
                    alt="Chat conversation" 
                    width={500} 
                    height={250}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='250' viewBox='0 0 500 250'%3E%3Crect width='500' height='250' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%23adb5bd' text-anchor='middle' dominant-baseline='middle'%3EChat Conversation%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Email Subscription Section */}
        <section className="py-16 bg-[#6366f1]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Stay Updated</h2>
            <p className="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for the latest updates and features.
            </p>
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex">
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-3 py-3 rounded-l-md focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-6 py-3 rounded-r-md transition"
              >
                Subscribe
              </button>
            </form>
            {subscribed && (
              <p className="mt-4 text-white bg-[#4f46e5] inline-block px-4 py-2 rounded-md">
                Thanks for subscribing!
              </p>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center text-white font-bold">S</div>
                  <div className="ml-4">
                    <h3 className="font-semibold">Sarah M.</h3>
                    <p className="text-gray-600 text-sm">Cancer Patient</p>
                  </div>
                </div>
                <p className="text-gray-600">
                &quot;Kyra helped me understand my treatment options in a way my doctor couldn&apos;t. It&apos;s like having a medical expert available 24/7.&quot;
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center text-white font-bold">J</div>
                  <div className="ml-4">
                    <h3 className="font-semibold">James T.</h3>
                    <p className="text-gray-600 text-sm">Diabetes Patient</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  &quot;I use Kyra daily to track my symptoms and understand how my medication affects me. It&apos;s become an essential part of managing my condition.&quot;
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center text-white font-bold">L</div>
                  <div className="ml-4">
                    <h3 className="font-semibold">Lisa K.</h3>
                    <p className="text-gray-600 text-sm">Caregiver</p>
                  </div>
                </div>
                <p className="text-gray-600">
                &quot;As someone caring for an elderly parent, Kyra has been invaluable in helping me understand their complex medical needs.&quot;
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#333] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center">
                <Link href="/landing">
                  <Image src="/logo.png" alt="Kyra Logo" width={40} height={40} className="cursor-pointer" />
                </Link>
                <h3 className="text-xl font-bold ml-2">Kyra</h3>
              </div>
              <p className="mt-2 text-gray-400 max-w-xs">Making healthcare conversations more accessible through AI-powered assistance.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto">
              <div>
                <h4 className="font-semibold mb-3 text-white">Product</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-white transition">Features</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition">Pricing</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition">FAQ</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-white transition">About</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition">Blog</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-white transition">Privacy</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition">Terms</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition">Security</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Kyra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}