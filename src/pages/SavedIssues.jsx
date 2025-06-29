// import React, { useState, useEffect } from "react";
// import { useAuth } from "../contexts/AuthContext";
// import { useTheme } from "../contexts/ThemeContext";
// import { db } from "../firebase";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   deleteDoc,
//   doc,
// } from "firebase/firestore";
// import IssueCard from "../components/IssueCard";
// import { FaSpinner, FaBookmark, FaSadTear } from "react-icons/fa";

// const SavedIssues = () => {
//   const { currentUser } = useAuth();
//   const { currentTheme } = useTheme();
//   const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';
//   const [savedIssues, setSavedIssues] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchSavedIssues = async () => {
//       if (!currentUser) return;

//       try {
//         const savedIssuesRef = collection(db, "savedIssues");
//         const q = query(savedIssuesRef, where("userId", "==", currentUser.uid));
//         const querySnapshot = await getDocs(q);

//         const issues = [];
//         querySnapshot.forEach((doc) => {
//           issues.push({ id: doc.id, ...doc.data() });
//         });

//         setSavedIssues(issues);
//       } catch (error) {
//         console.error("Error fetching saved issues:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSavedIssues();
//   }, [currentUser]);

//   const handleRemoveIssue = async (issueId) => {
//     try {
//       await deleteDoc(doc(db, "savedIssues", issueId));
//       setSavedIssues(savedIssues.filter((issue) => issue.id !== issueId));
//     } catch (error) {
//       console.error("Error removing saved issue:", error);
//     }
//   };

//   if (loading) {
//     return (
//       <div className={`flex justify-center items-center h-screen ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
//         <FaSpinner className="animate-spin text-4xl" />
//       </div>
//     );
//   }

//   return (
//     <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
//       <div className="mb-8">
//         <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
//           <FaBookmark className="inline-block mr-2 text-blue-500" /> Saved Issues
//         </h1>
//         <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
//           Issues you've bookmarked for later reference.
//         </p>
//       </div>

//       {savedIssues.length === 0 ? (
//         <div className={`text-center py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg`}>
//           <FaSadTear className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-300'} mb-4`} />
//           <h3 className={`text-xl font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>No saved issues yet</h3>
//           <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} max-w-sm mx-auto mb-6`}>
//             When you find interesting issues, bookmark them to revisit later.
//           </p>
//           <a
//             href="/personalized-issues"
//             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             Explore Personalized Issues
//           </a>
//         </div>
//       ) : (
//         <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
//           {savedIssues.map((savedIssue) => (
//             <IssueCard
//               key={savedIssue.id}
//               issue={savedIssue.issue}
//               isSaved={true}
//               onRemoveSaved={() => handleRemoveIssue(savedIssue.id)}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SavedIssues;


import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import IssueCard from "../components/IssueCard";
import { FaSpinner } from "react-icons/fa";

const SavedIssues = () => {
  const [savedIssues, setSavedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchSavedIssues = async () => {
      if (!currentUser) return;

      try {
        const savedIssuesRef = collection(db, "savedIssues");
        const q = query(savedIssuesRef, where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        const issues = [];
        querySnapshot.forEach((doc) => {
          issues.push({ id: doc.id, ...doc.data() });
        });

        setSavedIssues(issues);
      } catch (error) {
        console.error("Error fetching saved issues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedIssues();
  }, [currentUser]);

  const handleRemoveIssue = async (issueId) => {
    try {
      await deleteDoc(doc(db, "savedIssues", issueId));
      setSavedIssues(savedIssues.filter((issue) => issue.id !== issueId));
    } catch (error) {
      console.error("Error removing saved issue:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FaSpinner className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Saved Issues</h1>

      {savedIssues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">You haven't saved any issues yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onRemove={() => handleRemoveIssue(issue.id)}
              isSaved={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedIssues;
