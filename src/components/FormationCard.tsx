
import React from 'react';
import { Users, BookOpen, User } from 'lucide-react';

interface FormationCardProps {
  title: string;
  level: string;
  students: number;
  modules: number;
  instructor: string;
  status: 'Actif' | 'Inactif';
  color: string;
}

const FormationCard: React.FC<FormationCardProps> = ({
  title,
  level,
  students,
  modules,
  instructor,
  status,
  color
}) => {
  return (
    <div className={`rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`} 
         style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <BookOpen className="h-6 w-6" />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          status === 'Actif' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
        }`}>
          {status}
        </span>
      </div>
      
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-white/80 text-sm mb-4">{level}</p>
      
      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <Users className="h-4 w-4 mr-2" />
          {students} étudiant(s)
        </div>
        <div className="flex items-center text-sm">
          <BookOpen className="h-4 w-4 mr-2" />
          {modules} module(s)
        </div>
        <div className="flex items-center text-sm">
          <User className="h-4 w-4 mr-2" />
          Formateur(s): {instructor}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/20">
        <button className="text-sm text-white/90 hover:text-white underline">
          Cliquez pour accéder aux détails
        </button>
      </div>
    </div>
  );
};

export default FormationCard;
