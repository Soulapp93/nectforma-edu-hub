import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { scheduleService } from '@/services/scheduleService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleId: string;
}

const ExcelImportModal = ({ isOpen, onClose, onSuccess, scheduleId }: ExcelImportModalProps) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const downloadTemplate = () => {
    const template = [
      {
        'Date': '2024-09-05',
        'FORMATION 09h30-12h30': 'GS1.1 Théorie de la modernisation RH - Nathalie Jeltout (Accord Service)',
        'SALLE 09h30-12h30': 'Salle A',
        'COULEUR 09h30-12h30': '#4CAF50',
        'FORMATION 13h30-17h30': 'Communication RH - Jean IVANE',
        'SALLE 13h30-17h30': 'Salle B',
        'COULEUR 13h30-17h30': '#2196F3'
      },
      {
        'Date': '2024-09-06',
        'FORMATION 09h30-12h30': 'Gestion budgétaire des RH - Philippe Verneuil',
        'SALLE 09h30-12h30': 'Salle C',
        'COULEUR 09h30-12h30': '#FF9800',
        'FORMATION 13h30-17h30': 'Gestion budgétaire des RH - Philippe Verneuil',
        'SALLE 13h30-17h30': 'Salle C',
        'COULEUR 13h30-17h30': '#FF9800'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, 'Modèle');
    XLSX.writeFile(wb, 'modele_emploi_temps.xlsx');
    toast.success('Modèle téléchargé avec succès');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processExcelFile = async () => {
    if (!file) return;

    try {
      setLoading(true);
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData as any[]) {
        const date = row['Date'];
        if (!date) continue;

        // Créneaux du matin (09h30-12h30)
        const morningFormation = row['FORMATION 09h30-12h30'];
        if (morningFormation && morningFormation.trim()) {
          try {
            const morningSlot = {
              schedule_id: scheduleId,
              date: date,
              start_time: '09:30',
              end_time: '12:30',
              room: row['SALLE 09h30-12h30'] || '',
              color: row['COULEUR 09h30-12h30'] || '#4CAF50',
              notes: morningFormation
            };

            await scheduleService.createScheduleSlot(morningSlot);
            successCount++;
          } catch (error) {
            console.error('Erreur lors de l\'import du créneau matin:', row, error);
            errorCount++;
          }
        }

        // Créneaux de l'après-midi (13h30-17h30)
        const afternoonFormation = row['FORMATION 13h30-17h30'];
        if (afternoonFormation && afternoonFormation.trim()) {
          try {
            const afternoonSlot = {
              schedule_id: scheduleId,
              date: date,
              start_time: '13:30',
              end_time: '17:30',
              room: row['SALLE 13h30-17h30'] || '',
              color: row['COULEUR 13h30-17h30'] || '#2196F3',
              notes: afternoonFormation
            };

            await scheduleService.createScheduleSlot(afternoonSlot);
            successCount++;
          } catch (error) {
            console.error('Erreur lors de l\'import du créneau après-midi:', row, error);
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} créneaux importés avec succès`);
        onSuccess();
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} créneaux n'ont pas pu être importés`);
      }

    } catch (error) {
      toast.error('Erreur lors de l\'import du fichier Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Excel - Emploi du temps</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Instructions
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Téléchargez d'abord le modèle Excel</li>
              <li>• Format: Date | FORMATION 09h30-12h30 | SALLE 09h30-12h30 | COULEUR 09h30-12h30 | FORMATION 13h30-17h30 | SALLE 13h30-17h30 | COULEUR 13h30-17h30</li>
              <li>• Chaque ligne = 1 jour avec créneaux matin et après-midi</li>
              <li>• Importez le fichier complété</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le modèle Excel
            </Button>

            <div className="space-y-2">
              <Label htmlFor="excel-file">Fichier Excel</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  Fichier sélectionné: {file.name}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={processExcelFile} 
              disabled={!file || loading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Import...' : 'Importer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportModal;