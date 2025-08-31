
import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/services/userService';
import * as XLSX from 'xlsx';

interface ExcelImportProps {
  onImport: (users: Omit<User, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  onClose: () => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ onImport, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      try {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Mapper les données Excel vers notre format
        const mappedData = jsonData.map((row: any) => ({
          first_name: row['Prénom'] || row['First Name'] || row['first_name'] || '',
          last_name: row['Nom'] || row['Last Name'] || row['last_name'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Téléphone'] || row['Phone'] || row['phone'] || '',
          role: row['Rôle'] || row['Role'] || row['role'] || 'Étudiant',
          status: row['Statut'] || row['Status'] || row['status'] || 'En attente'
        }));

        // Valider les données
        const validData = mappedData.filter(user => 
          user.first_name && user.last_name && user.email
        );

        if (validData.length === 0) {
          setError('Aucune donnée valide trouvée dans le fichier. Vérifiez que les colonnes sont correctement nommées.');
        } else {
          setPreviewData(validData);
        }
      } catch (err) {
        setError('Erreur lors de la lecture du fichier Excel. Veuillez vérifier le format du fichier.');
      }
    }
  };

  const handleImport = async () => {
    if (!previewData.length) return;

    try {
      setImporting(true);
      await onImport(previewData as Omit<User, 'id' | 'created_at' | 'updated_at'>[]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Créer un template Excel
    const template = [
      {
        'Prénom': 'Jean',
        'Nom': 'Dupont',
        'Email': 'jean.dupont@exemple.com',
        'Téléphone': '01 23 45 67 89',
        'Rôle': 'Étudiant',
        'Statut': 'En attente'
      },
      {
        'Prénom': 'Marie',
        'Nom': 'Martin',
        'Email': 'marie.martin@exemple.com',
        'Téléphone': '01 98 76 54 32',
        'Rôle': 'Formateur',
        'Statut': 'Actif'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    
    // Télécharger le fichier
    XLSX.writeFile(wb, 'modele_utilisateurs.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Excel des utilisateurs</h2>
          <p className="text-gray-600 mt-1">Importez plusieurs utilisateurs à partir d'un fichier Excel</p>
        </div>

        <div className="p-6">
          {!file ? (
            <div className="text-center py-8">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionnez un fichier Excel
                </h3>
                <p className="text-gray-600 mb-4">
                  Formats acceptés : .xlsx, .xls
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le modèle
                  </Button>
                  <label className="cursor-pointer">
                    <Button className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Sélectionner un fichier
                    </Button>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Instructions d'utilisation */}
              <div className="mt-6 text-left bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Instructions :</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Les colonnes requises sont : Prénom, Nom, Email</li>
                  <li>• Les colonnes optionnelles : Téléphone, Rôle, Statut</li>
                  <li>• Rôles acceptés : Admin, Formateur, Étudiant</li>
                  <li>• Statuts acceptés : Actif, Inactif, En attente</li>
                  <li>• Téléchargez le modèle Excel pour voir un exemple</li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">{file.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setPreviewData([]);
                      setError(null);
                    }}
                    className="ml-auto"
                  >
                    Changer de fichier
                  </Button>
                </div>
              </div>

              {previewData.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Aperçu des données ({previewData.length} utilisateurs)
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Prénom
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Nom
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Téléphone
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Rôle
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.slice(0, 10).map((user, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.first_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.last_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.phone || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.role}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        ... et {previewData.length - 10} utilisateurs de plus
                      </p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={importing}
          >
            Annuler
          </Button>
          {file && previewData.length > 0 && (
            <Button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Importer {previewData.length} utilisateurs
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelImport;
