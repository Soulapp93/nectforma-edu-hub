import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GeneratedAttendanceSheetProps {
  sessionData: {
    formationTitle: string;
    moduleTitle: string;
    date: string;
    startTime: string;
    endTime: string;
    room?: string;
    instructor: string;
    formationColor: string;
  };
  onClose: () => void;
}

// Liste simulée d'étudiants (en production, cette liste viendrait de la base de données)
const mockStudents = [
  { id: '1', firstName: 'Alice', lastName: 'Martin', formation: 'Licence Informatique L3' },
  { id: '2', firstName: 'Bob', lastName: 'Dupont', formation: 'Licence Informatique L3' },
  { id: '3', firstName: 'Carol', lastName: 'Bernard', formation: 'Licence Informatique L3' },
  { id: '4', firstName: 'Dan', lastName: 'Moreau', formation: 'Licence Informatique L3' },
  { id: '5', firstName: 'Eva', lastName: 'Roux', formation: 'Licence Informatique L3' },
  { id: '6', firstName: 'Frank', lastName: 'Simon', formation: 'Licence Informatique L3' },
];

const GeneratedAttendanceSheet: React.FC<GeneratedAttendanceSheetProps> = ({
  sessionData,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Simulation du téléchargement PDF
    console.log('Téléchargement de la feuille d\'émargement...');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Actions bar - Non imprimable */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Feuille d'émargement générée</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>

      {/* Feuille d'émargement - Imprimable */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
        {/* En-tête */}
        <div 
          className="p-6 text-white text-center"
          style={{ backgroundColor: sessionData.formationColor }}
        >
          <h1 className="text-2xl font-bold mb-2">FEUILLE D'ÉMARGEMENT</h1>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{sessionData.formationTitle}</span>
            </div>
            <div>📅 {format(new Date(sessionData.date), 'PPP', { locale: fr })}</div>
            <div>🕒 {sessionData.startTime}</div>
            <div>🏫 {sessionData.room || 'Salle non spécifiée'}</div>
            <div>👨‍🏫 {sessionData.instructor}</div>
          </div>
        </div>

        {/* Informations de session */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">{sessionData.moduleTitle}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div><strong>Formation:</strong> {sessionData.formationTitle}</div>
                <div><strong>Date:</strong> {format(new Date(sessionData.date), 'PPP', { locale: fr })}</div>
                <div><strong>Horaire:</strong> {sessionData.startTime} - {sessionData.endTime}</div>
                {sessionData.room && <div><strong>Salle:</strong> {sessionData.room}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                <div><strong>Formateur:</strong> {sessionData.instructor}</div>
                <div><strong>Nombre d'inscrits:</strong> {mockStudents.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des participants */}
        <div className="p-6">
          <h4 className="font-semibold mb-4">Liste des participants ({mockStudents.length})</h4>
          
          {/* Légende */}
          <div className="mb-4 flex items-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">Statut:</span>
              <span>P = Présent</span>
              <span>R = Retard</span>
              <span>A = Absent</span>
            </div>
          </div>
          
          {/* En-tête du tableau */}
          <div 
            className="grid grid-cols-4 gap-4 p-3 text-white font-medium text-sm rounded-t-lg"
            style={{ backgroundColor: sessionData.formationColor }}
          >
            <div className="col-span-2">Nom et Prénom</div>
            <div className="text-center">Statut</div>
            <div className="text-center">Signature</div>
          </div>

          {/* Lignes des étudiants */}
          <div className="border border-gray-200 rounded-b-lg">
            {mockStudents.map((student, index) => (
              <div 
                key={student.id}
                className={`grid grid-cols-4 gap-4 p-3 border-b border-gray-200 last:border-b-0 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="col-span-2 flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: sessionData.formationColor }}
                  >
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <div className="font-medium">{student.lastName} {student.firstName}</div>
                    <div className="text-sm text-gray-500">{student.formation}</div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex gap-1">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="mr-1" />
                      P
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="mr-1" />
                      R
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="mr-1" />
                      A
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-24 h-12 border-2 border-gray-300 rounded bg-gray-50"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures des responsables */}
        <div className="p-6 border-t">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Signature du Formateur</h4>
              <div className="border border-gray-300 rounded-lg h-24 bg-gray-50 flex items-end justify-start p-2">
                <div className="text-xs text-gray-500">
                  {sessionData.instructor}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Signature de l'Administration</h4>
              <div className="border border-gray-300 rounded-lg h-24 bg-gray-50 flex items-end justify-start p-2">
                <div className="text-xs text-gray-500">
                  Administration
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-500">
          Document généré le {format(new Date(), 'PPP à HH:mm', { locale: fr })} - NECTFORIA
        </div>
      </div>
    </div>
  );
};

export default GeneratedAttendanceSheet;