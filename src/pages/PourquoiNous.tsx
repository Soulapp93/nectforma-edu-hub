import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, Users, Award, Zap, Heart, TrendingUp, 
  Shield, Clock, CheckCircle, ArrowRight, Star
} from 'lucide-react';

const PourquoiNous = () => {
  const audiences = [
    {
      icon: Target,
      title: 'Formateurs Indépendants',
      description: 'Vous êtes formateur indépendant et cherchez à professionnaliser votre activité ?',
      benefits: [
        'Interface simple et intuitive',
        'Gestion autonome complète',
        'Gain de temps considérable',
        'Support dédié en français',
        'Tarifs adaptés aux indépendants'
      ],
      testimonial: {
        text: 'NECTFY m\'a permis de me concentrer sur l\'essentiel : former. Plus de temps perdu en administratif !',
        author: 'Sophie M., Formatrice indépendante'
      }
    },
    {
      icon: Users,
      title: 'Organismes de Formation',
      description: 'Vous gérez un organisme de formation et souhaitez optimiser vos processus ?',
      benefits: [
        'Conformité Qualiopi garantie',
        'Gestion multi-utilisateurs',
        'Traçabilité complète',
        'Automatisation des tâches',
        'Tableaux de bord détaillés'
      ],
      testimonial: {
        text: 'Depuis NECTFY, nous avons divisé par 3 le temps passé sur l\'administratif. Un vrai game-changer !',
        author: 'Marc D., Directeur de centre de formation'
      }
    },
    {
      icon: Award,
      title: 'Entreprises qui Forment',
      description: 'Vous développez les compétences de vos équipes en interne ?',
      benefits: [
        'Formation interne simplifiée',
        'Suivi des compétences',
        'Reporting avancé',
        'Intégration facile',
        'ROI mesurable'
      ],
      testimonial: {
        text: 'La formation interne n\'a jamais été aussi simple. Nous suivons précisément la montée en compétences de nos équipes.',
        author: 'Julie R., DRH'
      }
    }
  ];

  const whyChooseUs = [
    {
      icon: Zap,
      title: 'Simplicité d\'utilisation',
      description: 'Interface intuitive, prise en main immédiate, aucune formation nécessaire'
    },
    {
      icon: Clock,
      title: 'Gain de temps massif',
      description: 'Automatisation de 80% des tâches administratives répétitives'
    },
    {
      icon: Shield,
      title: 'Conformité garantie',
      description: 'Respecte toutes les normes Qualiopi et réglementations en vigueur'
    },
    {
      icon: Heart,
      title: 'Support réactif',
      description: 'Équipe française disponible pour vous accompagner au quotidien'
    },
    {
      icon: TrendingUp,
      title: 'Évolution continue',
      description: 'Nouvelles fonctionnalités régulières basées sur vos retours'
    },
    {
      icon: Star,
      title: 'Satisfaction client',
      description: '98% de nos clients nous recommandent à leurs confrères'
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
                NECTFY
              </h1>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/solutions" className="text-gray-700 hover:text-primary transition-colors">
                Solutions
              </Link>
              <Link to="/fonctionnalites" className="text-gray-700 hover:text-primary transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/pourquoi-nous" className="text-primary font-semibold">
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
            Pour Qui ?
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            NECTFY s'adapte à tous les professionnels de la formation, 
            quelle que soit la taille de votre structure.
          </p>
        </div>
      </section>

      {/* Target Audiences */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {audiences.map((audience, index) => {
              const Icon = audience.icon;
              const isEven = index % 2 === 0;
              return (
                <div 
                  key={index}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">{audience.title}</h2>
                    </div>
                    <p className="text-xl text-gray-600 mb-8">{audience.description}</p>
                    <ul className="space-y-4 mb-8">
                      {audience.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start">
                          <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-lg text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1">
                    <div className="p-8 bg-gradient-to-br from-primary/5 to-purple-50 rounded-2xl border border-primary/20">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-lg text-gray-700 italic mb-4">
                        "{audience.testimonial.text}"
                      </p>
                      <p className="text-gray-900 font-semibold">{audience.testimonial.author}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir NECTFY ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Plus qu'un simple logiciel, un véritable partenaire pour votre réussite
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseUs.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <div 
                  key={index}
                  className="p-6 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{reason.title}</h3>
                  <p className="text-gray-600">{reason.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">Organismes nous font confiance</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">98%</div>
              <div className="text-gray-600">Taux de satisfaction</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">80%</div>
              <div className="text-gray-600">De temps administratif gagné</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600">Support disponible</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Rejoignez des centaines de professionnels satisfaits
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Testez NECTFY gratuitement pendant 14 jours, sans engagement
          </p>
          <Link 
            to="/auth" 
            className="inline-flex items-center px-8 py-4 bg-white text-primary rounded-lg hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all"
          >
            Commencer gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-white/80 mt-6 text-sm">
            Sans carte bancaire • Support inclus • Données sécurisées
          </p>
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
                <h3 className="text-xl font-bold">NECTFY</h3>
                <p className="text-gray-400 text-sm">© 2024 Tous droits réservés</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
              <Link to="/solutions" className="hover:text-white transition-colors">Solutions</Link>
              <Link to="/fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</Link>
              <Link to="/cgu" className="hover:text-white transition-colors">CGU</Link>
              <Link to="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PourquoiNous;