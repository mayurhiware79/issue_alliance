// import {
//   collection,
//   addDoc,
//   deleteDoc,
//   doc,
//   query,
//   where,
//   getDocs,
// } from "firebase/firestore";
// import { db } from "../firebase";

// /**
//  * Save an issue to the user's saved issues
//  * @param {Object} issue - The issue to save
//  * @param {string} userId - The current user's ID
//  * @returns {Promise<string>} - The ID of the saved issue document
//  */
// export async function saveIssue(issue, userId) {
//   try {
//     // Log the issue object to see its structure
//     console.log("Saving issue:", issue);

//     // Handle the case where GitHub API returns html_url instead of url
//     const issueUrl = issue.url || issue.html_url || "";

//     // Create a safe object with only the fields we need
//     const savedIssueData = {
//       userId,
//       issueId: issue.id,
//       title: issue.title || "",
//       url: issueUrl, // Use either url or html_url, whichever is available
//       state: issue.state || "open",
//       created_at: issue.created_at || new Date().toISOString(),
//       repository_url: issue.repository_url || "",
//       repository_name: issue.repository?.full_name || "",
//       labels: issue.labels || [],
//       savedAt: new Date(),
//     };

//     // Validate required fields
//     if (!savedIssueData.issueId || !savedIssueData.title) {
//       throw new Error("Missing required issue data");
//     }

//     const docRef = await addDoc(collection(db, "savedIssues"), savedIssueData);
//     return docRef.id;
//   } catch (error) {
//     console.error("Error saving issue:", error);
//     throw error;
//   }
// }

// /**
//  * Remove a saved issue
//  * @param {string} savedIssueId - The ID of the saved issue document
//  * @returns {Promise<void>}
//  */
// export async function removeSavedIssue(savedIssueId) {
//   try {
//     await deleteDoc(doc(db, "savedIssues", savedIssueId));
//   } catch (error) {
//     console.error("Error removing saved issue:", error);
//     throw error;
//   }
// }

// /**
//  * Get all saved issues for a user
//  * @param {string} userId - The current user's ID
//  * @returns {Promise<Array>} - Array of saved issues
//  */
// export async function getSavedIssues(userId) {
//   try {
//     const q = query(
//       collection(db, "savedIssues"),
//       where("userId", "==", userId)
//     );

//     const querySnapshot = await getDocs(q);
//     const savedIssues = [];

//     querySnapshot.forEach((doc) => {
//       savedIssues.push({
//         id: doc.id,
//         ...doc.data(),
//       });
//     });

//     return savedIssues;
//   } catch (error) {
//     console.error("Error getting saved issues:", error);
//     throw error;
//   }
// }


import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Save an issue to the user's saved issues
 * @param {Object} issue - The issue to save
 * @param {string} userId - The current user's ID
 * @returns {Promise<string>} - The ID of the saved issue document
 */
export async function saveIssue(issue, userId) {
  try {
    // Log the issue object to see its structure
    console.log("Saving issue:", issue);

    // Handle the case where GitHub API returns html_url instead of url
    const issueUrl = issue.url || issue.html_url || "";

    // Create a safe object with only the fields we need
    const savedIssueData = {
      userId,
      issueId: issue.id,
      title: issue.title || "",
      url: issueUrl, // Use either url or html_url, whichever is available
      state: issue.state || "open",
      created_at: issue.created_at || new Date().toISOString(),
      repository_url: issue.repository_url || "",
      repository_name: issue.repository?.full_name || "",
      labels: issue.labels || [],
      savedAt: new Date(),
    };

    // Validate required fields
    if (!savedIssueData.issueId || !savedIssueData.title) {
      throw new Error("Missing required issue data");
    }

    const docRef = await addDoc(collection(db, "savedIssues"), savedIssueData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving issue:", error);
    throw error;
  }
}

/**
 * Remove a saved issue
 * @param {string} savedIssueId - The ID of the saved issue document
 * @returns {Promise<void>}
 */
export async function removeSavedIssue(savedIssueId) {
  try {
    await deleteDoc(doc(db, "savedIssues", savedIssueId));
  } catch (error) {
    console.error("Error removing saved issue:", error);
    throw error;
  }
}

/**
 * Get all saved issues for a user
 * @param {string} userId - The current user's ID
 * @returns {Promise<Array>} - Array of saved issues
 */
export async function getSavedIssues(userId) {
  try {
    const q = query(
      collection(db, "savedIssues"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const savedIssues = [];

    querySnapshot.forEach((doc) => {
      savedIssues.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return savedIssues;
  } catch (error) {
    console.error("Error getting saved issues:", error);
    throw error;
  }
}
