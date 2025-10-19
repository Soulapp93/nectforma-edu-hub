import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Users, Calendar, MessageSquare, Shield, Zap, Check, 
  ArrowRight, CheckCircle2, FileText, Clock, UserCheck, TrendingUp,
  Sparkles, Target, Award
} from 'lucide-react';

const Index = () => {
  const solutions = [
    {
      icon: BookOpen,
      title: 'Gestion des Formations',
      description: 'Créez et organisez vos formations avec des modules personnalisés et un suivi détaillé'
    },
    {
      icon: FileText,
      title: 'Émargement Numérique',
      description: 'Signatures électroniques et QR codes pour un émargement simple et conforme'
    },
    {
      icon: Calendar,
      title: 'Planning Intelligent',
      description: 'Planification automatique des séances avec gestion des disponibilités'
    },
    {
      icon: Users,
      title: 'Gestion des Apprenants',
      description: 'Suivi personnalisé de chaque apprenant avec tableaux de bord détaillés'
    }
  ];

  const features = [
    {
      icon: Clock,
      title: 'Automatisation des Tâches',
      description: 'Gagnez du temps en automatisant les tâches administratives répétitives'
    },
    {
      icon: FileText,
      title: 'Génération Automatique',
      description: 'Documents et rapports générés automatiquement selon vos besoins'
    },
    {
      icon: UserCheck,
      title: 'Signatures Électroniques',
      description: 'Émargement numérique conforme et sécurisé pour toutes vos formations'
    },
    {
      icon: MessageSquare,
      title: 'Messagerie Intégrée',
      description: 'Communiquez facilement avec vos formateurs et apprenants'
    },
    {
      icon: Shield,
      title: 'Stockage Sécurisé',
      description: 'Tous vos documents sont stockés de manière sécurisée et accessible'
    },
    {
      icon: TrendingUp,
      title: 'Suivi en Temps Réel',
      description: 'Tableaux de bord et statistiques pour piloter votre activité'
    }
  ];

  const targetAudience = [
    {
      icon: Target,
      title: 'Organismes de Formation',
      description: 'Gérez l\'ensemble de vos formations et apprenants depuis une seule plateforme',
      benefits: ['Conformité Qualiopi', 'Gain de temps', 'Traçabilité complète']
    },
    {
      icon: Users,
      title: 'Formateurs Indépendants',
      description: 'Professionnalisez votre activité avec des outils de gestion complets',
      benefits: ['Interface simple', 'Gestion autonome', 'Support dédié']
    },
    {
      icon: Award,
      title: 'Entreprises',
      description: 'Formez vos équipes efficacement avec un suivi détaillé des compétences',
      benefits: ['Formation interne', 'Suivi des compétences', 'Reporting avancé']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  NECTFORMA
                </h1>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/solutions" className="text-gray-700 hover:text-primary font-medium transition-colors">
                Solutions
              </Link>
              <Link to="/fonctionnalites" className="text-gray-700 hover:text-primary font-medium transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/pourquoi-nous" className="text-gray-700 hover:text-primary font-medium transition-colors">
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
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            <span className="text-primary font-medium text-sm">La plateforme tout-en-un pour la formation</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Simplifiez la gestion de
            <br />
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              vos formations
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            NECTFORMA est la solution complète pour digitaliser et automatiser 
            la gestion de vos formations. Gagnez du temps et concentrez-vous sur l'essentiel.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link 
              to="/auth" 
              className="group px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg transition-all flex items-center justify-center"
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-primary hover:text-primary hover:bg-primary/5 font-semibold text-lg transition-all">
              Voir la démo
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span>Essai gratuit 14 jours</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span>Sans carte bancaire</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span>Support français</span>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Une plateforme, des bénéfices multiples
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Toutes les fonctionnalités dont vous avez besoin pour gérer efficacement vos formations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div 
                  key={index} 
                  className="group p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-100"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{solution.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{solution.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/solutions" 
              className="inline-flex items-center text-primary hover:text-primary/80 font-semibold text-lg group"
            >
              Découvrir toutes nos solutions
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités complètes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tous les outils nécessaires pour digitaliser votre organisme de formation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="p-6 bg-white rounded-xl hover:shadow-lg transition-all border border-gray-100"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/fonctionnalites" 
              className="inline-flex items-center text-primary hover:text-primary/80 font-semibold text-lg group"
            >
              Voir toutes les fonctionnalités
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pour qui ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              NECTFORMA s'adapte à tous les professionnels de la formation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {targetAudience.map((target, index) => {
              const Icon = target.icon;
              return (
                <div 
                  key={index} 
                  className="p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl hover:shadow-xl transition-all border-2 border-gray-100 hover:border-primary"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{target.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{target.description}</p>
                  <ul className="space-y-3">
                    {target.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-gray-700">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/pourquoi-nous" 
              className="inline-flex items-center text-primary hover:text-primary/80 font-semibold text-lg group"
            >
              Pourquoi choisir NECTFORMA ?
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à transformer votre gestion de formation ?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Rejoignez des centaines d'organismes qui font déjà confiance à NECTFORMA
          </p>
          <Link 
            to="/auth" 
            className="inline-flex items-center px-8 py-4 bg-white text-primary rounded-lg hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all"
          >
            Commencer gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-white/80 mt-6 text-sm">
            Essai gratuit 14 jours • Sans engagement • Support inclus
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <h3 className="text-2xl font-bold">NECTFORMA</h3>
              </div>
              <p className="text-gray-400 max-w-md">
                La plateforme de gestion complète pour digitaliser votre organisme de formation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/solutions" className="hover:text-white transition-colors">Solutions</Link></li>
                <li><Link to="/fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link to="/pourquoi-nous" className="hover:text-white transition-colors">Pourquoi nous ?</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link to="/politique-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-center">
              © 2024 NECTFORMA. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;