/**
 * Secure batch fetching of Venmo IDs
 * 
 * This utility maintains the same security boundaries as individual document fetches:
 * - Only fetches Venmo IDs for specific player IDs provided
 * - Does not query the entire collection
 * - Uses Firestore's getAll() which requires explicit document IDs
 * 
 * Security: This function only fetches documents for the player IDs explicitly provided.
 * It cannot be used to enumerate or access Venmo IDs for players not in the current game.
 */

import { doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetches Venmo IDs for specific player IDs using batch operations
 * 
 * @param {string[]} playerIds - Array of player IDs to fetch Venmo IDs for
 * @returns {Promise<Object>} Object mapping playerId -> venmoId
 * 
 * Security Note: Only fetches documents for the provided playerIds.
 * Firestore security rules should also restrict access to venmoIds collection.
 */
export const fetchVenmoIdsBatch = async (playerIds) => {
    if (!playerIds || playerIds.length === 0) {
        return {};
    }

    // Remove duplicates and filter out invalid IDs
    const uniquePlayerIds = [...new Set(playerIds)].filter(id => id && typeof id === 'string');
    
    if (uniquePlayerIds.length === 0) {
        return {};
    }

    try {
        const venmoData = {};
        
        // Firestore's getDocs with 'in' query is limited to 10 items
        // We'll batch the requests
        const BATCH_SIZE = 10;
        const batches = [];
        
        // Split into batches of 10
        for (let i = 0; i < uniquePlayerIds.length; i += BATCH_SIZE) {
            batches.push(uniquePlayerIds.slice(i, i + BATCH_SIZE));
        }
        
        // Fetch all batches in parallel
        const batchPromises = batches.map(async (batch) => {
            // Create document references for this batch
            const docRefs = batch.map(playerId => 
                doc(db, 'venmoIds', playerId)
            );
            
            // Fetch all documents in this batch
            // Using Promise.all with getDoc maintains security - only fetches specific documents
            const docPromises = docRefs.map(docRef => getDoc(docRef));
            const docSnapshots = await Promise.all(docPromises);
            
            // Extract Venmo IDs from results
            const batchResults = {};
            docSnapshots.forEach((docSnapshot, index) => {
                if (docSnapshot.exists()) {
                    const playerId = batch[index];
                    const venmoId = docSnapshot.data().venmoId;
                    if (venmoId) {
                        batchResults[playerId] = venmoId;
                    }
                }
            });
            
            return batchResults;
        });
        
        // Wait for all batches to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Merge all batch results into a single object
        batchResults.forEach(result => {
            Object.assign(venmoData, result);
        });
        
        return venmoData;
    } catch (error) {
        console.error('Error fetching Venmo IDs:', error);
        // Return empty object on error to maintain security
        // Don't expose error details that might leak information
        return {};
    }
};

/**
 * Alternative implementation using Firestore's 'in' query
 * 
 * Note: This approach uses a query which may be subject to different security rules.
 * The getAll() approach above is more secure as it requires explicit document references.
 * 
 * This is kept as an alternative if you prefer query-based fetching.
 */
export const fetchVenmoIdsBatchQuery = async (playerIds) => {
    if (!playerIds || playerIds.length === 0) {
        return {};
    }

    const uniquePlayerIds = [...new Set(playerIds)].filter(id => id && typeof id === 'string');
    
    if (uniquePlayerIds.length === 0) {
        return {};
    }

    try {
        const venmoData = {};
        const BATCH_SIZE = 10;
        const batches = [];
        
        // Split into batches of 10 (Firestore 'in' query limit)
        for (let i = 0; i < uniquePlayerIds.length; i += BATCH_SIZE) {
            batches.push(uniquePlayerIds.slice(i, i + BATCH_SIZE));
        }
        
        // Import query utilities
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        
        // Fetch all batches in parallel
        const batchPromises = batches.map(async (batch) => {
            const venmoRef = collection(db, 'venmoIds');
            // Query by document ID using '__name__' field
            // This only returns documents whose IDs are in the batch array
            const q = query(venmoRef, where('__name__', 'in', batch));
            const snapshot = await getDocs(q);
            
            const batchResults = {};
            snapshot.docs.forEach(doc => {
                const venmoId = doc.data().venmoId;
                if (venmoId) {
                    batchResults[doc.id] = venmoId;
                }
            });
            
            return batchResults;
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Merge results
        batchResults.forEach(result => {
            Object.assign(venmoData, result);
        });
        
        return venmoData;
    } catch (error) {
        console.error('Error fetching Venmo IDs:', error);
        return {};
    }
};
