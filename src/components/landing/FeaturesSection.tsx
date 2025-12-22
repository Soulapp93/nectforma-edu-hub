import React from 'react';
import { 
  BookOpen, 
  Calendar, 
  QrCode, 
  FileText, 
  FolderLock, 
  Building2,
  ClipboardCheck,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: BookOpen,
    title: 'Gestion des formations',
    description: 'Créez et gérez vos formations, modules et contenus pédagogiques en toute simplicité.'
  },
  {
    icon: Calendar,
    title: 'Emploi du temps intelligent',
    description: 'Planifiez automatiquement les créneaux et évitez les conflits horaires.'
  },
  {
    icon: QrCode,
    title: 'Émargement numérique',
    description: 'Signature électronique par QR code pour un suivi de présence en temps réel.'
  },
  {
    icon: ClipboardCheck,
    title: 'Devoirs & évaluations',
    description: 'Assignez des travaux, collectez les rendus et corrigez en ligne.'
  },
  {
    icon: FileText,
    title: 'Cahier de texte numérique',
    description: 'Suivez le contenu des cours et les devoirs donnés par session.'
  },
  {
    icon: FolderLock,
    title: 'Coffre-fort documentaire',
    description: 'Stockez et partagez vos documents en toute sécurité.'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            NECTFY Solutions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour gérer efficacement votre centre de formation
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group bg-background rounded-xl p-6 border border-border hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-lavender rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {feature.description}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto text-primary hover:text-primary/80 hover:bg-transparent group-hover:translate-x-1 transition-transform"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
