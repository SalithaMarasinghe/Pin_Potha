import { collection, doc, setDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy, Timestamp, getDoc } from 'firebase/firestore';
import { db } from './config';
import { Habit, HabitEntry, DEFAULT_COLORS } from './types';

const HABITS_COLLECTION = 'habits';
const HABIT_ENTRIES_COLLECTION = 'habitEntries';

export const createHabit = async (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!habit.userId) {
    throw new Error('User ID is required to create a habit');
  }
  
  const docRef = doc(collection(db, HABITS_COLLECTION));
  const now = new Date();
  const newHabit: Habit = {
    ...habit,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  };
  
  // Create a plain object with all the data including userId
  const habitData = {
    ...newHabit,
    userId: habit.userId, // Ensure userId is included in the document
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  
  console.log('Creating habit with data:', habitData);
  
  try {
    await setDoc(docRef, habitData);
    return newHabit;
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
};

export const updateHabit = async (id: string, updates: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt'>>) => {
  const docRef = doc(db, HABITS_COLLECTION, id);
  const now = new Date();
  
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.fromDate(now),
  });
  
  return { id, ...updates, updatedAt: now };
};

export const deleteHabit = async (id: string) => {
  const docRef = doc(db, HABITS_COLLECTION, id);
  await deleteDoc(docRef);
  
  // Also delete all associated entries
  const entriesQuery = query(
    collection(db, HABIT_ENTRIES_COLLECTION),
    where('habitId', '==', id)
  );
  const entriesSnapshot = await getDocs(entriesQuery);
  const deletePromises = entriesSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

export const getUserHabits = async (userId: string): Promise<Habit[]> => {
  try {
    const q = query(
      collection(db, HABITS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} habits for user ${userId}`);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Raw habit data:', data);
      
      return {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        targetHours: data.targetHours || 1,
        color: data.color || DEFAULT_COLORS[0],
        userId: data.userId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Habit;
    });
  } catch (error) {
    console.error('Error getting user habits:', error);
    return [];
  }
};

export const createHabitEntry = async (entry: Omit<HabitEntry, 'id' | 'createdAt'>) => {
  const docRef = doc(collection(db, HABIT_ENTRIES_COLLECTION));
  const now = new Date();
  const newEntry: HabitEntry = {
    ...entry,
    id: docRef.id,
    createdAt: now,
  };
  
  await setDoc(docRef, {
    ...newEntry,
    date: Timestamp.fromDate(entry.date),
    createdAt: Timestamp.fromDate(now),
  });
  
  return newEntry;
};

export const updateHabitEntry = async (id: string, updates: Partial<Omit<HabitEntry, 'id' | 'habitId' | 'userId' | 'createdAt'>>) => {
  const docRef = doc(db, HABIT_ENTRIES_COLLECTION, id);
  const updateData: any = { ...updates };
  
  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date);
  }
  
  await updateDoc(docRef, updateData);
  return { id, ...updates };
};

export const deleteHabitEntry = async (id: string) => {
  const docRef = doc(db, HABIT_ENTRIES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const getHabitEntries = async (userId: string, habitId: string, startDate: Date, endDate: Date): Promise<HabitEntry[]> => {
  const q = query(
    collection(db, HABIT_ENTRIES_COLLECTION),
    where('userId', '==', userId),
    where('habitId', '==', habitId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate(),
      createdAt: data.createdAt?.toDate(),
    } as HabitEntry;
  });
};

export const getHabitStats = async (userId: string, habitId: string) => {
  // Get the habit to access target hours
  const habitDoc = await getDoc(doc(db, HABITS_COLLECTION, habitId));
  if (!habitDoc.exists()) {
    throw new Error('Habit not found');
  }
  const habit = habitDoc.data() as Habit;
  
  // Get all entries for this habit
  const entriesQuery = query(
    collection(db, HABIT_ENTRIES_COLLECTION),
    where('userId', '==', userId),
    where('habitId', '==', habitId)
  );
  
  const querySnapshot = await getDocs(entriesQuery);
  const totalHours = querySnapshot.docs.reduce((sum, doc) => {
    return sum + (doc.data().hours || 0);
  }, 0);
  
  return {
    totalHours,
    targetHours: habit.targetHours,
    progressPercentage: Math.min(100, Math.round((totalHours / habit.targetHours) * 100)),
    totalEntries: querySnapshot.size,
  };
};
