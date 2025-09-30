import React from 'react';

// Simple toast component placeholder
export const Toaster = () => {
  return (
    <div id="toast-container" className="fixed top-4 right-4 z-50">
      {/* Toast notifications will appear here */}
    </div>
  );
};

// Simple toast function
export const toast = {
  success: (message: string) => {
    console.log('Success:', message);
  },
  error: (message: string) => {
    console.error('Error:', message);
  },
  info: (message: string) => {
    console.log('Info:', message);
  }
};