import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, doc, setDoc, getDocs, query, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Header from './Header';

type HabitType = 'Meditation' | 'Worship' | 'Listening to Dhamma' | 'Dhamma Discussion' | 'Dhamma Teaching';

interface HabitEntry {
  id: string;
  habitType: HabitType;
  hours: number;
  notes: string;
  date: Date;
  userId: string;
  createdAt: Date;
}

const HABIT_ENTRIES_COLLECTION = 'habitEntries';
const HABITS: HabitType[] = [
  'Meditation', 
  'Worship', 
  'Listening to Dhamma',
  'Dhamma Discussion',
  'Dhamma Teaching'
];

const Habits: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    habitType: 'Meditation' as HabitType,
    hours: 1,
    notes: '',
  });
  const [showDateDetails, setShowDateDetails] = useState<Date | null>(null);

  // Load entries for the selected month
  useEffect(() => {
    if (!user) return;

    const loadEntries = async () => {
      try {
        setLoading(true);
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        
        const q = query(
          collection(db, HABIT_ENTRIES_COLLECTION),
          where('userId', '==', user.uid),
          where('date', '>=', Timestamp.fromDate(start)),
          where('date', '<=', Timestamp.fromDate(end))
        );
        
        const querySnapshot = await getDocs(q);
        const loadedEntries = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date.toDate(),
            createdAt: data.createdAt.toDate(),
          } as HabitEntry;
        });
        
        setEntries(loadedEntries);
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEntries();
  }, [user, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const docRef = doc(collection(db, HABIT_ENTRIES_COLLECTION));
      const newEntry = {
        ...formData,
        id: docRef.id,
        userId: user.uid,
        date: selectedDate,
        createdAt: new Date(),
      };

      await setDoc(docRef, {
        ...newEntry,
        date: Timestamp.fromDate(selectedDate),
        createdAt: Timestamp.fromDate(new Date()),
      });

      setEntries([...entries, newEntry]);
      setFormData(prev => ({ ...prev, hours: 1, notes: '' }));
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    }
  };

  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => isSameDay(entry.date, date));
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const dateEntries = getEntriesForDate(date);
    if (dateEntries.length === 0) return null;
    
    const totalHours = dateEntries.reduce((sum, entry) => sum + entry.hours, 0);
    
    return (
      <div className="text-xs text-center mt-1">
        <div className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center mx-auto">
          {totalHours}h
        </div>
      </div>
    );
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDateDetails(date);
  };

  // Close date details
  const closeDateDetails = () => {
    setShowDateDetails(null);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await deleteDoc(doc(db, HABIT_ENTRIES_COLLECTION, entryId));
      setEntries(entries.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dhamma Practice Tracker</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Calendar
                onChange={handleDateClick}
                onClickDay={handleDateClick}
                value={selectedDate}
                tileContent={tileContent}
                className="border-0 w-full"
              />
            </div>

            {/* Entries for selected date */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Entries for {format(selectedDate, 'MMMM d, yyyy')}
                <button 
                  onClick={() => {
                    // Scroll to form
                    document.getElementById('entry-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="ml-3 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Entry
                </button>
              </h2>
              
              {getEntriesForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No entries for this day</p>
              ) : (
                <div className="space-y-3">
                  {getEntriesForDate(selectedDate).map(entry => (
                    <div key={entry.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{entry.habitType}</h3>
                          <p className="text-sm text-gray-600">{entry.hours} hour{entry.hours !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {format(entry.createdAt, 'h:mm a')}
                          </span>
                          <button 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete entry"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Entry Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6" id="entry-form">
              <h2 className="text-lg font-semibold mb-4">
                Log Entry for {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity
                  </label>
                  <select
                    value={formData.habitType}
                    onChange={(e) => setFormData({...formData, habitType: e.target.value as HabitType})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {HABITS.map(habit => (
                      <option key={habit} value={habit}>{habit}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Spent
                  </label>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={formData.hours}
                    onChange={(e) => setFormData({...formData, hours: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Entry
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Add Date Details Modal */}
      {showDateDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeDateDetails}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {format(showDateDetails, 'EEEE, MMMM d, yyyy')}
                </h2>
                <button
                  onClick={closeDateDetails}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {getEntriesForDate(showDateDetails).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No entries for this day</p>
                ) : (
                  <ul className="space-y-3">
                    {getEntriesForDate(showDateDetails).map(entry => (
                      <li key={entry.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{entry.habitType}</h3>
                            <p className="text-sm text-gray-600">{entry.hours} hour{entry.hours !== 1 ? 's' : ''}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(entry.createdAt, 'h:mm a')}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {entry.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowDateDetails(null);
                      setSelectedDate(showDateDetails);
                      // Scroll to form
                      document.getElementById('entry-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add New Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Habits;
