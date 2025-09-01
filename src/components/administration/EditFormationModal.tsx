
import React, { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, Save } from 'lucide-react';
import ColorPalette from './ColorPalette';
import { formationService, Formation } from '@/services/formationService';

interface EditFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  formationId: string | null;
}

interface EditFormationData {
  title: string;
  description: string;
  level: string;
  start_date: string;
  end_date: string;
  status: string;
  color: string;
  max_students: number;
  duration: number;
  price: number;
}

const EditFormationModal: React.FC<EditFormationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  formationId
}) => {
  const [formData, setFormData] = useState<EditFormationData>({
    title: '',
    description: '',
    level: 'BAC+1',
    start_date: '',
    end_date: '',
    status: 'Actif',
    color: '#8B5CF6',
    max_students: 25,
    duration: 0,
    price: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (isOpen && formationId) {
      loadFormation();
    }
  }, [isOpen, formationId]);

  const loadFormation = async () => {
    if (!formationId) return;
    
    try {
      setInitialLoading(true);
      setError(null);
      const formation = await formationService.getFormationById(formationId);
      
      setFormData({
        title: formation.title,
        description: formation.description || '',
        level: formation.level,
        start_date: formation.start_date,
        end_date: formation.end_date,
        status: formation.status,
        color: formation.color || '#8B5CF6',
        max_students: formation.max_students,
        duration: formation.duration,
        price: formation.price || 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la formation:', error);
      setError('Erreur lors du chargement de la formation');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_students' || name === 'duration' || name === 'price' ? Number(value) : value
    }));
    if (error) setError(null);
  };

  const handleColorChange = (color: string) => {
    setFormData(prev => ({
      ...prev,
      color: color
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formationId) return;
    
    setError(null);

    try {
      setLoading(true);

      if (!formData.title.trim()) {
        setError('Le titre de la formation est requis');
        return;
      }

      await formationService.updateFormation(formationId, formData);
      
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de la modification de la formation:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la modification de la formation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            <BookOpen className="h-5 w-5 inline mr-2" />
            Modifier la formation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {initialLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre de la formation *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="BAC+1">BAC+1</option>
                    <option value="BAC+2">BAC+2</option>
                    <option value="BAC+3">BAC+3</option>
                    <option value="BAC+4">BAC+4</option>
                    <option value="BAC+5">BAC+5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                    <option value="Brouillon">Brouillon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date de début
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date de fin
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre max d'étudiants
                  </label>
                  <input
                    type="number"
                    name="max_students"
                    value={formData.max_students}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée (heures)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <ColorPalette 
                    selectedColor={formData.color}
                    onColorChange={handleColorChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Modification...' : 'Modifier la formation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditFormationModal;
