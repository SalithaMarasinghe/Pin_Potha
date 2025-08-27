import React from 'react';
import { X, Calendar, Edit2, Trash2, Volume2 } from 'lucide-react';
import { Entry, deleteEntry } from '../firebase/firestore';
import { deleteFiles } from '../firebase/storage';
import { format } from 'date-fns';

interface EntryModalProps {
  entry: Entry;
  onClose: () => void;
  onEdit: (entry: Entry) => void;
  onDelete: () => void;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete
}) => {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete files from storage
      if (entry.mediaUrls.length > 0) {
        await deleteFiles(entry.mediaUrls);
      }
      
      // Delete entry from Firestore
      await deleteEntry(entry.id!);
      onDelete();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry. Please try again.');
    }
  };

  const getFileType = (url: string): 'image' | 'video' | 'audio' | 'unknown' => {
    // Try to get file extension from URL
    const extension = url.split('.').pop()?.toLowerCase() || '';
    
    // Check common file extensions
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
    
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    
    // If extension check fails, try to determine from URL pattern
    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i)) return 'image';
    if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i)) return 'video';
    if (url.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i)) return 'audio';
    
    return 'unknown';
  };

  const renderMediaPreview = (url: string) => {
    const fileType = getFileType(url);
    const fileName = url.split('/').pop() || 'file';
    
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-700">
        {fileType === 'image' && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <img 
              src={url} 
              alt={fileName}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const container = e.currentTarget.parentElement;
                if (container) {
                  container.innerHTML = `
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gray-100 dark:bg-gray-800">
                      <Image className="w-12 h-12 text-gray-400 mb-2" />
                      <span class="text-sm text-gray-600 dark:text-gray-400">Could not load image</span>
                    </div>
                  `;
                }
              }}
            />
          </div>
        )}
        
        {fileType === 'video' && (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <video 
              src={url}
              className="w-full h-full object-contain"
              controls
              autoPlay
              loop
              muted
            />
          </div>
        )}
        
        {fileType === 'audio' && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-8">
            <div className="w-full max-w-2xl">
              <div className="flex flex-col items-center justify-center">
                <Volume2 className="w-16 h-16 text-gray-400 mb-8" />
                <audio 
                  src={url} 
                  controls 
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
        
        {fileType === 'unknown' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 text-center">
            <div className="text-gray-600 dark:text-gray-400 text-lg mb-6">
              File Type: {url.split('.').pop()?.toUpperCase() || 'Unknown'}
            </div>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border-2 border-blue-500 text-blue-500 dark:text-blue-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-lg"
              download
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download File
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white line-clamp-1 pr-2">
            {entry.name}
          </h2>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onEdit(entry)}
              className="p-2 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 active:scale-95"
              aria-label="Edit entry"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 active:scale-95"
              aria-label="Delete entry"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 active:scale-95"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {/* Date */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <Calendar className="h-4 w-4 mr-1.5" />
            {entry.date ? format(entry.date, 'MMMM d, yyyy') : 'No date set'}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {entry.description}
            </p>
          </div>

          {/* Media */}
          {entry.mediaUrls.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-4">
                Media ({entry.mediaUrls.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {entry.mediaUrls.map((url, index) => (
                  <div key={index} className="relative h-48 sm:h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {renderMediaPreview(url)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};