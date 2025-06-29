import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { FaLinkedin, FaShare, FaCopy, FaTimes, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import uploadToCloudinary from '../utils/uploadToCloudinary';
import { useTheme } from '../contexts/ThemeContext';
import { generateLeaderboardDescription } from '../services/geminiService';

/**
 * ShareAchievementButton Component
 * Captures leaderboard section and shares it on LinkedIn
 * 
 * @param {Object} props
 * @param {string} props.username - The username to include in the share message
 * @param {number} props.rank - The user's rank (optional)
 * @param {number} props.points - The user's points (optional)
 * @param {Function} props.onSuccess - Optional callback for successful share
 * @param {Function} props.onError - Optional callback for share errors
 */
const ShareAchievementButton = ({ username, rank = 1, points = 100, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';

  const generateShareContent = async () => {
    setIsLoading(true);
    setIsGeneratingText(true);
    
    try {
      // Generate AI description
      const aiDescription = await generateLeaderboardDescription(username, rank, points);
      
      // Find the leaderboard section element
      const leaderboardElement = document.getElementById('leaderboard-section');
      
      if (!leaderboardElement) {
        throw new Error('Leaderboard section not found');
      }
      
      // Capture the leaderboard as an image using html2canvas
      const canvas = await html2canvas(leaderboardElement, {
        scale: 2, // Higher quality
        logging: false,
        useCORS: true, // To handle cross-origin images
        backgroundColor: isDarkMode ? '#1a202c' : '#f9fafb' // Match the background color
      });
      
      setIsGeneratingText(false);
      
      // Convert the canvas to a data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(dataUrl);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }
      
      // Ensure #issueAlliance hashtag is included in hashtags
      const hashtags = aiDescription.hashtags;
      if (!hashtags.toLowerCase().includes('#issuealliance')) {
        aiDescription.hashtags = '#IssueAlliance ' + hashtags;
      }
      
      // Format share message with AI-generated content
      const shareText = `${aiDescription.emojis} ${aiDescription.description}\n\n${aiDescription.hashtags}`;
      
      // Store the image URL and generated content
      setUploadedImageUrl(uploadResult.secure_url);
      setGeneratedContent({
        text: shareText,
        imageUrl: uploadResult.secure_url,
        ...aiDescription
      });
      
      // Show the preview modal
      setShowPreviewModal(true);
      
      if (onSuccess) {
        onSuccess(uploadResult.secure_url);
      }
    } catch (error) {
      console.error('Error generating share content:', error);
      if (onError) {
        onError(error.message);
      }
    } finally {
      setIsLoading(false);
      setIsGeneratingText(false);
    }
  };
  
  const handleShareOnLinkedIn = () => {
    if (!generatedContent) return;
    
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generatedContent.imageUrl)}`;
    
    // Open LinkedIn sharing window
    window.open(linkedInShareUrl, '_blank', 'width=600,height=600');
    
    // Hide the modal
    setShowPreviewModal(false);
  };
  
  const copyToClipboard = () => {
    if (!generatedContent) return;
    
    navigator.clipboard.writeText(generatedContent.text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <>
      <button
        onClick={generateShareContent}
        disabled={isLoading}
        className={`
          flex items-center justify-center px-4 py-2 
          rounded-lg font-medium transition-all duration-200
          ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} 
          text-white shadow hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            <span>{isGeneratingText ? 'Generating description...' : 'Processing...'}</span>
          </>
        ) : (
          <>
            <FaLinkedin className="mr-2" />
            <span>Share on LinkedIn</span>
          </>
        )}
      </button>
      
      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && generatedContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative max-w-lg w-full rounded-xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  LinkedIn Share Preview
                </h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className={`p-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <FaTimes />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h4 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username: <span className="font-bold">{username || "Anonymous"}</span>
                  </h4>
                  <h4 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Rank: <span className="font-bold">#{rank}</span>
                  </h4>
                  <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Achievement: <span className="font-bold">{points} points</span>
                  </h4>
                </div>
                
                <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Share Text
                    </h4>
                    <button
                      onClick={copyToClipboard}
                      className={`ml-2 p-2 rounded text-xs flex items-center 
                        ${isCopied ? 
                          (isDarkMode ? 'bg-green-700 text-green-100' : 'bg-green-100 text-green-800') : 
                          (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400')
                        }`}
                    >
                      {isCopied ? (
                        <>
                          <FaCheck className="mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <FaCopy className="mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {generatedContent.text}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <button
                    onClick={handleShareOnLinkedIn}
                    className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium 
                      ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                  >
                    <FaLinkedin className="mr-2" />
                    Share on LinkedIn
                  </button>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium
                      ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShareAchievementButton; 