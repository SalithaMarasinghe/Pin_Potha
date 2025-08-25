import React, { useState, useEffect } from 'react';
import { Plus, LogOut, Calendar, Eye } from 'lucide-react';
import { logout } from '../firebase/auth';
import { getUserEntries, Entry } from '../firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { EntryModal } from './EntryModal';
import { AddEditEntryModal } from './AddEditEntryModal';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const loadEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Loading entries for user:', user.uid);
      const userEntries = await getUserEntries(user.uid);
      console.log('Received entries:', userEntries);
      setEntries(userEntries);
      console.log('Entries state updated:', userEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEntryUpdated = () => {
    loadEntries();
    setEditingEntry(null);
    setShowAddModal(false);
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setSelectedEntry(null);
  };

  const handleDelete = () => {
    loadEntries();
    setSelectedEntry(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = a.date || new Date(0); // Fallback to epoch start if no date
    const dateB = b.date || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug info - can be removed later */}
      <div className="fixed bottom-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs z-50">
        <div>Entries count: {entries.length}</div>
        {entries.length > 0 && entries[0]?.date && (
          <div>First entry date: {new Date(entries[0].date).toString()}</div>
        )}
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Pin Potha</h1>
              <span className="text-sm text-gray-500">
                Welcome, {user?.displayName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No entries yet</h3>
            <p className="text-gray-500 mb-6">Start by creating your first memory entry</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Create First Entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">
                      {entry.name}
                    </h3>
                    <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 flex-shrink-0" />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {entry.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {entry.date ? format(new Date(entry.date), 'MMM d, yyyy') : 'No date'}
                    </span>
                    
                    {entry.mediaUrls.length > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">
                          {entry.mediaUrls.length} file{entry.mediaUrls.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {showAddModal && (
        <AddEditEntryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleEntryUpdated}
        />
      )}

      {editingEntry && (
        <AddEditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSuccess={handleEntryUpdated}
        />
      )}
    </div>
  );
};