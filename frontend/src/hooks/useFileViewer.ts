import { useState, useCallback, useEffect } from 'react';

interface FileViewerState {
  isOpen: boolean;
  currentFile: {
    url: string;
    name: string;
    mimeType?: string;
  } | null;
}

export const useFileViewer = () => {
  const [state, setState] = useState<FileViewerState>({
    isOpen: false,
    currentFile: null,
  });

  const openFile = useCallback((url: string, name: string, mimeType?: string) => {
    setState({
      isOpen: true,
      currentFile: { url, name, mimeType },
    });
  }, []);

  const closeViewer = useCallback(() => {
    setState({
      isOpen: false,
      currentFile: null,
    });
  }, []);

  // Handle escape key globally
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeViewer();
      }
    };

    if (state.isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when viewer is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [state.isOpen, closeViewer]);

  return {
    isOpen: state.isOpen,
    currentFile: state.currentFile,
    openFile,
    closeViewer,
  };
};

export default useFileViewer;