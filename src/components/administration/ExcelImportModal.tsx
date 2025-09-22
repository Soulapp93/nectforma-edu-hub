import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getModuleColor, extractModuleName } from '@/utils/moduleColors';
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
        'Date': '2025-09-22',
        'Horaire (Début - Fin)': '08:00-12:00',
        'Module': 'Marketing Digital',
        'Formateur': 'Dupont Jean',
        'Classe': 'BTS1'
      },
      {
        'Date': '2025-09-22',
        'Horaire (Début - Fin)': '13:00-17:00',
        'Module': 'Gestion de Paie',
        'Formateur': 'Martin Claire',
        'Classe': 'BTS1'
      },
      {
        'Date': '2025-09-23',
        'Horaire (Début - Fin)': '08:00-12:00',
        'Module': 'Gestion de Paie',
        'Formateur': 'Martin Claire',
        'Classe': 'BTS2'
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
        const horaire = row['Horaire (Début - Fin)'];
        const module = row['Module'];
        const formateur = row['Formateur'];
        const classe = row['Classe'];
        
        if (!date || !horaire || !module) continue;

        try {
          // Parser l'horaire (format: "08:00-12:00")
          const [startTime, endTime] = horaire.split('-');
          if (!startTime || !endTime) {
            console.error('Format horaire invalide:', horaire);
            errorCount++;
            continue;
          }

          const slot = {
            schedule_id: scheduleId,
            date: date,
            start_time: startTime.trim(),
            end_time: endTime.trim(),
            room: classe || '',
            color: getModuleColor(module),
            notes: `${module}${formateur ? ` - ${formateur}` : ''}${classe ? ` (${classe})` : ''}`
          };

          await scheduleService.createScheduleSlot(slot);
          successCount++;
        } catch (error) {
          console.error('Erreur lors de l\'import du créneau:', row, error);
          errorCount++;
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
              <li>• Format: Date | Horaire (Début - Fin) | Module | Formateur | Classe</li>
              <li>• Horaire format: "08:00-12:00" ou "13:00-17:00"</li>
              <li>• Chaque ligne = 1 créneau</li>
              <li>• Les couleurs sont automatiquement attribuées par module</li>
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