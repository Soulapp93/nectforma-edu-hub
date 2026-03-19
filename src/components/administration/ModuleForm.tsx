
import React, { useState } from 'react';
import { X, Plus, User, ChevronDown, ChevronRight } from 'lucide-react';
import { useInstructors } from '@/hooks/useInstructors';
import { getSemesterOptions } from '@/utils/semesterUtils';

export interface SubModuleFormData {
  title: string;
  description: string;
  duration_hours: number;
  coefficient: number;
  instructorId?: string;
}

export interface ModuleFormData {
  title: string;
  description: string;
  instructorIds: string[];
  duration_hours: number;
  subModules: SubModuleFormData[];
  semester?: number;
}

interface ModuleFormProps {
  onAdd: (module: ModuleFormData) => void;
  onRemove: () => void;
  moduleIndex: number;
  initialData?: ModuleFormData;
  semestersCount?: number;
}

const ModuleForm: React.FC<ModuleFormProps> = ({ onAdd, onRemove, moduleIndex, initialData, semestersCount = 2 }) => {
  const { instructors } = useInstructors();
  const [formData, setFormData] = useState<ModuleFormData>(
    initialData || {
      title: '',
      description: '',
      instructorIds: [],
      duration_hours: 0,
      subModules: [],
      semester: undefined
    }
  );
  const [showSubModules, setShowSubModules] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      const currentJson = JSON.stringify(formData);
      const newJson = JSON.stringify(initialData);
      if (currentJson !== newJson) {
        setFormData(initialData);
      }
    }
  }, [JSON.stringify(initialData)]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newData = {
      ...formData,
      [name]: name === 'duration_hours' ? Number(value) : value
    };
    setFormData(newData);
    onAdd(newData);
  };

  const handleInstructorToggle = (instructorId: string) => {
    const newInstructorIds = formData.instructorIds.includes(instructorId)
      ? formData.instructorIds.filter(id => id !== instructorId)
      : [...formData.instructorIds, instructorId];
    
    const newData = { ...formData, instructorIds: newInstructorIds };
    setFormData(newData);
    onAdd(newData);
  };

  const addSubModule = () => {
    const newData = {
      ...formData,
      subModules: [...formData.subModules, { title: '', description: '', duration_hours: 0, coefficient: 1, instructorId: '' }]
    };
    setFormData(newData);
    onAdd(newData);
    setShowSubModules(true);
  };

  const updateSubModule = (index: number, field: string, value: string | number) => {
    const newSubModules = formData.subModules.map((sub, i) => 
      i === index ? { ...sub, [field]: value } : sub
    );
    const newData = { ...formData, subModules: newSubModules };
    setFormData(newData);
    onAdd(newData);
  };

  const removeSubModule = (index: number) => {
    const newSubModules = formData.subModules.filter((_, i) => i !== index);
    const newData = { ...formData, subModules: newSubModules };
    setFormData(newData);
    onAdd(newData);
  };

  return (
    <div className="border-2 border-primary/20 rounded-xl p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-foreground">Module {moduleIndex + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Titre du module *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Durée du module (nombre d'heures)
          </label>
          <input
            type="number"
            name="duration_hours"
            value={formData.duration_hours}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Semestre
          </label>
          <select
            value={formData.semester ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              const newData = { ...formData, semester: val };
              setFormData(newData);
              onAdd(newData);
            }}
            className="w-full px-3 py-2 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">-- Aucun semestre --</option>
            {getSemesterOptions(semestersCount).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Formateurs (optionnel)
          </label>
          <div className="max-h-32 overflow-y-auto border-2 border-primary/20 rounded-xl p-2 bg-background">
            {instructors.length === 0 ? (
              <p className="text-muted-foreground text-sm p-2">Aucun formateur disponible</p>
            ) : (
              instructors.map(instructor => (
                <label key={instructor.id} className="flex items-center p-2 hover:bg-muted/50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.instructorIds.includes(instructor.id)}
                    onChange={() => handleInstructorToggle(instructor.id)}
                    className="mr-2 rounded border-primary/30 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">
                    {instructor.first_name} {instructor.last_name}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Sub-modules section */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setShowSubModules(!showSubModules)}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {showSubModules ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Sous-modules ({formData.subModules.length})
            </button>
            <button
              type="button"
              onClick={addSubModule}
              className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Ajouter
            </button>
          </div>

          {showSubModules && formData.subModules.length > 0 && (
            <div className="space-y-3 pl-3 border-l-2 border-primary/20">
              {formData.subModules.map((sub, idx) => (
                <div key={idx} className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Sous-module {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeSubModule(idx)}
                      className="text-destructive hover:text-destructive/80 p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Titre du sous-module *</label>
                      <input
                        type="text"
                        placeholder="Titre du sous-module"
                        value={sub.title}
                        onChange={(e) => updateSubModule(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                      <textarea
                        placeholder="Description (optionnel)"
                        value={sub.description}
                        onChange={(e) => updateSubModule(idx, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Durée (heures)</label>
                        <input
                          type="number"
                          placeholder="Heures"
                          value={sub.duration_hours}
                          onChange={(e) => updateSubModule(idx, 'duration_hours', Number(e.target.value))}
                          min="0"
                          className="w-full px-3 py-2 text-sm border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Coefficient</label>
                        <input
                          type="number"
                          placeholder="Coefficient"
                          value={sub.coefficient}
                          onChange={(e) => updateSubModule(idx, 'coefficient', Number(e.target.value))}
                          min="0"
                          step="0.5"
                          className="w-full px-3 py-2 text-sm border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        <User className="h-4 w-4 inline mr-1" />
                        Formateur (optionnel)
                      </label>
                      <select
                        value={sub.instructorId || ''}
                        onChange={(e) => updateSubModule(idx, 'instructorId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="">-- Aucun formateur --</option>
                        {instructors.map(instructor => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.first_name} {instructor.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleForm;
