import { db } from './config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  getDoc
} from 'firebase/firestore';

export interface Entry {
  id?: string;
  userId: string;
  title?: string;        // For journal entries
  content: string;      // Main content of the entry
  name?: string;        // Alternative to title (for backward compatibility)
  description?: string; // Alternative to content (for backward compatibility)
  date?: Date | null;   // Entry date
  createdAt: Date;      // When the entry was created
  updatedAt?: Date;     // When the entry was last updated
  mediaUrls?: string[]; // Array of media URLs
}

const ENTRIES_COLLECTION = 'entries';

export const addEntry = async (entry: Omit<Entry, 'id' | 'createdAt'>): Promise<Entry> => {
  try {
    // Create a clean entry object with only defined values and proper defaults
    const cleanEntry: Record<string, any> = {
      title: entry.title || entry.name || 'Untitled',
      name: entry.name || entry.title || 'Untitled',
      description: entry.description || '',
      content: entry.content || entry.description || '',
      userId: entry.userId,
      mediaUrls: entry.mediaUrls || [],
      createdAt: Timestamp.now()
    };

    // Only add date if it exists
    if (entry.date) {
      cleanEntry.date = Timestamp.fromDate(entry.date);
    }

    // Remove any undefined values
    const finalEntry = Object.entries(cleanEntry).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), finalEntry);
    
    // Return the complete entry with ID and proper date handling
    return {
      id: docRef.id,
      ...finalEntry,
      createdAt: finalEntry.createdAt.toDate(),
      ...(finalEntry.date && { date: finalEntry.date.toDate() })
    } as Entry;
  } catch (error) {
    console.error('Error adding entry:', error);
    throw error;
  }
};

export const getUserEntries = async (userId: string): Promise<Entry[]> => {
  try {
    const q = query(
      collection(db, ENTRIES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const entries: Entry[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData;
      entries.push({
        id: doc.id,
        title: data.title || data.name, // Use title if exists, otherwise fall back to name
        name: data.name,
        description: data.description,
        content: data.content || data.description || '', // Use content if exists, otherwise fall back to description
        date: data.date?.toDate(),
        createdAt: data.createdAt.toDate(),
        userId: data.userId,
        mediaUrls: data.mediaUrls || [],
        updatedAt: data.updatedAt?.toDate()
      });
    });
    
    return entries;
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
};

export const updateEntry = async (entryId: string, updates: Partial<Entry>): Promise<Entry> => {
  try {
    const entryRef = doc(db, ENTRIES_COLLECTION, entryId);
    
    // Create a clean updates object with only defined values
    const cleanUpdates: Record<string, any> = {};
    
    // Only include fields that are defined in the updates
    if (updates.title !== undefined) cleanUpdates.title = updates.title;
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.content !== undefined) cleanUpdates.content = updates.content;
    if (updates.mediaUrls !== undefined) cleanUpdates.mediaUrls = updates.mediaUrls || [];
    
    // Handle date separately to ensure proper conversion
    if (updates.date !== undefined) {
      cleanUpdates.date = updates.date ? Timestamp.fromDate(updates.date) : null;
    }
    
    // Always update the updatedAt timestamp
    cleanUpdates.updatedAt = Timestamp.now();
    
    // Only proceed if we have valid updates
    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Perform the update
    await updateDoc(entryRef, cleanUpdates);
    
    // Get the updated document
    const updatedDoc = await getDoc(entryRef);
    if (!updatedDoc.exists()) {
      throw new Error('Entry not found after update');
    }
    
    // Convert Firestore data to Entry type
    const data = updatedDoc.data();
    return {
      id: updatedDoc.id,
      title: data.title || data.name || 'Untitled',
      name: data.name || data.title || 'Untitled',
      description: data.description || '',
      content: data.content || data.description || '',
      userId: data.userId,
      mediaUrls: data.mediaUrls || [],
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      ...(data.date && { date: data.date.toDate() })
    } as Entry;
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};

export const deleteEntry = async (entryId: string) => {
  try {
    await deleteDoc(doc(db, ENTRIES_COLLECTION, entryId));
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};