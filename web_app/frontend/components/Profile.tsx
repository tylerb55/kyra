'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  username: string;
  diagnosis: string;
  prescription: string;
  age: number | null;
  gender: string;
  ethnicity: string;
}

const Profile = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    diagnosis: '',
    prescription: '',
    age: null,
    gender: '',
    ethnicity: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Check if user is coming from signup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fromSignup') === 'true') {
      setIsEditing(true);
    }
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile');
        
        if (response.ok) {
          const data = await response.json();
          setProfile({
            username: data.username || '',
            diagnosis: data.diagnosis || '',
            prescription: data.prescription || '',
            age: data.age || null,
            gender: data.gender || '',
            ethnicity: data.ethnicity || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : null) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    // Implement sidebar toggle functionality
  };

  return (
    <div className="profile">
      {/* Top Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Your Profile</h1>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[hsl(244,72%,87%)] text-blackColor rounded-md hover:bg-[hsl(245,82%,97%)] transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className="showMessage mb-4 bg-paleGreen text-blackColor p-3 rounded-md">
            {message}
          </div>
        )}

        <div className="accountDetails w-full bg-inputColor dark:bg-gray-700 rounded-lg p-6">
          {loading ? (
            <div className="text-center py-4">Loading profile information...</div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={profile.username}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  ) : (
                    <p className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                      {profile.username || 'Not specified'}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Age</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="age"
                      value={profile.age || ''}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  ) : (
                    <p className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                      {profile.age || 'Not specified'}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={profile.gender}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                      {profile.gender || 'Not specified'}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Ethnicity</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="ethnicity"
                      value={profile.ethnicity}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  ) : (
                    <p className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                      {profile.ethnicity || 'Not specified'}
                    </p>
                  )}
                </div>

                <div className="form-group md:col-span-2">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Diagnosis</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="diagnosis"
                      value={profile.diagnosis}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  ) : (
                    <p className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                      {profile.diagnosis || 'Not specified'}
                    </p>
                  )}
                </div>

                <div className="form-group md:col-span-2">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Prescription</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="prescription"
                      value={profile.prescription}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  ) : (
                    <p className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                      {profile.prescription || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end mt-6 space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[hsl(244,72%,87%)] text-blackColor rounded-md hover:bg-[hsl(245,82%,97%)] transition"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;