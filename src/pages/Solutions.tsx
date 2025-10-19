import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, FileText, Calendar, Users, MessageSquare, Shield, 
  ArrowRight, CheckCircle, BarChart, Clock, Video, Download
} from 'lucide-react';

const Solutions = () => {
  const solutions = [
    {
      icon: BookOpen,
      title: 'Gestion des Formations',
      description: 'Créez et organisez vos formations avec une structure modulaire flexible',
      features: [
        'Création de formations et modules',
        'Gestion des durées et contenus',
        'Suivi des progressions',
        'Bibliothèque de ressources'
      ]
    },
    {
      icon: FileText,
      title: 'Émargement Numérique',
      description: 'Gérez les présences de manière moderne et conforme',
      features: [
        'Signatures électroniques',
        'Codes QR pour émargement',
        'Génération automatique de feuilles',
        'Conformité Qualiopi'
      ]
    },
    {
      icon: Calendar,
      title: 'Planning et Emploi du Temps',
      description: 'Planifiez vos sessions de formation efficacement',
      features: [
        'Calendrier interactif',
        'Gestion des disponibilités',
        'Notifications automatiques',
        'Export PDF et Excel'
      ]
    },
    {
      icon: Users,
      title: 'Gestion des Utilisateurs',
      description: 'Administrez facilement tous vos utilisateurs',
      features: [
        'Profils formateurs et apprenants',
        'Gestion des droits d\'accès',
        'Suivi individuel',
        'Import/Export Excel'
      ]
    },
    {
      icon: MessageSquare,
      title: 'Messagerie Intégrée',
      description: 'Communiquez efficacement avec votre équipe',
      features: [
        'Messages en temps réel',
        'Notifications push',
        'Pièces jointes',
        'Historique des conversations'
      ]
    },
    {
      icon: Video,
      title: 'Classes Virtuelles',
      description: 'Formez à distance avec des outils modernes',
      features: [
        'Visioconférence intégrée',
        'Partage d\'écran',
        'Enregistrement des sessions',
        'Chat en direct'
      ]
    },
    {
      icon: Shield,
      title: 'Stockage Sécurisé',
      description: 'Conservez tous vos documents en toute sécurité',
      features: [
        'Stockage cloud sécurisé',
        'Organisation par dossiers',
        'Partage de fichiers',
        'Sauvegardes automatiques'
      ]
    },
    {
      icon: BarChart,
      title: 'Tableaux de Bord',
      description: 'Suivez vos indicateurs de performance',
      features: [
        'Statistiques en temps réel',
        'Rapports personnalisables',
        'Analyse des présences',
        'Suivi des progressions'
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
              <Link to="/solutions" className="text-primary font-semibold">
                Solutions
              </Link>
              <Link to="/fonctionnalites" className="text-gray-700 hover:text-primary transition-colors">
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
            La Solution Teetche
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Une seule plateforme, des bénéfices multiples. NECTFORMA vous accompagne dans toutes les étapes 
            de la gestion de vos formations, du planning à l'émargement en passant par le suivi pédagogique.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div 
                  key={index}
                  className="p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100 hover:border-primary hover:shadow-xl transition-all"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{solution.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{solution.description}</p>
                  <ul className="space-y-3">
                    {solution.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à découvrir toutes nos solutions ?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Testez gratuitement NECTFORMA pendant 14 jours
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
              <Link to="/fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</Link>
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

export default Solutions;