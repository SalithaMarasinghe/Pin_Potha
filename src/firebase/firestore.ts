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
  mediaUrls?: string[]; // Array of media file URLs
}

const ENTRIES_COLLECTION = 'entries';

export const addEntry = async (entry: Omit<Entry, 'id' | 'createdAt'>): Promise<Entry> => {
  try {
    // Create a clean entry object with only defined values
    const cleanEntry: Record<string, any> = {
      userId: entry.userId,
      title: entry.title || entry.name || '',
      content: entry.content || entry.description || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      mediaUrls: entry.mediaUrls || []
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
    
    return {
      ...entry,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error adding entry: ', error);
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
      const data = doc.data();
      entries.push({
        id: doc.id,
        userId: data.userId,
        title: data.title || data.name || '',
        content: data.content || data.description || '',
        date: data.date?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        mediaUrls: data.mediaUrls || []
      });
    });

    return entries;
  } catch (error) {
    console.error('Error getting entries: ', error);
    throw error;
  }
};

export const updateEntry = async (entryId: string, updates: Partial<Entry>): Promise<Entry> => {
  try {
    const entryRef = doc(db, ENTRIES_COLLECTION, entryId);
    
    // Create a clean updates object with only defined values
    const cleanUpdates: Record<string, any> = {
      updatedAt: Timestamp.now()
    };

    // Only include fields that are defined in the updates
    if (updates.title !== undefined) cleanUpdates.title = updates.title;
    if (updates.content !== undefined) cleanUpdates.content = updates.content;
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.date !== undefined) {
      cleanUpdates.date = updates.date ? Timestamp.fromDate(updates.date) : null;
    }
    if (updates.mediaUrls !== undefined) cleanUpdates.mediaUrls = updates.mediaUrls;

    await updateDoc(entryRef, cleanUpdates);

    // Get the updated document
    const updatedDoc = await getDoc(entryRef);
    const data = updatedDoc.data();
    
    if (!data) {
      throw new Error('Failed to fetch updated entry');
    }

    return {
      id: updatedDoc.id,
      userId: data.userId,
      title: data.title || data.name || '',
      content: data.content || data.description || '',
      date: data.date?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      mediaUrls: data.mediaUrls || []
    };
  } catch (error) {
    console.error('Error updating entry: ', error);
    throw error;
  }
};

export const deleteEntry = async (entryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ENTRIES_COLLECTION, entryId));
  } catch (error) {
    console.error('Error deleting entry: ', error);
    throw error;
  }
};