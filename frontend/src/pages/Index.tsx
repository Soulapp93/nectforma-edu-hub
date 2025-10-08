
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Calendar, MessageSquare, Shield, Zap, Check } from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Gestion des Formations',
      description: 'Créez et gérez vos formations avec des modules personnalisés'
    },
    {
      icon: Users,
      title: 'Gestion des Utilisateurs',
      description: 'Administrez facilement vos formateurs et étudiants'
    },
    {
      icon: Calendar,
      title: 'Emploi du Temps',
      description: 'Planifiez et organisez vos cours avec notre interface intuitive'
    },
    {
      icon: MessageSquare,
      title: 'Messagerie Intégrée',
      description: 'Communiquez efficacement avec votre équipe'
    },
    {
      icon: Shield,
      title: 'Coffre-fort Numérique',
      description: 'Stockez vos documents en toute sécurité'
    },
    {
      icon: Zap,
      title: 'Tableau de Bord',
      description: 'Suivez vos indicateurs de performance en temps réel'
    }
  ];

  const plans = [
    {
      name: 'Basic',
      price: '24,99',
      features: [
        'Jusqu\'à 50 étudiants',
        '3 Go de stockage',
        'Gestion des formations',
        'Emploi du temps basique',
        'Support email'
      ]
    },
    {
      name: 'Essentiel',
      price: '49',
      popular: true,
      features: [
        'Jusqu\'à 200 étudiants',
        '10 Go de stockage',
        'Messagerie intégrée',
        'Émargement numérique',
        'Support prioritaire'
      ]
    },
    {
      name: 'Premium',
      price: '99',
      features: [
        'Étudiants illimités',
        '100 Go de stockage',
        'Toutes les fonctionnalités',
        'API personnalisée',
        'Support dédié'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">NF</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NECTFORMA</h1>
                <p className="text-sm text-gray-600">Plateforme de gestion éducative</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link 
                to="/auth" 
                className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                Connexion
              </Link>
              <Link 
                to="/auth" 
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Révolutionnez votre gestion de formation
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            NectForma est la plateforme SaaS complète pour digitaliser et automatiser 
            la gestion pédagogique de votre établissement.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/auth" 
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-lg"
            >
              Commencer gratuitement
            </Link>
            <button className="px-8 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-medium text-lg">
              Voir la démo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600">
              Une solution complète pour la gestion de votre établissement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 bg-gray-50 rounded-xl hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choisissez votre plan
            </h2>
            <p className="text-xl text-gray-600">
              Des tarifs adaptés à la taille de votre établissement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`p-8 bg-white rounded-xl shadow-sm border ${
                plan.popular ? 'border-purple-500 transform scale-105' : 'border-gray-200'
              }`}>
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Le plus populaire
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900">
                    {plan.price}€
                    <span className="text-lg font-normal text-gray-600">/mois</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-lg font-medium ${
                  plan.popular 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                  Choisir ce plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">NF</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">NECTFORMA</h3>
                <p className="text-gray-400 text-sm">© 2024 NectForma. Tous droits réservés.</p>
              </div>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">Conditions d'utilisation</a>
              <a href="#" className="text-gray-400 hover:text-white">Politique de confidentialité</a>
              <a href="#" className="text-gray-400 hover:text-white">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
