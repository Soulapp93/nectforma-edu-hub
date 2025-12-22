import React from 'react';
import { 
  BookOpen, 
  Calendar, 
  QrCode, 
  FileEdit, 
  BookText, 
  FolderLock, 
  Building2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: BookOpen,
    title: 'Gestion des formations',
    description: 'Créez, organisez et suivez toutes vos formations avec des modules personnalisés et un suivi détaillé des apprenants.',
    color: 'from-primary to-purple-500'
  },
  {
    icon: Calendar,
    title: 'Emploi du temps intelligent',
    description: 'Planification automatique des séances avec gestion des disponibilités formateurs et salles.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: QrCode,
    title: 'Émargement numérique',
    description: 'Signatures électroniques et QR codes pour un émargement simple, rapide et conforme Qualiopi.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: FileEdit,
    title: 'Devoirs & évaluations',
    description: 'Création et suivi des évaluations avec système de notation et feedback automatisé.',
    color: 'from-orange-500 to-amber-500'
  },
  {
    icon: BookText,
    title: 'Cahier de texte numérique',
    description: 'Suivi pédagogique complet avec historique des cours et ressources partagées.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: FolderLock,
    title: 'Coffre-fort documentaire',
    description: 'Stockage sécurisé de tous vos documents administratifs et pédagogiques.',
    color: 'from-indigo-500 to-violet-500'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="finbix-title text-foreground mb-4">
            Solutions NECTFY
          </h2>
          <p className="finbix-subtitle mx-auto">
            Toutes les fonctionnalités dont vous avez besoin pour gérer efficacement 
            votre organisme de formation.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="finbix-card group cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-5">
                  {feature.description}
                </p>
                
                {/* Action button */}
                <button className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors group-hover:translate-x-1 duration-300">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Multi-establishments highlight */}
        <div className="mt-16 md:mt-20">
          <div className="finbix-card bg-gradient-to-br from-card to-secondary/30 p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div className="text-center lg:text-left flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Multi-établissements
                </h3>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Gérez plusieurs centres de formation depuis une seule interface. 
                  Consolidation des données, reporting unifié et gestion centralisée.
                </p>
              </div>
              <Link 
                to="/solutions" 
                className="btn-finbix whitespace-nowrap"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
