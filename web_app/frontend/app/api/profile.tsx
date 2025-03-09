import { UserProfile } from '../contexts';

// Fetch the user profile from the backend
export const fetchProfile = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`http://localhost:8000/profile?id=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      //'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming you store the token in localStorage
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch profile');
  }

  return response.json();
};

// Update the user profile
export const updateProfileAPI = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    console.log('Updating profile with data:', data);
    
    const response = await fetch('http://localhost:8000/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Store the response text first
    const responseText = await response.text();
    
    if (!response.ok) {
      // Try to parse as JSON if possible
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { detail: responseText };
      }
      
      console.error('Error response from server:', errorData);
      throw errorData.detail || 'Failed to update profile';
    }

    // Parse the already read response text
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response JSON:', e);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error in updateProfileAPI:', error);
    throw error;
  }
};