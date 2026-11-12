import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import {
  FaUser, FaGithub, FaEdit, FaPlus, FaTimes, FaSave,
  FaSpinner, FaCheck, FaExclamationCircle, FaGlobe,
  FaTwitter, FaLinkedin, FaBuilding, FaMapMarkerAlt,
  FaEnvelope, FaSync, FaCode
} from 'react-icons/fa';
import { verifyGitHubToken, getUserProfile, verifyGitHubEmailMatch, analyzeGitHubSkills } from '../services/githubService';
import EmailMatchAnimation from './EmailMatchAnimation';
import { verifyUserDataConsistency } from '../services/dailyIssueService';
import VerifySkillModal from './VerifySkillModal';

function Profile() {
  const { currentUser, updateUserProfile } = useAuth();
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    company: '',
    skills: [],
    autoSkills: [],
    verifiedSkills: [],
    githubUsername: '',
    twitterUsername: '',
    linkedinUrl: '',
    githubToken: '',
    githubConnected: false,
    githubAvatar: '',
    githubId: '',
    lastSkillsUpdate: null
  });

  const [skillInput, setSkillInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [githubVerified, setGithubVerified] = useState(false);
  const [githubVerifying, setGithubVerifying] = useState(false);
  const [githubData, setGithubData] = useState(null);
  const [fetchingSkills, setFetchingSkills] = useState(false);

  // Add new state variables for the animation
  const [isVerifying, setIsVerifying] = useState(false);
  const [githubEmail, setGithubEmail] = useState('');
  const [isEmailMatching, setIsEmailMatching] = useState(false);
  const [showEmailAnimation, setShowEmailAnimation] = useState(false);

  // New state variables for verification modal
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [skillToVerify, setSkillToVerify] = useState('');

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setProfileData({
            displayName: userData.displayName || currentUser.displayName || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || '',
            company: userData.company || '',
            skills: userData.skills || [],
            autoSkills: userData.autoSkills || [],
            verifiedSkills: userData.verifiedSkills || [],
            githubUsername: userData.githubUsername || '',
            twitterUsername: userData.twitterUsername || '',
            linkedinUrl: userData.linkedinUrl || '',
            githubToken: userData.githubToken || '',
            githubConnected: userData.githubConnected || false,
            githubAvatar: userData.githubAvatar || '',
            githubId: userData.githubId || '',
            lastSkillsUpdate: userData.lastSkillsUpdate || null
          });

          if (userData.githubData) {
            setGithubData(userData.githubData);
          } else if (userData.githubUsername) {
            try {
              const githubUserData = await getUserProfile(userData.githubUsername);
              if (githubUserData) {
                setGithubData(githubUserData);
                await updateDoc(userRef, {
                  githubData: githubUserData,
                  updatedAt: new Date()
                });
              }
            } catch (err) {
              console.error("Error fetching GitHub data:", err);
            }
          }

          if (userData.githubConnected && userData.githubUsername &&
            (!userData.autoSkills || userData.autoSkills.length === 0)) {
            fetchGitHubSkills(userData.githubUsername);
          }
        } else {
          const newUserData = {
            displayName: currentUser.displayName || '',
            email: currentUser.email,
            createdAt: new Date(),
            skills: [],
            autoSkills: [],
            verifiedSkills: [],
            bio: '',
            location: '',
            website: '',
            company: '',
            githubUsername: '',
            twitterUsername: '',
            linkedinUrl: '',
            githubToken: '',
            githubConnected: false,
            githubAvatar: '',
            githubId: '',
            lastSkillsUpdate: null
          };

          await setDoc(userRef, newUserData);
          setProfileData(newUserData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setErrorMessage("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Verify GitHub connection
  useEffect(() => {
    const verifyGitHub = async () => {
      if (!profileData.githubUsername || !profileData.githubToken) {
        setGithubVerified(false);
        return;
      }

      try {
        setGithubVerifying(true);
        const userData = await verifyGitHubToken(profileData.githubToken);

        if (userData && userData.login === profileData.githubUsername) {
          setGithubVerified(true);
          setGithubData(userData);
        } else {
          setGithubVerified(false);
        }
      } catch (error) {
        console.error("GitHub verification failed:", error);
        setGithubVerified(false);
      } finally {
        setGithubVerifying(false);
      }
    };

    verifyGitHub();
  }, [profileData.githubUsername, profileData.githubToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !profileData.skills.includes(skillInput.trim())) {
      setSkillToVerify(skillInput.trim());
      setShowVerificationModal(true);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadProfilePicture = async () => {
    if (!selectedFile) return null;

    const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!currentUser) return;

    try {
      setUpdating(true);
      setSuccessMessage('');
      setErrorMessage('');

      let photoURL = currentUser.photoURL;

      if (selectedFile) {
        photoURL = await uploadProfilePicture();
        await updateUserProfile({
          displayName: profileData.displayName,
          photoURL: photoURL
        });
      } else if (profileData.displayName !== currentUser.displayName) {
        await updateUserProfile({
          displayName: profileData.displayName
        });
      }

      // Update the main user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date()
      });

      // Also update the userStats collection for the leaderboard
      try {
        const userStatsRef = doc(db, 'userStats', currentUser.uid);
        const userStatsDoc = await getDoc(userStatsRef);

        if (userStatsDoc.exists()) {
          // Only update the display name and photo URL
          await updateDoc(userStatsRef, {
            displayName: profileData.displayName,
            photoURL: photoURL,
            // Do not overwrite other stats data like points and streak
          });
        } else {
          // If userStats doesn't exist yet, verify data consistency
          // This will create it if needed
          await verifyUserDataConsistency(currentUser.uid);
        }
      } catch (statsError) {
        console.error("Error updating userStats:", statsError);
        // Don't block the main profile update if this fails
      }

      setSuccessMessage('Profile updated successfully!');
      setSelectedFile(null);
      setUploadProgress(0);
      setEditMode(false);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // New GitHub verification using email match instead of OTP
  const handleConnectGithub = async () => {
    if (!profileData.githubUsername) return;

    try {
      setUpdating(true);
      setErrorMessage('');
      setGithubEmail('');
      setIsEmailMatching(false);

      if (!currentUser.email) {
        throw new Error("Your profile doesn't have an email. Please update your account email first.");
      }

      // Show animation before verification
      setShowEmailAnimation(true);
      setIsVerifying(true);

      // Verify if the GitHub username's email matches the user's profile email
      const verificationResult = await verifyGitHubEmailMatch(
        profileData.githubUsername,
        currentUser.email
      );

      // Set email info for animation
      if (verificationResult.githubData) {
        if (verificationResult.matchedEmail) {
          setGithubEmail(verificationResult.matchedEmail.email);
        } else if (verificationResult.githubData.email) {
          setGithubEmail(verificationResult.githubData.email);
        } else {
          setGithubEmail('Private email');
        }
      }

      // Set match result for animation
      setIsEmailMatching(verificationResult.verified);

      // Wait for animation to complete before proceeding
      setTimeout(async () => {
        if (verificationResult.verified) {
          // Fetch GitHub skills after successful connection
          let githubSkills = [];
          try {
            setFetchingSkills(true);
            const skillsData = await analyzeGitHubSkills(profileData.githubUsername);
            if (skillsData && skillsData.skills) {
              githubSkills = skillsData.skills;
            }
          } catch (skillsErr) {
            console.warn('Could not fetch GitHub skills:', skillsErr);
            // Continue without skills data
          } finally {
            setFetchingSkills(false);
          }

          // The GitHub account is verified, update user's profile
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            githubConnected: true,
            githubUsername: profileData.githubUsername,
            githubAvatar: verificationResult.githubData.avatar_url,
            githubData: verificationResult.githubData,
            autoSkills: githubSkills,
            lastSkillsUpdate: new Date(),
            updatedAt: new Date()
          });

          setProfileData(prev => ({
            ...prev,
            githubConnected: true,
            githubAvatar: verificationResult.githubData.avatar_url,
            autoSkills: githubSkills,
            lastSkillsUpdate: new Date().toISOString()
          }));

          setGithubData(verificationResult.githubData);
          setGithubVerified(true);

          const successMsg = githubSkills.length > 0
            ? `GitHub profile connected successfully! Email match verified through ${verificationResult.matchType}. Detected ${githubSkills.length} skills from your repositories.`
            : `GitHub profile connected successfully! Email match verified through ${verificationResult.matchType}.`;

          setSuccessMessage(successMsg);
        } else {
          // The GitHub account email doesn't match the user's profile email
          setErrorMessage(verificationResult.message || "Email verification failed. Make sure the GitHub account is linked to the same email as your profile.");
        }
        setUpdating(false);
        setIsVerifying(false);
      }, 4000); // Allow time for animation to complete

    } catch (error) {
      console.error("Error connecting GitHub:", error);
      setErrorMessage(`Failed to connect GitHub account: ${error.message}`);
      setUpdating(false);
      setIsVerifying(false);
      setShowEmailAnimation(false);
    }
  };

  const handleAnimationComplete = () => {
    // Animation has completed, can add additional logic here if needed
    setTimeout(() => {
      if (!isEmailMatching) {
        setShowEmailAnimation(false);
      }
    }, 3000);
  };

  // Function to fetch GitHub skills
  const fetchGitHubSkills = async (username = profileData.githubUsername) => {
    if (!username) {
      setErrorMessage("GitHub username is required to fetch skills");
      return;
    }

    try {
      setFetchingSkills(true);
      setErrorMessage('');
      setSuccessMessage('');

      const skillsData = await analyzeGitHubSkills(username);

      if (skillsData && skillsData.skills) {
        // Update in state
        setProfileData(prev => ({
          ...prev,
          autoSkills: skillsData.skills,
          lastSkillsUpdate: new Date().toISOString()
        }));

        // Update in database
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          autoSkills: skillsData.skills,
          lastSkillsUpdate: new Date(),
          updatedAt: new Date()
        });

        setSuccessMessage(`Successfully fetched ${skillsData.skills.length} skills from GitHub!`);
      } else {
        setErrorMessage("No skills found in GitHub repositories.");
      }
    } catch (error) {
      console.error("Error fetching GitHub skills:", error);
      setErrorMessage(`Failed to fetch GitHub skills: ${error.message}`);
    } finally {
      setFetchingSkills(false);
    }
  };

  // Function to refresh GitHub skills
  const refreshGitHubSkills = async () => {
    if (!profileData.githubUsername) {
      setErrorMessage("Please connect your GitHub account first");
      return;
    }

    await fetchGitHubSkills(profileData.githubUsername);
  };

  // This function will be called after a skill is successfully verified
  const handleSkillVerified = (skill) => {
    // Add the skill to the regular skills list
    setProfileData(prev => ({
      ...prev,
      skills: [...prev.skills, skill]
    }));

    // Clear the input field
    setSkillInput('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-md overflow-hidden ${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaEdit className="mr-2" /> Edit Profile
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className={`mb-4 p-3 rounded-lg ${currentTheme === 'dark' ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-800'}`}>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className={`mb-4 p-3 rounded-lg ${currentTheme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'}`}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Profile Picture & Basic Info */}
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 relative mb-4">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={profileData.displayName || "User"}
                      className="w-full h-full rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className={`w-full h-full rounded-full flex items-center justify-center ${currentTheme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                      <FaUser className={`w-12 h-12 ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                  )}
                  {editMode && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <FaEdit className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>

                {selectedFile && (
                  <div className={`text-sm mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Selected: {selectedFile.name}
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className={`w-full rounded-full h-2.5 mb-4 ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Basic Information */}
              {editMode ? (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={profileData.displayName}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300'
                        }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleChange}
                      rows="4"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300'
                        }`}
                    ></textarea>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={profileData.location}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300'
                        }`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {profileData.displayName || currentUser.displayName || 'User'}
                    </h3>
                    {profileData.bio && (
                      <p className={`mt-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {profileData.bio}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {profileData.location && (
                      <div className="flex items-center">
                        <FaMapMarkerAlt className={`mr-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                          {profileData.location}
                        </span>
                      </div>
                    )}

                    {profileData.company && (
                      <div className="flex items-center">
                        <FaBuilding className={`mr-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                          {profileData.company}
                        </span>
                      </div>
                    )}

                    {profileData.website && (
                      <div className="flex items-center">
                        <FaGlobe className={`mr-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <a
                          href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {profileData.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Middle Column - Professional Info */}
            <div className="space-y-6">
              {editMode ? (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Company/Organization
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={profileData.company}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300'
                        }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={profileData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300'
                        }`}
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profileData.skills.map((skill, index) => (
                        <div
                          key={index}
                          className={`px-3 py-1 rounded-full flex items-center ${currentTheme === 'dark'
                            ? 'bg-blue-900/50 text-blue-300'
                            : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                          <span>{skill}</span>
                          {editMode && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className={`ml-2 ${currentTheme === 'dark'
                                ? 'text-blue-400 hover:text-blue-300'
                                : 'text-blue-600 hover:text-blue-800'
                                }`}
                            >
                              <FaTimes className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {editMode && (
                      <div className="flex">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                          placeholder="Add a skill..."
                          className={`flex-grow px-4 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'border-gray-300'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition-colors"
                        >
                          <FaPlus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Skills & Expertise
                    </h3>
                    {profileData.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full flex items-center ${profileData.verifiedSkills.includes(skill)
                              ? currentTheme === 'dark'
                                ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                                : 'bg-purple-100 text-purple-800 border border-purple-300'
                              : currentTheme === 'dark'
                                ? 'bg-blue-900/50 text-blue-300'
                                : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {skill}
                            {profileData.verifiedSkills.includes(skill) && (
                              <span className="ml-1 text-xs" title="Verified Skill">✓</span>
                            )}
                            {editMode && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className={`ml-2 ${currentTheme === 'dark'
                                  ? 'text-blue-400 hover:text-blue-300'
                                  : 'text-blue-600 hover:text-blue-800'
                                  }`}
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className={`italic ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        No skills added yet
                      </p>
                    )}
                  </div>

                  {/* GitHub Auto Skills Section */}
                  {profileData.githubConnected && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold flex items-center ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          <FaGithub className="mr-2" /> GitHub Skills
                        </h3>
                        <button
                          onClick={refreshGitHubSkills}
                          disabled={fetchingSkills}
                          className={`flex items-center px-3 py-1 rounded-md text-sm ${currentTheme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            } transition-colors disabled:opacity-50`}
                        >
                          {fetchingSkills ? (
                            <FaSpinner className="animate-spin mr-1" />
                          ) : (
                            <FaSync className="mr-1" />
                          )}
                          {fetchingSkills ? 'Analyzing...' : 'Refresh Skills'}
                        </button>
                      </div>

                      {profileData.lastSkillsUpdate && (
                        <p className={`text-xs mb-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Last updated: {new Date(profileData.lastSkillsUpdate).toLocaleString()}
                        </p>
                      )}

                      {profileData.autoSkills && profileData.autoSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.autoSkills.map((skill, index) => (
                            <span
                              key={index}
                              className={`px-3 py-1 rounded-full flex items-center ${currentTheme === 'dark'
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-green-100 text-green-800'
                                }`}
                            >
                              <FaCode className="mr-1 text-xs" /> {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className={`italic ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {fetchingSkills
                            ? 'Analyzing GitHub repositories...'
                            : 'No GitHub skills detected yet. Click "Refresh Skills" to analyze your repositories.'}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column - Social Links */}
            <div className="space-y-6">
              {/* GitHub Integration */}
              <div className={`border rounded-lg p-4 ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-3 flex items-center ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <FaGithub className="mr-2" /> GitHub Integration
                </h3>

                {/* Email Match Animation */}
                {showEmailAnimation && (
                  <EmailMatchAnimation
                    userEmail={currentUser.email}
                    githubEmail={githubEmail}
                    isMatching={isEmailMatching}
                    isVerifying={isVerifying}
                    onAnimationComplete={handleAnimationComplete}
                  />
                )}

                {/* GitHub Verification Status */}
                {profileData.githubUsername && (
                  <div className={`mb-3 p-2 rounded-lg flex items-center ${githubVerified
                    ? currentTheme === 'dark'
                      ? 'bg-green-900/30 text-green-300'
                      : 'bg-green-100 text-green-800'
                    : currentTheme === 'dark'
                      ? 'bg-yellow-900/30 text-yellow-300'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {githubVerifying ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : githubVerified ? (
                      <FaCheck className="mr-2" />
                    ) : (
                      <FaExclamationCircle className="mr-2" />
                    )}
                    <span className="text-sm">
                      {githubVerifying
                        ? 'Verifying GitHub connection...'
                        : githubVerified
                          ? 'GitHub account verified'
                          : 'GitHub account needs verification'}
                    </span>
                  </div>
                )}

                <p className={`text-sm mb-3 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Connect your GitHub account to sync your repositories and contributions.
                  <br />
                  <span className="text-xs italic flex items-center mt-1">
                    <FaEnvelope className="mr-1 text-xs" />
                    Note: Your GitHub email must match your profile email ({currentUser?.email}) for verification.
                  </span>
                </p>

                {editMode ? (
                  <div className="flex mb-3">
                    <input
                      type="text"
                      name="githubUsername"
                      value={profileData.githubUsername}
                      onChange={handleChange}
                      placeholder="GitHub username"
                      className={`flex-grow px-4 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={handleConnectGithub}
                      disabled={updating || !profileData.githubUsername}
                      className={`px-4 py-2 rounded-r-lg transition-colors ${currentTheme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-900 text-white disabled:bg-gray-700'
                        : 'bg-gray-800 hover:bg-gray-900 text-white disabled:bg-gray-400'
                        }`}
                    >
                      {updating ? <FaSpinner className="animate-spin w-4 h-4" /> : 'Verify & Connect'}
                    </button>
                  </div>
                ) : (
                  profileData.githubUsername && (
                    <div className="flex items-center mb-3">
                      <FaGithub className="mr-2" />
                      <span className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                        {profileData.githubUsername}
                      </span>
                    </div>
                  )
                )}

                {/* GitHub Data Display */}
                {githubData && (
                  <div className={`mt-4 border-t pt-4 ${currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center mb-3">
                      <img
                        src={githubData.avatar_url}
                        alt={githubData.name || githubData.login}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <h4 className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {githubData.name || githubData.login}
                        </h4>
                        <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          @{githubData.login}
                        </p>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      <div className={`p-2 rounded border ${currentTheme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white'
                        }`}>
                        <span className="font-medium">{githubData.public_repos}</span> repositories
                      </div>
                      <div className={`p-2 rounded border ${currentTheme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white'
                        }`}>
                        <span className="font-medium">{githubData.followers}</span> followers
                      </div>
                    </div>

                    {githubData.bio && (
                      <p className={`mt-2 text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {githubData.bio}
                      </p>
                    )}

                    <a
                      href={`https://github.com/${githubData.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-3 inline-block text-sm ${currentTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                        } hover:underline`}
                    >
                      View GitHub Profile
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Social Links
                </h3>

                {editMode ? (
                  <>
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Twitter Username
                      </label>
                      <div className="flex">
                        <span className={`inline-flex items-center px-3 border rounded-l-lg ${currentTheme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                          }`}>
                          @
                        </span>
                        <input
                          type="text"
                          name="twitterUsername"
                          value={profileData.twitterUsername}
                          onChange={handleChange}
                          className={`flex-1 px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'border-gray-300'
                            }`}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        name="linkedinUrl"
                        value={profileData.linkedinUrl}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/username"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'border-gray-300'
                          }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={currentUser.email}
                        disabled
                        className={`w-full px-4 py-2 border rounded-lg ${currentTheme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-400'
                          : 'bg-gray-50 border-gray-300 text-gray-500'
                          } cursor-not-allowed`}
                      />
                      <p className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        Email address cannot be changed
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {profileData.twitterUsername && (
                      <div className="flex items-center">
                        <FaTwitter className={`mr-3 ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                        <a
                          href={`https://twitter.com/${profileData.twitterUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          @{profileData.twitterUsername}
                        </a>
                      </div>
                    )}

                    {profileData.linkedinUrl && (
                      <div className="flex items-center">
                        <FaLinkedin className={`mr-3 ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                        <a
                          href={profileData.linkedinUrl.startsWith('http') ? profileData.linkedinUrl : `https://${profileData.linkedinUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {profileData.linkedinUrl.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {editMode && (
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-400"
              >
                {updating ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <VerifySkillModal
          skill={skillToVerify}
          userId={currentUser.uid}
          onClose={() => setShowVerificationModal(false)}
          onSuccess={handleSkillVerified}
        />
      )}
    </div>
  );
}

export default Profile;