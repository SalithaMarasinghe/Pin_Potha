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
  DocumentData
} from 'firebase/firestore';

export interface Entry {
  id?: string;
  name: string;
  description: string;
  date?: Date;
  createdAt: Date;
  userId: string;
  mediaUrls: string[];
}

const ENTRIES_COLLECTION = 'entries';

export const addEntry = async (entry: Omit<Entry, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), {
      ...entry,
      createdAt: Timestamp.now(),
      ...(entry.date && { date: Timestamp.fromDate(entry.date) })
    });
    return docRef.id;
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
        name: data.name,
        description: data.description,
        date: data.date?.toDate(),
        createdAt: data.createdAt.toDate(),
        userId: data.userId,
        mediaUrls: data.mediaUrls || []
      });
    });
    
    return entries;
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
};

export const updateEntry = async (entryId: string, updates: Partial<Entry>) => {
  try {
    const entryRef = doc(db, ENTRIES_COLLECTION, entryId);
    const updateData: any = { ...updates };
    
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    } else if ('date' in updates) { // Handle setting date to undefined
      updateData.date = null;
    }
    
    await updateDoc(entryRef, updateData);
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