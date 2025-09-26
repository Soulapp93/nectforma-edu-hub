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
  Lightbulb
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Gestion des Formations',
      description: 'Créez et gérez facilement vos programmes de formation avec nos outils intuitifs',
      gradient: 'from-emerald-100 to-teal-100',
      iconColor: 'text-emerald-600'
    },
    {
      icon: Users,
      title: 'Gestion des Utilisateurs',
      description: 'Administrez votre équipe et vos apprenants en toute simplicité',
      gradient: 'from-purple-100 to-violet-100',
      iconColor: 'text-purple-600'
    },
    {
      icon: Calendar,
      title: 'Planification Intelligente',
      description: 'Organisez vos séances avec notre système de planification avancé',
      gradient: 'from-blue-100 to-cyan-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: BarChart3,
      title: 'Analyses et Rapports',
      description: 'Suivez les performances et générez des rapports détaillés',
      gradient: 'from-orange-100 to-amber-100',
      iconColor: 'text-orange-600'
    },
    {
      icon: MessageSquare,
      title: 'Communication Intégrée',
      description: 'Facilitez les échanges avec votre messagerie intégrée',
      gradient: 'from-rose-100 to-pink-100',
      iconColor: 'text-rose-600'
    },
    {
      icon: Shield,
      title: 'Stockage Sécurisé',
      description: 'Protégez vos documents avec notre coffre-fort numérique',
      gradient: 'from-green-100 to-emerald-100',
      iconColor: 'text-green-600'
    },
    {
      icon: Smartphone,
      title: 'Émargement Digital',
      description: 'Modernisez vos signatures avec notre système QR code',
      gradient: 'from-indigo-100 to-blue-100',
      iconColor: 'text-indigo-600'
    },
    {
      icon: PlayCircle,
      title: 'Classes Virtuelles',
      description: 'Animez vos formations à distance avec nos outils e-learning',
      gradient: 'from-teal-100 to-cyan-100',
      iconColor: 'text-teal-600'
    },
    {
      icon: Award,
      title: 'Certifications',
      description: 'Délivrez des attestations et suivez les progressions',
      gradient: 'from-yellow-100 to-orange-100',
      iconColor: 'text-yellow-600'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Utilisateurs actifs' },
    { number: '500+', label: 'Établissements' },
    { number: '98%', label: 'Satisfaction client' },
    { number: '24/7', label: 'Support disponible' }
  ];

  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'Directrice de Formation',
      company: 'Institut Supérieur',
      content: 'NectForma a révolutionné notre gestion pédagogique. Un gain de temps énorme !',
      rating: 5
    },
    {
      name: 'Jean-Pierre Martin',
      role: 'Responsable RH',
      company: 'TechCorp',
      content: 'Interface intuitive et fonctionnalités complètes. Exactement ce dont nous avions besoin.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">NF</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  NECTFORMA
                </h1>
                <p className="text-xs text-muted-foreground">Plateforme éducative moderne</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-foreground/80 hover:text-foreground transition-colors">
                Tarifs
              </a>
              <a href="#testimonials" className="text-foreground/80 hover:text-foreground transition-colors">
                Témoignages
              </a>
            </nav>

            <div className="flex items-center space-x-3">
              <Link 
                to="/auth" 
                className="px-4 py-2 text-foreground/80 hover:text-foreground font-medium transition-colors"
              >
                Connexion
              </Link>
              <Link 
                to="/auth" 
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 via-blue-100/30 to-purple-100/50"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20">
              <Lightbulb className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-foreground/80">Nouvelle génération de gestion éducative</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transformez votre
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent block">
                gestion éducative
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              NectForma révolutionne la gestion des formations avec une plateforme intuitive, 
              moderne et complète. Simplifiez vos processus, engagez vos apprenants.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link 
                to="/auth" 
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg flex items-center space-x-2"
              >
                <span>Commencer gratuitement</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-foreground rounded-2xl hover:bg-white transition-all duration-300 font-semibold text-lg flex items-center space-x-2 border border-white/20">
                <PlayCircle className="h-5 w-5 text-emerald-600" />
                <span>Voir la démo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-emerald-100/80 rounded-full px-4 py-2 mb-4">
              <Target className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Fonctionnalités</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une solution complète pour moderniser et optimiser votre gestion éducative
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="group p-8 bg-white/80 backdrop-blur-sm rounded-3xl hover:shadow-xl transition-all duration-300 border border-white/20 hover:scale-105"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-8 w-8 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-emerald-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-white/50 to-emerald-50/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-100/80 rounded-full px-4 py-2 mb-4">
              <Star className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Témoignages</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-muted-foreground">
              Découvrez l'expérience de nos utilisateurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-foreground/80 mb-6 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
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
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à transformer votre gestion éducative ?
          </h2>
          <p className="text-xl text-emerald-100 mb-10">
            Rejoignez des milliers d'établissements qui ont choisi NectForma
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link 
              to="/auth" 
              className="px-8 py-4 bg-white text-emerald-600 rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
            >
              Commencer maintenant
            </Link>
            <button className="px-8 py-4 border-2 border-white/30 text-white rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold text-lg">
              Planifier une démo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">NF</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">NECTFORMA</h3>
                  <p className="text-slate-400 text-sm">Plateforme éducative moderne</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md">
                Révolutionnez votre gestion éducative avec notre plateforme intuitive 
                et complète, conçue pour les établissements modernes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Démo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2024 NectForma. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Politique de confidentialité
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;