import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, FileText, UserCheck, Mail, Download, BarChart, 
  Shield, Video, Calendar, Search, Bell, Smartphone,
  ArrowRight, Check
} from 'lucide-react';

const Fonctionnalites = () => {
  const features = [
    {
      category: 'Automatisation',
      icon: Clock,
      title: 'Automatisation des Tâches Administratives',
      description: 'Libérez-vous des tâches répétitives et concentrez-vous sur l\'essentiel.',
      details: [
        'Génération automatique des documents',
        'Envoi programmé d\'emails et notifications',
        'Mise à jour automatique des calendriers',
        'Synchronisation des données en temps réel'
      ]
    },
    {
      category: 'Documents',
      icon: FileText,
      title: 'Génération Automatique de Documents',
      description: 'Créez tous vos documents administratifs en quelques clics.',
      details: [
        'Feuilles d\'émargement',
        'Convocations personnalisées',
        'Attestations de présence',
        'Rapports de formation'
      ]
    },
    {
      category: 'Émargement',
      icon: UserCheck,
      title: 'Émargement et Signatures Électroniques',
      description: 'Gérez les présences de manière moderne et conforme.',
      details: [
        'Signatures électroniques valides juridiquement',
        'Émargement par QR code',
        'Validation en temps réel',
        'Archivage sécurisé'
      ]
    },
    {
      category: 'Planning',
      icon: Calendar,
      title: 'Planning des Séances de Formation',
      description: 'Organisez et planifiez vos formations facilement.',
      details: [
        'Vue calendrier interactive',
        'Gestion des conflits d\'horaires',
        'Affectation des formateurs',
        'Export multi-formats'
      ]
    },
    {
      category: 'Communication',
      icon: Mail,
      title: 'Envoi d\'E-mails et de Relances',
      description: 'Communiquez efficacement avec vos apprenants et formateurs.',
      details: [
        'Templates personnalisables',
        'Envois groupés',
        'Relances automatiques',
        'Suivi des ouvertures'
      ]
    },
    {
      category: 'Classes Virtuelles',
      icon: Video,
      title: 'Classes Virtuelles',
      description: 'Formez à distance avec des outils professionnels.',
      details: [
        'Visioconférence HD',
        'Partage d\'écran et documents',
        'Enregistrement des sessions',
        'Chat et interactions en direct'
      ]
    },
    {
      category: 'Alertes',
      icon: Bell,
      title: 'Alertes et Améliorations Continues',
      description: 'Restez informé et optimisez vos processus.',
      details: [
        'Notifications en temps réel',
        'Alertes personnalisables',
        'Suggestions d\'amélioration',
        'Mises à jour automatiques'
      ]
    },
    {
      category: 'Facturation',
      icon: FileText,
      title: 'Devis et Facturation',
      description: 'Gérez votre facturation en toute simplicité.',
      details: [
        'Création de devis professionnels',
        'Facturation automatisée',
        'Suivi des paiements',
        'Export comptable'
      ]
    },
    {
      category: 'Export',
      icon: Download,
      title: 'Export de votre BPF',
      description: 'Exportez vos données pour vos audits et contrôles.',
      details: [
        'Bilan Pédagogique et Financier',
        'Export conformes Qualiopi',
        'Formats personnalisables',
        'Génération automatique'
      ]
    },
    {
      category: 'CRM',
      icon: BarChart,
      title: 'CRM Intégré de Gestion Commerciale',
      description: 'Gérez vos prospects et clients efficacement.',
      details: [
        'Suivi des opportunités',
        'Pipeline de vente',
        'Historique des interactions',
        'Tableaux de bord commerciaux'
      ]
    },
    {
      category: 'Stockage',
      icon: Shield,
      title: 'Stockage et Archivage des Documents',
      description: 'Conservez tous vos documents en sécurité.',
      details: [
        'Stockage cloud sécurisé',
        'Organisation hiérarchique',
        'Recherche avancée',
        'Partage contrôlé'
      ]
    },
    {
      category: 'Statistiques',
      icon: BarChart,
      title: 'Statistiques',
      description: 'Analysez vos données pour prendre les bonnes décisions.',
      details: [
        'Tableaux de bord personnalisables',
        'Indicateurs de performance',
        'Rapports détaillés',
        'Export des données'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                NECTFORMA
              </h1>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/solutions" className="text-gray-700 hover:text-primary transition-colors">
                Solutions
              </Link>
              <Link to="/fonctionnalites" className="text-primary font-semibold">
                Fonctionnalités
              </Link>
              <Link to="/pourquoi-nous" className="text-gray-700 hover:text-primary transition-colors">
                Pourquoi nous ?
              </Link>
            </nav>

            <div className="flex space-x-4">
              <Link 
                to="/auth" 
                className="px-4 py-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Se connecter
              </Link>
              <Link 
                to="/auth" 
                className="px-6 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 font-medium transition-all"
              >
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-50 to-white"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Toutes les Fonctionnalités
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Découvrez l'ensemble des outils qui feront de NECTFORMA votre partenaire idéal 
            pour la gestion de vos formations.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center mr-4 shadow-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {feature.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Accessible partout, à tout moment
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              NECTFORMA est optimisé pour tous vos appareils : ordinateur, tablette et smartphone.
              Gérez vos formations où que vous soyez.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Testez toutes ces fonctionnalités gratuitement
          </h2>
          <p className="text-xl text-white/90 mb-10">
            14 jours d'essai gratuit • Sans engagement • Support inclus
          </p>
          <Link 
            to="/auth" 
            className="inline-flex items-center px-8 py-4 bg-white text-primary rounded-lg hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all"
          >
            Commencer gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">NECTFORMA</h3>
                <p className="text-gray-400 text-sm">© 2024 Tous droits réservés</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
              <Link to="/solutions" className="hover:text-white transition-colors">Solutions</Link>
              <Link to="/pourquoi-nous" className="hover:text-white transition-colors">Pourquoi nous ?</Link>
              <Link to="/cgu" className="hover:text-white transition-colors">CGU</Link>
              <Link to="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Fonctionnalites;