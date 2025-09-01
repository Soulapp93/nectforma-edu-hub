
import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Phone, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FormationParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  formationTitle: string;
  formationColor?: string;
}

interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  enrolled_at: string;
}

const FormationParticipantsModal: React.FC<FormationParticipantsModalProps> = ({
  isOpen,
  onClose,
  formationId,
  formationTitle,
  formationColor = '#8B5CF6'
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && formationId) {
      fetchParticipants();
    }
  }, [isOpen, formationId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('student_formations')
        .select(`
          id,
          enrolled_at,
          student:users(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('formation_id', formationId);

      if (error) throw error;

      const formattedParticipants = data?.map(item => ({
        id: item.student.id,
        first_name: item.student.first_name,
        last_name: item.student.last_name,
        email: item.student.email,
        phone: item.student.phone,
        enrolled_at: item.enrolled_at
      })) || [];

      setParticipants(formattedParticipants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des participants');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div 
          className="px-6 py-4 text-white relative"
          style={{ backgroundColor: formationColor }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Participants</h2>
              <p className="text-white/90 text-sm">{formationTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Chargement des participants...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={fetchParticipants}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun participant</h3>
              <p className="text-gray-600">Cette formation n'a pas encore d'étudiants inscrits.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900">
                    {participants.length} participant{participants.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: formationColor }}
                        >
                          {participant.first_name.charAt(0)}{participant.last_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {participant.first_name} {participant.last_name}
                          </h4>
                          <div className="flex items-center text-sm text-gray-600 space-x-4 mt-1">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {participant.email}
                            </div>
                            {participant.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {participant.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Inscrit le {new Date(participant.enrolled_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormationParticipantsModal;
