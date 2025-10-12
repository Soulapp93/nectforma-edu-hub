import React from 'react';
import { 
  FileText, 
  Image, 
  Video, 
  Volume2, 
  File, 
  FileSpreadsheet, 
  Presentation,
  Archive,
  Code,
  Music,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  fileName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const FileIcon: React.FC<FileIconProps> = ({ fileName, className, size = 'md' }) => {
  const getFileExtension = (name: string) => {
    return name.split('.').pop()?.toLowerCase() || '';
  };

  const getIconAndColor = (extension: string) => {
    const configs = {
      // Documents
      'pdf': { Icon: FileText, color: 'text-red-600' },
      'doc': { Icon: FileText, color: 'text-blue-600' },
      'docx': { Icon: FileText, color: 'text-blue-600' },
      'txt': { Icon: FileText, color: 'text-gray-600' },
      'rtf': { Icon: FileText, color: 'text-gray-600' },
      'odt': { Icon: FileText, color: 'text-blue-500' },
      
      // Présentations
      'ppt': { Icon: Presentation, color: 'text-orange-600' },
      'pptx': { Icon: Presentation, color: 'text-orange-600' },
      'odp': { Icon: Presentation, color: 'text-orange-500' },
      
      // Feuilles de calcul
      'xls': { Icon: FileSpreadsheet, color: 'text-green-600' },
      'xlsx': { Icon: FileSpreadsheet, color: 'text-green-600' },
      'csv': { Icon: FileSpreadsheet, color: 'text-green-500' },
      'ods': { Icon: FileSpreadsheet, color: 'text-green-500' },
      
      // Images
      'jpg': { Icon: Image, color: 'text-purple-600' },
      'jpeg': { Icon: Image, color: 'text-purple-600' },
      'png': { Icon: Image, color: 'text-purple-600' },
      'gif': { Icon: Image, color: 'text-purple-600' },
      'bmp': { Icon: Image, color: 'text-purple-600' },
      'svg': { Icon: Image, color: 'text-purple-600' },
      'webp': { Icon: Image, color: 'text-purple-600' },
      'ico': { Icon: Image, color: 'text-purple-600' },
      'tiff': { Icon: Image, color: 'text-purple-600' },
      
      // Vidéos
      'mp4': { Icon: Video, color: 'text-red-600' },
      'avi': { Icon: Video, color: 'text-red-600' },
      'mov': { Icon: Video, color: 'text-red-600' },
      'wmv': { Icon: Video, color: 'text-red-600' },
      'flv': { Icon: Video, color: 'text-red-600' },
      'webm': { Icon: Video, color: 'text-red-600' },
      'mkv': { Icon: Video, color: 'text-red-600' },
      'ogg': { Icon: Play, color: 'text-red-600' },
      
      // Audio
      'mp3': { Icon: Music, color: 'text-pink-600' },
      'wav': { Icon: Volume2, color: 'text-pink-600' },
      'flac': { Icon: Music, color: 'text-pink-600' },
      'aac': { Icon: Music, color: 'text-pink-600' },
      'm4a': { Icon: Music, color: 'text-pink-600' },
      'wma': { Icon: Volume2, color: 'text-pink-600' },
      
      // Archives
      'zip': { Icon: Archive, color: 'text-yellow-600' },
      'rar': { Icon: Archive, color: 'text-yellow-600' },
      '7z': { Icon: Archive, color: 'text-yellow-600' },
      'tar': { Icon: Archive, color: 'text-yellow-600' },
      'gz': { Icon: Archive, color: 'text-yellow-600' },
      
      // Code
      'html': { Icon: Code, color: 'text-orange-600' },
      'css': { Icon: Code, color: 'text-blue-600' },
      'js': { Icon: Code, color: 'text-yellow-600' },
      'ts': { Icon: Code, color: 'text-blue-600' },
      'jsx': { Icon: Code, color: 'text-cyan-600' },
      'tsx': { Icon: Code, color: 'text-cyan-600' },
      'py': { Icon: Code, color: 'text-green-600' },
      'java': { Icon: Code, color: 'text-red-600' },
      'cpp': { Icon: Code, color: 'text-blue-600' },
      'c': { Icon: Code, color: 'text-gray-600' },
      'php': { Icon: Code, color: 'text-purple-600' },
      'rb': { Icon: Code, color: 'text-red-600' },
      'go': { Icon: Code, color: 'text-cyan-600' },
      'rs': { Icon: Code, color: 'text-orange-600' },
      'swift': { Icon: Code, color: 'text-orange-600' },
      'kt': { Icon: Code, color: 'text-purple-600' },
      'json': { Icon: Code, color: 'text-yellow-600' },
      'xml': { Icon: Code, color: 'text-green-600' },
      'yaml': { Icon: Code, color: 'text-red-600' },
      'yml': { Icon: Code, color: 'text-red-600' },
      'md': { Icon: FileText, color: 'text-gray-600' },
    };

    return configs[extension as keyof typeof configs] || { Icon: File, color: 'text-gray-500' };
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  const extension = getFileExtension(fileName);
  const { Icon, color } = getIconAndColor(extension);

  return (
    <Icon 
      className={cn(
        sizeClasses[size],
        color,
        className
      )} 
    />
  );
};

export default FileIcon;