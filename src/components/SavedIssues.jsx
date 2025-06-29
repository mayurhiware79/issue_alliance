// import React, { useState, useEffect } from "react";
// import { useAuth } from "../contexts/AuthContext";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { db } from "../firebase";
// import {
//   FaGithub,
//   FaSpinner,
//   FaCodeBranch,
//   FaCalendarAlt,
//   FaLink,
//   FaTrash,
//   FaExclamationCircle,
// } from "react-icons/fa";

// function SavedIssues() {
//   const { currentUser } = useAuth();
//   const [bookmarkedIssues, setBookmarkedIssues] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch bookmarked issues on component mount
//   useEffect(() => {
//     const fetchBookmarkedIssues = async () => {
//       if (!currentUser) return;

//       try {
//         setLoading(true);
//         const userRef = doc(db, "users", currentUser.uid);
//         const userSnap = await getDoc(userRef);

//         if (userSnap.exists()) {
//           const userData = userSnap.data();
//           setBookmarkedIssues(userData.bookmarkedIssues || []);
//         }
//       } catch (err) {
//         console.error("Error fetching bookmarked issues:", err);
//         setError("Failed to load saved issues. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBookmarkedIssues();
//   }, [currentUser]);

//   // Format date for display
//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   // Handle removing a bookmark
//   const handleRemoveBookmark = async (issueId) => {
//     if (!currentUser) return;

//     try {
//       const userRef = doc(db, "users", currentUser.uid);
//       const userSnap = await getDoc(userRef);

//       if (userSnap.exists()) {
//         const userData = userSnap.data();
//         let updatedBookmarks = [...(userData.bookmarkedIssues || [])];

//         // Remove the bookmark
//         updatedBookmarks = updatedBookmarks.filter(
//           (item) => item.id !== issueId
//         );

//         // Update Firestore
//         await updateDoc(userRef, {
//           bookmarkedIssues: updatedBookmarks,
//           updatedAt: new Date(),
//         });

//         // Update local state
//         setBookmarkedIssues(updatedBookmarks);
//       }
//     } catch (err) {
//       console.error("Error removing bookmark:", err);
//       setError("Failed to remove bookmark. Please try again.");
//     }
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-md overflow-hidden">
//       <div className="p-6">
//         <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
//           <FaGithub className="mr-2" /> Saved Issues
//         </h2>

//         {/* Error Message */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-start">
//             <FaExclamationCircle className="mr-2 mt-1 flex-shrink-0" />
//             <span>{error}</span>
//           </div>
//         )}

//         {/* Loading Indicator */}
//         {loading && (
//           <div className="flex justify-center my-8">
//             <FaSpinner className="animate-spin text-blue-600 text-2xl" />
//           </div>
//         )}

//         {/* No Saved Issues */}
//         {!loading && bookmarkedIssues.length === 0 && (
//           <div className="text-center py-8 text-gray-500">
//             <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
//               <FaGithub className="text-gray-400 text-3xl" />
//             </div>
//             <p className="text-lg font-medium">
//               You haven't saved any issues yet
//             </p>
//             <p className="text-sm mt-2">
//               Browse GitHub issues and click the "Save" button to bookmark them
//               for later
//             </p>
//           </div>
//         )}

//         {/* Saved Issues List */}
//         {!loading && bookmarkedIssues.length > 0 && (
//           <div className="space-y-4">
//             {bookmarkedIssues.map((issue) => (
//               <div
//                 key={issue.id}
//                 className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
//               >
//                 <div className="flex justify-between items-start">
//                   <h3 className="text-lg font-medium text-blue-600 mb-1">
//                     <a
//                       href={issue.url || issue.html_url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="hover:underline"
//                     >
//                       {issue.title}
//                     </a>
//                   </h3>
//                 </div>

//                 <div className="flex items-center text-sm text-gray-600 mb-3">
//                   <FaCodeBranch className="mr-1" />
//                   <a
//                     href={issue.repositoryUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="hover:underline"
//                   >
//                     {issue.repository}
//                   </a>
//                 </div>

//                 <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
//                   <div className="text-sm text-gray-500">
//                     <FaCalendarAlt className="inline mr-1" />
//                     Saved on {formatDate(issue.bookmarkedAt)}
//                   </div>

//                   <div className="flex space-x-2">
//                     <a
//                       href={issue.url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
//                     >
//                       <FaLink className="mr-1" /> View
//                     </a>

//                     <button
//                       onClick={() => handleRemoveBookmark(issue.id)}
//                       className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
//                     >
//                       <FaTrash className="mr-1" /> Remove
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default SavedIssues;


import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  FaGithub,
  FaSpinner,
  FaCodeBranch,
  FaCalendarAlt,
  FaLink,
  FaTrash,
  FaExclamationCircle,
} from "react-icons/fa";

function SavedIssues() {
  const { currentUser } = useAuth();
  const [bookmarkedIssues, setBookmarkedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch bookmarked issues on component mount
  useEffect(() => {
    const fetchBookmarkedIssues = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setBookmarkedIssues(userData.bookmarkedIssues || []);
        }
      } catch (err) {
        console.error("Error fetching bookmarked issues:", err);
        setError("Failed to load saved issues. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedIssues();
  }, [currentUser]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle removing a bookmark
  const handleRemoveBookmark = async (issueId) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        let updatedBookmarks = [...(userData.bookmarkedIssues || [])];

        // Remove the bookmark
        updatedBookmarks = updatedBookmarks.filter(
          (item) => item.id !== issueId
        );

        // Update Firestore
        await updateDoc(userRef, {
          bookmarkedIssues: updatedBookmarks,
          updatedAt: new Date(),
        });

        // Update local state
        setBookmarkedIssues(updatedBookmarks);
      }
    } catch (err) {
      console.error("Error removing bookmark:", err);
      setError("Failed to remove bookmark. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <FaGithub className="mr-2" /> Saved Issues
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-start">
            <FaExclamationCircle className="mr-2 mt-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center my-8">
            <FaSpinner className="animate-spin text-blue-600 text-2xl" />
          </div>
        )}

        {/* No Saved Issues */}
        {!loading && bookmarkedIssues.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
              <FaGithub className="text-gray-400 text-3xl" />
            </div>
            <p className="text-lg font-medium">
              You haven't saved any issues yet
            </p>
            <p className="text-sm mt-2">
              Browse GitHub issues and click the "Save" button to bookmark them
              for later
            </p>
          </div>
        )}

        {/* Saved Issues List */}
        {!loading && bookmarkedIssues.length > 0 && (
          <div className="space-y-4">
            {bookmarkedIssues.map((issue) => (
              <div
                key={issue.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-blue-600 mb-1">
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {issue.title}
                    </a>
                  </h3>
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <FaCodeBranch className="mr-1" />
                  <a
                    href={issue.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {issue.repository}
                  </a>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <FaCalendarAlt className="inline mr-1" />
                    Saved on {formatDate(issue.bookmarkedAt)}
                  </div>

                  <div className="flex space-x-2">
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <FaLink className="mr-1" /> View
                    </a>

                    <button
                      onClick={() => handleRemoveBookmark(issue.id)}
                      className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
                    >
                      <FaTrash className="mr-1" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedIssues;
