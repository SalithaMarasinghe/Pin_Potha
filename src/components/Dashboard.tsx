import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Eye } from 'lucide-react';
import { getUserEntries, Entry } from '../firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { EntryModal } from './EntryModal';
import { AddEditEntryModal } from './AddEditEntryModal';
import { format } from 'date-fns';
import Header from './Header';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>(undefined);

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

  const handleEntryUpdated = () => {
    loadEntries();
    setEditingEntry(undefined);
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
    const dateA = a.date || new Date(0);
    const dateB = b.date || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onAddClick={() => setShowAddModal(true)}
        addButtonText="New Entry"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">No entries yet</h2>
            <p className="text-gray-500 mb-6">Start by creating your first journal entry.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              Create First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Journal Entries</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {sortedEntries.map((entry) => (
                  <li key={entry.id}>
                    <div 
                      className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                          {entry.title || entry.name || 'Untitled'}
                        </h3>
                        <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 flex-shrink-0" />
                      </div>
                      <p className="text-base text-gray-600 mb-4 line-clamp-2">
                        {entry.content || entry.description || ''}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {entry.date ? format(new Date(entry.date), 'MMM d, yyyy') : 'No date'}
                        </span>
                        {entry.mediaUrls?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-gray-500">
                              {entry.mediaUrls.length} file{entry.mediaUrls.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

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
          entry={editingEntry}
          onClose={() => {
            setShowAddModal(false);
            setEditingEntry(undefined);
          }}
          onSuccess={handleEntryUpdated}
        />
      )}
    </div>
  );
};