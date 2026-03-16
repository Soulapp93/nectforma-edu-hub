import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Users, Search, Check } from 'lucide-react';
import { formationService } from '@/services/formationService';
import { toast } from 'sonner';

interface MigrateStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  formations: Array<{ id: string; title: string; academic_year?: string; color?: string }>;
}

const MigrateStudentsModal: React.FC<MigrateStudentsModalProps> = ({
  isOpen, onClose, onSuccess, formations
}) => {
  const [fromFormationId, setFromFormationId] = useState('');
  const [toFormationId, setToFormationId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (fromFormationId) {
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [fromFormationId]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const data = await formationService.getFormationStudents(fromFormationId);
      setStudents(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.user_id));
    }
  };

  const handleMigrate = async () => {
    if (!fromFormationId || !toFormationId || selectedStudents.length === 0) return;
    if (fromFormationId === toFormationId) {
      toast.error('Les formations source et destination doivent être différentes');
      return;
    }

    try {
      setLoading(true);
      await formationService.migrateStudents(selectedStudents, fromFormationId, toFormationId);
      toast.success(`${selectedStudents.length} étudiant(s) migré(s) avec succès`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la migration');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const fromFormation = formations.find(f => f.id === fromFormationId);
  const toFormation = formations.find(f => f.id === toFormationId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border-2 border-primary/20">
        <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Migrer des étudiants
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Formation source/destination */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">Formation source</label>
              <select
                value={fromFormationId}
                onChange={(e) => setFromFormationId(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-primary/30 rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Sélectionner...</option>
                {formations.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.title} {f.academic_year ? `(${f.academic_year})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <ArrowRight className="h-5 w-5 text-primary mt-6 flex-shrink-0" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">Formation destination</label>
              <select
                value={toFormationId}
                onChange={(e) => setToFormationId(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-primary/30 rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Sélectionner...</option>
                {formations.filter(f => f.id !== fromFormationId).map(f => (
                  <option key={f.id} value={f.id}>
                    {f.title} {f.academic_year ? `(${f.academic_year})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Students list */}
          {fromFormationId && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  Étudiants ({selectedStudents.length}/{filteredStudents.length} sélectionné{selectedStudents.length > 1 ? 's' : ''})
                </span>
                {filteredStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    {selectedStudents.length === filteredStudents.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                )}
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un étudiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-xl bg-background text-sm focus:ring-1 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="max-h-60 overflow-y-auto border border-border rounded-xl">
                {loadingStudents ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">Chargement...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">Aucun étudiant trouvé</div>
                ) : (
                  filteredStudents.map(student => (
                    <label
                      key={student.user_id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 border-b border-border/50 last:border-b-0 cursor-pointer"
                    >
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        selectedStudents.includes(student.user_id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border'
                      }`}>
                        {selectedStudents.includes(student.user_id) && <Check className="h-3 w-3" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.user_id)}
                        onChange={() => toggleStudent(student.user_id)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{student.email}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 text-foreground border border-border rounded-xl hover:bg-muted transition-colors text-sm">
              Annuler
            </button>
            <button
              onClick={handleMigrate}
              disabled={loading || !fromFormationId || !toFormationId || selectedStudents.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-all flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              {loading ? 'Migration...' : `Migrer ${selectedStudents.length} étudiant(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrateStudentsModal;
