import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Eye, BookOpen } from 'lucide-react';
import { getUserEntries, Entry } from '../firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { EntryModal } from './EntryModal';
import { AddEditEntryModal } from './AddEditEntryModal';
import { format, startOfMonth, endOfMonth, parseISO, getYear, getMonth } from 'date-fns';
import Header from './Header';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [useFilter, setUseFilter] = useState(false);

  // Get unique years from entries
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    entries.forEach(entry => {
      if (entry.date) {
        const entryDate = entry.date instanceof Date ? entry.date : entry.date.toDate ? entry.date.toDate() : new Date(entry.date);
        years.add(getYear(entryDate));
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [entries]);

  // Set default year/month when entries load
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(new Date().getFullYear());
      setSelectedMonth(new Date().getMonth());
    }
  }, [availableYears]);

  // Filter entries by selected year and month
  useEffect(() => {
    if (!entries.length) return;

    let filtered = [...entries];
    
    if (useFilter && (selectedYear !== null || selectedMonth !== null)) {
      filtered = entries.filter(entry => {
        if (!entry.date) return false;
        
        const entryDate = entry.date instanceof Date 
          ? entry.date 
          : entry.date.toDate ? entry.date.toDate() : new Date(entry.date);
        
        const yearMatch = selectedYear === null || getYear(entryDate) === selectedYear;
        const monthMatch = selectedMonth === null || getMonth(entryDate) === selectedMonth;
        
        return yearMatch && monthMatch;
      });
    }

    setFilteredEntries(filtered);
  }, [entries, useFilter, selectedYear, selectedMonth]);

  // Calculate summary
  const summary = React.useMemo(() => {
    return {
      totalEntries: filteredEntries.length,
      totalMedia: filteredEntries.reduce((sum, entry) => sum + (entry.mediaUrls?.length || 0), 0),
      // Add more summary stats as needed
    };
  }, [filteredEntries]);

  // Update loadEntries to set initial filter to current month
  const loadEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userEntries = await getUserEntries(user.uid);
      setEntries(userEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [user]);

  const handleEntryUpdated = (updatedEntry?: Entry) => {
    if (updatedEntry) {
      if (editingEntry?.id) {
        // Update existing entry in the local state
        setEntries(prevEntries => 
          prevEntries.map(entry => 
            entry.id === editingEntry.id 
              ? { ...entry, ...updatedEntry, id: editingEntry.id } 
              : entry
          )
        );
      } else {
        // Add new entry to the local state
        setEntries(prevEntries => [updatedEntry, ...prevEntries]);
      }
    }
    
    // Always refresh from server to ensure consistency
    loadEntries();
    setEditingEntry(undefined);
    setShowAddModal(false);
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setSelectedEntry(null);
    setShowAddModal(true);
  };

  const handleDelete = () => {
    loadEntries();
    setSelectedEntry(null);
  };

  const handleAddClick = () => {
    setShowAddModal(true);
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
      <Header onAddClick={handleAddClick} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header and Filters */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Journal Entries</h1>
          
          {/* Combined Filters and Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Filter Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filter Entries</h2>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={useFilter}
                      onChange={(e) => setUseFilter(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {useFilter ? 'Filtering On' : 'Filtering Off'}
                    </span>
                  </label>
                </div>
                
                <div className={`space-y-4 ${!useFilter ? 'opacity-50' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      value={selectedYear || ''}
                      onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={!useFilter}
                    >
                      <option value="">All Years</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      value={selectedMonth !== null ? selectedMonth : ''}
                      onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={!useFilter}
                    >
                      <option value="">All Months</option>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i} value={i}>
                          {new Date(0, i).toLocaleString(undefined, { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Entries</h3>
                  <p className="mt-2 text-3xl font-semibold">{summary.totalEntries}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    in {new Date(0, selectedMonth).toLocaleString(undefined, { month: 'long' })} {selectedYear}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Media Files</h3>
                  <p className="mt-2 text-3xl font-semibold">{summary.totalMedia}</p>
                  <p className="text-sm text-gray-500 mt-1">attached to entries</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new entry.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Entry
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
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