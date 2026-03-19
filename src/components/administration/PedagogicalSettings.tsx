import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap, Info } from 'lucide-react';

const semesterConfig = [
  { years: 1, label: '1 an', semesters: ['Semestre 1', 'Semestre 2'] },
  { years: 2, label: '2 ans', semesters: ['Semestre 1', 'Semestre 2', 'Semestre 3', 'Semestre 4'] },
  { years: 3, label: '3 ans', semesters: ['Semestre 1', 'Semestre 2', 'Semestre 3', 'Semestre 4', 'Semestre 5', 'Semestre 6'] },
];

const PedagogicalSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            Paramètres pédagogiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Organisation des semestres</p>
              <p>Les semestres sont automatiquement configurés en fonction de la durée de la formation. 
              Lors de la création d'une formation, sélectionnez la durée en années et les périodes d'évaluation seront générées automatiquement.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Configuration par durée de formation</h4>
            
            {semesterConfig.map((config) => (
              <div key={config.years} className="border-2 border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Formation de {config.label}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {config.semesters.length} semestres
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from({ length: config.years }, (_, yearIdx) => (
                    <div key={yearIdx} className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Année {yearIdx + 1}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          Semestre {yearIdx * 2 + 1}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Semestre {yearIdx * 2 + 2}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">Comment ça fonctionne ?</h4>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>Lors de la création d'une formation, choisissez la durée (1, 2 ou 3 ans)</li>
              <li>Les semestres sont automatiquement créés comme périodes d'évaluation</li>
              <li>Chaque module peut être assigné à un semestre spécifique</li>
              <li>Les feuilles de notes affichent les boutons de semestres groupés par année</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PedagogicalSettings;
