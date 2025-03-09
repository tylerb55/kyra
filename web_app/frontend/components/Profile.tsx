'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile, UserProfile } from '../app/contexts';

const Profile = () => {
  const { profile, loading, error, updateProfile} = useProfile();
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Fetch profile data when component mounts
  //useEffect(() => {
  //  if (!isAuthenticated || userId === null) return;
  //  refreshProfile();
  //}, [userId, isAuthenticated, refreshProfile]);

  // Update the local form state when profile data is loaded
  useEffect(() => {
    if (profile) {
        setFormData(profile);
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formData) return;

    const { name, value } = e.target;
    setFormData(prev => {
        if (!prev) return prev;
        return {
            ...prev,
            [name]: name === 'age' ? (value ? parseInt(value) : null) : value
        };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    // Check if the form is complete
    const { username, age, gender, ethnicity, diagnosis, prescription } = formData;
    if (!username || !age || !gender || !ethnicity || !diagnosis || !prescription) {
        setMessage('Please fill in all fields.');
        return;
    }

    try {
      if (!profile?.id) {
        throw new Error('User ID not found in profile.');
      }
      formData.id = profile?.id;
      await updateProfile(formData);
      router.push('/chat');
    } catch (error) {
      setMessage(`Failed to update profile. Please try again. ${error}`);
    }
  };

  if (loading && !formData) {
    return <div className="text-center py-4">Loading profile information...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (!formData) {
    return <div className="text-center py-4">No profile data available.</div>;
  }

  return (
    <div className="profile">
      {/* Top Navigation */}
      <div className="max-w-3xl mx-auto w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Your Profile</h1>
        </div>


        {message && (
          <div className="showMessage mb-4 bg-paleGreen text-blackColor p-3 rounded-md">
            {message}
          </div>
        )}

        <div className="accountDetails w-full bg-inputColor dark:bg-gray-700 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Ethnicity</label>
                <input
                  type="text"
                  name="ethnicity"
                  value={formData.ethnicity}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Diagnosis</label>
                <input
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Prescription</label>
                <input
                  type="text"
                  name="prescription"
                  value={formData.prescription}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-[hsl(244,72%,87%)] text-blackColor rounded-md hover:bg-[hsl(245,82%,97%)] transition"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;