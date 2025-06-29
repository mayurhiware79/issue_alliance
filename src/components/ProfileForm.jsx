import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const ProfileForm = () => {
  const { userData, updateUser, loading } = useUser();
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    githubUsername: userData?.githubUsername || '',
    bio: userData?.bio || '',
    skills: userData?.skills?.join(', ') || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(userData?.photoURL || null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert skills string to array
    const skills = formData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
    
    try {
      await updateUser({
        ...formData,
        skills
      }, imageFile);
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">Profile Image</label>
        <div className="flex items-center space-x-4">
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5"
          />
        </div>
      </div>
      
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">Display Name</label>
        <input
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          required
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
        />
      </div>
      
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">GitHub Username</label>
        <input
          type="text"
          name="githubUsername"
          value={formData.githubUsername}
          onChange={handleChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
        />
      </div>
      
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">Skills (comma-separated)</label>
        <input
          type="text"
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
          placeholder="React, JavaScript, Node.js"
        />
      </div>
      
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows="4"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
        ></textarea>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};

export default ProfileForm; 