import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  MessageSquare, 
  Shield, 
  Zap, 
  Check, 
  ArrowRight,
  Star,
  PlayCircle,
  BarChart3,
  FileText,
  Globe,
  Smartphone,
  Target,
  Clock,
  Award,
  Lightbulb,
  Menu,
  X
} from 'lucide-react';

// Import illustrations
import illustrationFormations from '@/assets/illustration-formations.png';
import illustrationUsers from '@/assets/illustration-users.png';
import illustrationPlanning from '@/assets/illustration-planning.png';
import illustrationAnalytics from '@/assets/illustration-analytics.png';
import illustrationEmargement from '@/assets/illustration-emargement.png';
import illustrationElearning from '@/assets/illustration-elearning.png';

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const features = [
    {
      title: 'Toutes les fonctionnalités',
      subtitle: 'Une plateforme complète pour la gestion éducative',
      illustration: illustrationFormations,
      color: 'from-purple-400 to-purple-600'
    },
    {
      title: 'Gestion des formations',
      subtitle: 'Créez et organisez vos programmes éducatifs',
      illustration: illustrationFormations,
      color: 'from-emerald-400 to-teal-500'
    },
    {
      title: 'Gestion des utilisateurs',
      subtitle: 'Administrez facilement votre équipe',
      illustration: illustrationUsers,
      color: 'from-rose-400 to-pink-500'
    },
    {
      title: 'Planification intelligente',
      subtitle: 'Organisez vos séances efficacement',
      illustration: illustrationPlanning,
      color: 'from-blue-400 to-cyan-500'
    },
    {
      title: 'Analyses et rapports',
      subtitle: 'Suivez les performances en temps réel',
      illustration: illustrationAnalytics,
      color: 'from-indigo-400 to-purple-500'
    },
    {
      title: 'Émargement numérique',
      subtitle: 'Modernisez vos signatures électroniques',
      illustration: illustrationEmargement,
      color: 'from-teal-400 to-emerald-500'
    },
    {
      title: 'Classes virtuelles',
      subtitle: 'Animez vos formations à distance',
      illustration: illustrationElearning,
      color: 'from-orange-400 to-red-500'
    },
    {
      title: 'Messagerie intégrée',
      subtitle: 'Communiquez efficacement',
      illustration: illustrationUsers,
      color: 'from-violet-400 to-purple-500'
    },
    {
      title: 'Coffre-fort numérique',
      subtitle: 'Stockez en toute sécurité',
      illustration: illustrationFormations,
      color: 'from-green-400 to-teal-500'
    }
  ];

  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'Directrice de Formation',
      company: 'Institut Supérieur Paris',
      content: 'NectForma a révolutionné notre gestion pédagogique. Interface intuitive et gain de temps énorme !',
      rating: 5,
      avatar: 'MD'
    },
    {
      name: 'Jean-Pierre Martin',
      role: 'Responsable RH',
      company: 'TechCorp Solutions',
      content: 'Fonctionnalités complètes et support exceptionnel. Exactement ce dont nous avions besoin.',
      rating: 5,
      avatar: 'JM'
    },
    {
      name: 'Sophie Laurent',
      role: 'Formatrice',
      company: 'Centre de Formation Pro',
      content: 'Les outils e-learning sont fantastiques. Mes étudiants adorent les nouvelles fonctionnalités !',
      rating: 5,
      avatar: 'SL'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">NF</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  NECTFORMA
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Plateforme éducative moderne</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#solution" className="text-foreground/80 hover:text-emerald-600 transition-colors font-medium">
                Solution
              </a>
              <a href="#fonctionnalites" className="text-foreground/80 hover:text-emerald-600 transition-colors font-medium">
                Fonctionnalités
              </a>
              <a href="#tarifs" className="text-foreground/80 hover:text-emerald-600 transition-colors font-medium">
                Tarifs  
              </a>
              <a href="#temoignages" className="text-foreground/80 hover:text-emerald-600 transition-colors font-medium">
                Témoignages
              </a>
              <a href="#ressources" className="text-foreground/80 hover:text-emerald-600 transition-colors font-medium">
                Ressources
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden sm:flex items-center space-x-3">
              <Link 
                to="/auth" 
                className="px-6 py-2.5 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all duration-200 font-medium"
              >
                Se connecter
              </Link>
              <Link 
                to="/auth" 
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                Essai gratuit
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-white/20">
              <nav className="flex flex-col space-y-4">
                <a href="#solution" className="text-foreground/80 hover:text-emerald-600 transition-colors font-medium">
                  Solution
                </a>
                <a href="#fonctionnalites" className="text-foreground/80 hover:text-emerald-600 transition-colors font-medium">
                  Fonctionnalités
                </a>
                <a href="#tarifs" className="text-foreground/80 hover:text-emerald-600 transition-colors font-medium">
                  Tarifs
                </a>
                <div className="flex flex-col space-y-2 pt-4">
                  <Link 
                    to="/auth" 
                    className="px-6 py-2.5 text-center text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all duration-200 font-medium"
                  >
                    Se connecter
                  </Link>
                  <Link 
                    to="/auth" 
                    className="px-6 py-2.5 text-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Essai gratuit
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/30 via-teal-100/20 to-cyan-100/30"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/30 shadow-sm">
              <Lightbulb className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-foreground/80">Nouvelle génération de gestion éducative</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight">
              Révolutionnez votre
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent block mt-2">
                gestion de formation
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Rejoignez des milliers d'établissements qui font confiance à NectForma 
              pour digitaliser leur gestion pédagogique et administrative.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
              <Link 
                to="/auth" 
                className="group px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg flex items-center space-x-3 shadow-lg"
              >
                <span>Commencer gratuitement</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="group px-10 py-5 bg-white/80 backdrop-blur-sm text-foreground rounded-2xl hover:bg-white transition-all duration-300 font-semibold text-lg flex items-center space-x-3 border border-white/30 shadow-lg">
                <PlayCircle className="h-6 w-6 text-emerald-600" />
                <span>Voir la démo</span>
              </button>
            </div>

            <div className="text-center text-muted-foreground text-sm">
              <p>Rejoignez plus de <span className="font-semibold text-emerald-600">10 000</span> utilisateurs actifs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Teetche Style */}
      <section id="fonctionnalites" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-100/80 rounded-full px-6 py-3 mb-6">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Fonctionnalités</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Toutes les fonctionnalités
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une solution complète pour moderniser et optimiser votre gestion éducative
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 border border-white/30 hover:scale-105"
              >
                <div className="text-center">
                  <div className="mb-6 relative">
                    <img 
                      src={feature.illustration} 
                      alt={feature.title}
                      className="w-full h-32 object-contain rounded-2xl"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-emerald-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="temoignages" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-rose-100/80 rounded-full px-6 py-3 mb-6">
              <Star className="h-5 w-5 text-rose-600" />
              <span className="text-sm font-medium text-rose-800">Témoignages</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-muted-foreground">
              Découvrez l'expérience de nos utilisateurs satisfaits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 hover:shadow-xl transition-all duration-300 border border-white/30"
              >
                <div className="flex items-center space-x-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-foreground/80 mb-6 italic leading-relaxed text-lg">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-teal-700/90"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Prêt à transformer votre gestion éducative ?
          </h2>
          <p className="text-xl text-emerald-100 mb-12 leading-relaxed">
            Rejoignez des milliers d'établissements qui ont choisi NectForma pour moderniser leur approche pédagogique
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link 
              to="/auth" 
              className="px-10 py-5 bg-white text-emerald-600 rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold text-lg"
            >
              Commencer maintenant
            </Link>
            <button className="px-10 py-5 border-2 border-white/30 text-white rounded-2xl hover:bg-white/10 transition-all duration-300 font-bold text-lg">
              Planifier une démo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">NF</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">NECTFORMA</h3>
                  <p className="text-slate-400 text-sm">Plateforme éducative moderne</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md mb-6">
                Révolutionnez votre gestion éducative avec notre plateforme intuitive 
                et complète, conçue pour les établissements modernes.
              </p>
              <div className="flex space-x-4">
                <span className="text-slate-400 text-sm">Suivez-nous:</span>
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Produit</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Démo</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Mises à jour</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Support</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm mb-4 md:mb-0">
              © 2024 NectForma. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center space-x-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;