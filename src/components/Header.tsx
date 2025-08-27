import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, ListChecks, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onAddClick?: () => void;
  showAddButton?: boolean;
  addButtonText?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onAddClick, 
  showAddButton = true,
  addButtonText = 'New Entry'
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
              Pin Potha
            </Link>
            <span className="text-sm text-gray-500 hidden md:inline">
              Welcome, {user?.displayName || 'User'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 flex items-center gap-1"
              >
                <BookOpen size={16} />
                Journal
              </Link>
              <Link 
                to="/habits" 
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 flex items-center gap-1"
              >
                <ListChecks size={16} />
                Dhamma Habits
              </Link>
            </nav>
            
            {showAddButton && onAddClick && (
              <button
                onClick={onAddClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <ListChecks size={18} />
                {addButtonText}
              </button>
            )}
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
