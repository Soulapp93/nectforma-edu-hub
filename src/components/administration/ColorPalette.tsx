
import React from 'react';
import { Check } from 'lucide-react';

interface ColorPaletteProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ selectedColor, onColorChange }) => {
  const colors = [
    '#8B5CF6', // Purple (default)
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5A2B', // Brown
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#64748B'  // Slate
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Couleur de la carte
      </label>
      <div className="grid grid-cols-6 gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorChange(color)}
            className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center ${
              selectedColor === color 
                ? 'border-gray-400 ring-2 ring-purple-500' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            title={`Sélectionner la couleur ${color}`}
          >
            {selectedColor === color && (
              <Check className="h-5 w-5 text-white drop-shadow-sm" />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Choisissez la couleur qui apparaîtra sur la carte de formation
      </p>
    </div>
  );
};

export default ColorPalette;
