import React, { useState, useRef } from 'react';
import { X, Calendar, Upload, Image, Video, Volume2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { addEntry, updateEntry, Entry } from '../firebase/firestore';
import { uploadFiles, deleteFiles } from '../firebase/storage';
import { useAuth } from '../hooks/useAuth';
import 'react-datepicker/dist/react-datepicker.css';

interface AddEditEntryModalProps {
  entry?: Entry;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEditEntryModal: React.FC<AddEditEntryModalProps> = ({
  entry,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(entry?.name || '');
  const [description, setDescription] = useState(entry?.description || '');
  const [date, setDate] = useState<Date | null>(entry?.date || null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState(entry?.mediaUrls || []);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!entry;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // Define supported file types
    const supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const supportedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac'];
    
    // Check file extensions as fallback
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

    newFiles.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const isImage = supportedImageTypes.includes(file.type) || imageExtensions.includes(extension);
      const isVideo = supportedVideoTypes.includes(file.type) || videoExtensions.includes(extension);
      const isAudio = supportedAudioTypes.includes(file.type) || audioExtensions.includes(extension);
      
      if (isImage || isVideo || isAudio) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`The following files are not supported and were not added: \n${invalidFiles.join('\n')}\n\nSupported formats:\nImages: ${imageExtensions.join(', ')}\nVideos: ${videoExtensions.join(', ')}\nAudio: ${audioExtensions.join(', ')}`);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (url: string) => {
    setExistingMediaUrls(prev => prev.filter(u => u !== url));
  };

  const getFilePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (isImage) {
      return <img src={url} alt={file.name} className="w-full h-20 object-cover rounded" />;
    } else if (isVideo) {
      return <video src={url} className="w-full h-20 object-cover rounded" />;
    } else {
      return (
        <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center">
          <Volume2 className="h-6 w-6 text-gray-500" />
        </div>
      );
    }
  };

  const getFileTypeIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    } else if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
      return <Video className="h-4 w-4" />;
    } else {
      return <Volume2 className="h-4 w-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Upload new files
      let newMediaUrls: string[] = [];
      if (files.length > 0) {
        newMediaUrls = await uploadFiles(files, user.uid);
      }

      // Combine existing and new media URLs
      const allMediaUrls = [...existingMediaUrls, ...newMediaUrls];

      const entryData = {
        name: name.trim(),
        description: description.trim(),
        ...(date && { date }), // Only include date if it exists
        userId: user.uid,
        mediaUrls: allMediaUrls
      };

      if (isEditing && entry.id) {
        // Delete removed media files
        const removedUrls = (entry.mediaUrls || []).filter(url => !existingMediaUrls.includes(url));
        if (removedUrls.length > 0) {
          await deleteFiles(removedUrls);
        }
        
        await updateEntry(entry.id, entryData);
      } else {
        await addEntry(entryData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Entry' : 'Add New Entry'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter entry name"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter description"
            />
          </div>

          {/* Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <DatePicker
                selected={date}
                onChange={(date) => setDate(date || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                dateFormat="MMMM dd, yyyy"
                placeholderText="Select date"
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Existing Media (for editing) */}
          {isEditing && existingMediaUrls.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Media
              </label>
              <div className="grid grid-cols-3 gap-2">
                {existingMediaUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xs p-2">
                      {getFileTypeIcon(url)}
                      <span className="ml-1 truncate">Media {index + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingMedia(url)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Files
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">
                Drop files here or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Supports images, videos, and audio files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                className="hidden"
              />
            </div>

            {/* File Preview */}
            {files.length > 0 && (
              <div className="mt-4">
                <div className="grid grid-cols-3 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      {getFilePreview(file)}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !description.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
          >
            {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};