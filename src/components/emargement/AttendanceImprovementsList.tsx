import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Smartphone, 
  MapPin, 
  Bell, 
  BarChart3, 
  Clock, 
  Shield, 
  Zap, 
  Users, 
  FileText, 
  Camera,
  Wifi,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Target,
  Lightbulb,
  Workflow,
  TrendingUp,
  Link
} from 'lucide-react';

interface Improvement {
  id: string;
  category: string;
  title: string;
  description: string;
  detailedDescription: string;
  priority: 'Élevée' | 'Moyenne' | 'Faible';
  effort: 'Faible' | 'Moyen' | 'Élevé';
  impact: 'Fort' | 'Moyen' | 'Faible';
  icon: React.ReactNode;
  benefits: string[];
  technicalRequirements: string[];
  estimatedTime: string;
  estimatedCost: string;
  useCases: string[];
  implementationSteps: string[];
  risks: string[];
  successMetrics: string[];
  alternatives: string[];
  dependencies: string[];
}

const AttendanceImprovementsList = () => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const improvements: Improvement[] = [
    {
      id: 'qr-code',
      category: 'Modernisation Interface',
      title: 'Émargement par QR Code',
      description: 'Permettre aux étudiants de pointer rapidement en scannant un QR code unique généré pour chaque session.',
      detailedDescription: 'Cette amélioration révolutionne l\'expérience d\'émargement en remplaçant les signatures papier par un système de QR code dynamique. Chaque session génère un code unique, temporaire et sécurisé que les étudiants scannent avec leur smartphone. Le système intègre une validation en temps réel, une vérification d\'identité automatique et un horodatage précis. Cette solution moderne élimine les files d\'attente, réduit drastiquement les erreurs humaines et fournit une traçabilité complète de chaque émargement.',
      priority: 'Élevée',
      effort: 'Moyen',
      impact: 'Fort',
      icon: <Smartphone className="h-5 w-5" />,
      benefits: [
        'Réduction du temps d\'émargement de 80%',
        'Élimination complète des erreurs de signature',
        'Expérience utilisateur moderne et intuitive',
        'Traçabilité parfaite avec horodatage automatique',
        'Réduction des coûts de papier et d\'impression',
        'Intégration native avec les smartphones'
      ],
      technicalRequirements: [
        'Bibliothèque de génération QR Code (qrcode.js)',
        'Scanner QR intégré (instascan.js ou ZXing)',
        'Système de codes uniques temporaires avec JWT',
        'Validation côté serveur en temps réel',
        'Base de données pour tracking des codes',
        'API REST pour génération/validation'
      ],
      estimatedTime: '2-3 semaines',
      estimatedCost: '3 000 - 5 000 €',
      useCases: [
        'Étudiant arrive en cours et scanne le QR affiché au tableau',
        'Formateur génère un nouveau QR pour chaque session',
        'Validation automatique de l\'identité via token utilisateur',
        'Émargement de masse lors d\'événements avec plusieurs centaines de participants'
      ],
      implementationSteps: [
        'Installation et configuration des bibliothèques QR',
        'Développement du générateur de codes uniques',
        'Création de l\'interface de scan mobile-first',
        'Implémentation de la validation serveur',
        'Tests d\'intégration avec le système existant',
        'Formation des utilisateurs et déploiement graduel'
      ],
      risks: [
        'Problèmes de compatibilité avec anciens navigateurs',
        'Dépendance à la qualité de la caméra du dispositif',
        'Risque de fraude si le QR est partagé',
        'Problèmes d\'affichage sur certains écrans'
      ],
      successMetrics: [
        'Temps moyen d\'émargement < 10 secondes',
        'Taux d\'adoption > 95%',
        'Réduction des erreurs de 90%',
        'Satisfaction utilisateur > 4.5/5'
      ],
      alternatives: [
        'NFC (Near Field Communication)',
        'Codes à barres classiques',
        'Reconnaissance vocale',
        'Badges RFID'
      ],
      dependencies: [
        'Accès caméra sur tous les dispositifs',
        'Connexion internet stable',
        'Écrans d\'affichage dans les salles'
      ]
    },
    {
      id: 'geolocation',
      category: 'Sécurité & Contrôle',
      title: 'Géolocalisation Obligatoire',
      description: 'Vérifier que l\'étudiant est physiquement présent dans l\'établissement lors de l\'émargement.',
      detailedDescription: 'Ce système de géolocalisation avancé utilise les APIs de localisation modernes pour s\'assurer que les étudiants sont physiquement présents dans l\'enceinte de l\'établissement lors de l\'émargement. Le système définit des périmètres géographiques précis (geofencing) autour des campus et salles de classe, avec une tolérance configurable. Il intègre plusieurs technologies de localisation (GPS, WiFi, Bluetooth beacons) pour une précision maximale même en intérieur. Cette solution prévient efficacement la fraude à distance tout en respectant la vie privée des utilisateurs.',
      priority: 'Élevée',
      effort: 'Moyen',
      impact: 'Fort',
      icon: <MapPin className="h-5 w-5" />,
      benefits: [
        'Prévention totale de la fraude à distance',
        'Conformité réglementaire renforcée',
        'Données de localisation pour analytics avancés',
        'Sécurisation complète du processus d\'émargement',
        'Détection automatique des tentatives de fraude',
        'Amélioration de la crédibilité des certifications'
      ],
      technicalRequirements: [
        'API Geolocation HTML5',
        'Système de geofencing avec zones définies',
        'Gestion fine des permissions navigateur',
        'Algorithmes de triangulation WiFi/Bluetooth',
        'Base de données des coordonnées des salles',
        'Fallback pour cas d\'échec de géolocalisation'
      ],
      estimatedTime: '1-2 semaines',
      estimatedCost: '2 000 - 3 500 €',
      useCases: [
        'Étudiant tente d\'émarger depuis son domicile - accès refusé',
        'Validation automatique pour étudiant dans le campus',
        'Alertes en temps réel pour tentatives de fraude',
        'Rapports de géolocalisation pour audits qualité'
      ],
      implementationSteps: [
        'Cartographie précise des zones autorisées',
        'Développement du système de geofencing',
        'Intégration APIs de géolocalisation multi-sources',
        'Tests de précision dans différents environnements',
        'Mise en place des alertes de sécurité',
        'Formation équipes sur la gestion des exceptions'
      ],
      risks: [
        'Problèmes de précision GPS en intérieur',
        'Refus d\'autorisation de géolocalisation par l\'utilisateur',
        'Consommation batterie sur appareils mobiles',
        'Questions de confidentialité et RGPD'
      ],
      successMetrics: [
        'Précision géographique > 95%',
        'Réduction tentatives de fraude de 99%',
        'Temps de validation < 3 secondes',
        'Taux d\'acceptation utilisateur > 90%'
      ],
      alternatives: [
        'Beacons Bluetooth en salle',
        'Reconnaissance réseau WiFi',
        'Cartes d\'accès avec puce',
        'Contrôle visuel par surveillant'
      ],
      dependencies: [
        'Autorisation géolocalisation utilisateur',
        'Signal GPS/WiFi suffisant',
        'Cartographie précise des locaux'
      ]
    },
    {
      id: 'real-time-notifications',
      category: 'Communication',
      title: 'Notifications Push Temps Réel',
      description: 'Système de notifications automatiques pour rappels, ouvertures/fermetures d\'émargement.',
      detailedDescription: 'Un système de communication proactif qui envoie des notifications push personnalisées aux étudiants et formateurs. Le système gère différents types d\'alertes : rappels avant le début des cours, notifications d\'ouverture/fermeture d\'émargement, alertes d\'absence, confirmations de présence. Les notifications sont personnalisables par profil utilisateur et peuvent être programmées selon des règles métier complexes. L\'intégration avec les calendriers personnels et les préférences utilisateur garantit une communication pertinente et non intrusive.',
      priority: 'Moyenne',
      effort: 'Élevé',
      impact: 'Moyen',
      icon: <Bell className="h-5 w-5" />,
      benefits: [
        'Réduction drastique des oublis d\'émargement',
        'Communication proactive et personnalisée',
        'Amélioration significative du taux de participation',
        'Notifications contextuelles par rôle utilisateur',
        'Réduction de la charge administrative',
        'Amélioration de l\'engagement étudiant'
      ],
      technicalRequirements: [
        'Service Worker pour notifications web',
        'Firebase Cloud Messaging ou équivalent',
        'Système de gestion des abonnements utilisateur',
        'Templates de messages personnalisables',
        'Scheduler pour programmation automatique',
        'Analytics de délivrabilité des notifications'
      ],
      estimatedTime: '3-4 semaines',
      estimatedCost: '4 000 - 7 000 €',
      useCases: [
        'Rappel 15 minutes avant le début du cours',
        'Notification d\'ouverture d\'émargement en temps réel',
        'Alerte formateur si taux de présence anormalement bas',
        'Confirmation de présence pour rassurer les parents'
      ],
      implementationSteps: [
        'Configuration service de notifications push',
        'Développement système d\'abonnements',
        'Création templates et règles de déclenchement',
        'Intégration avec calendrier et planning',
        'Tests multi-navigateurs et multi-dispositifs',
        'Déploiement progressif avec groupes pilotes'
      ],
      risks: [
        'Notifications bloquées par les navigateurs',
        'Surcharge d\'information pour les utilisateurs',
        'Problèmes de délivrabilité selon les plateformes',
        'Coûts variables selon le volume d\'envois'
      ],
      successMetrics: [
        'Taux d\'ouverture notifications > 70%',
        'Réduction oublis émargement de 60%',
        'Engagement utilisateur +40%',
        'Satisfaction communication > 4/5'
      ],
      alternatives: [
        'SMS traditionnel',
        'Email automatique',
        'Notifications in-app uniquement',
        'Intégration applications calendrier'
      ],
      dependencies: [
        'Consentement utilisateur pour notifications',
        'Service de messagerie externe',
        'Calendrier académique numérisé'
      ]
    },
    {
      id: 'advanced-analytics',
      category: 'Analytics & Reporting',
      title: 'Dashboard Analytics Avancé',
      description: 'Tableaux de bord interactifs avec métriques de présence, tendances et prédictions.',
      detailedDescription: 'Une suite complète d\'analytics avec tableaux de bord interactifs utilisant l\'intelligence artificielle pour analyser les patterns de présence. Le système génère des insights automatiques sur les tendances d\'absentéisme, identifie les étudiants à risque de décrochage, et fournit des prédictions basées sur l\'historique. Les visualisations interactives permettent d\'explorer les données par formation, période, démographie. Des alertes intelligentes préviennent les responsables pédagogiques des situations nécessitant une intervention.',
      priority: 'Moyenne',
      effort: 'Élevé',
      impact: 'Fort',
      icon: <BarChart3 className="h-5 w-5" />,
      benefits: [
        'Identification précoce des étudiants à risque',
        'Optimisation des horaires selon les patterns de présence',
        'Métriques de performance détaillées par formation',
        'Prédictions d\'assiduité avec IA',
        'Rapports automatisés pour la direction',
        'Benchmarking inter-formations et inter-périodes'
      ],
      technicalRequirements: [
        'Entrepôt de données (Data Warehouse)',
        'Algorithmes de machine learning (Python/R)',
        'Bibliothèque de visualisation (D3.js, Chart.js)',
        'ETL pour transformation des données',
        'API analytics temps réel',
        'Cache distribué pour performances'
      ],
      estimatedTime: '4-5 semaines',
      estimatedCost: '6 000 - 10 000 €',
      useCases: [
        'Directeur pédagogique identifie une baisse de présence sur une formation',
        'Prédiction d\'abandon pour intervention préventive',
        'Optimisation des créneaux horaires selon l\'affluence',
        'Génération automatique de rapports mensuels'
      ],
      implementationSteps: [
        'Architecture de l\'entrepôt de données',
        'Développement des algorithmes prédictifs',
        'Création des visualisations interactives',
        'Mise en place du pipeline ETL',
        'Tests de performance et d\'exactitude',
        'Formation des utilisateurs aux nouveaux outils'
      ],
      risks: [
        'Complexité de mise en œuvre des modèles IA',
        'Performance dégradée avec gros volumes de données',
        'Interprétation erronée des métriques',
        'Coût infrastructure pour calculs complexes'
      ],
      successMetrics: [
        'Précision prédictions > 85%',
        'Temps de génération rapports < 30s',
        'Adoption par 100% des responsables',
        'Réduction décrochage de 25%'
      ],
      alternatives: [
        'Rapports statiques avancés',
        'Intégration outils BI existants',
        'Dashboard simple sans IA',
        'Export vers Excel pour analyse manuelle'
      ],
      dependencies: [
        'Historique de données suffisant',
        'Infrastructure de calcul adaptée',
        'Formation des utilisateurs finaux'
      ]
    },
    {
      id: 'auto-timing',
      category: 'Automatisation',
      title: 'Gestion Automatique des Horaires',
      description: 'Ouverture/fermeture automatique des émargements selon les créneaux planifiés.',
      detailedDescription: 'Système d\'automatisation intelligent qui synchronise parfaitement les émargements avec les plannings académiques. Le système ouvre et ferme automatiquement les sessions d\'émargement selon les créneaux définis, avec gestion avancée des exceptions (jours fériés, événements spéciaux, annulations). Il intègre des règles métier flexibles pour gérer les retards, les prolongations de cours, et les situations exceptionnelles. L\'automatisation complète élimine les erreurs humaines et garantit une cohérence parfaite des processus.',
      priority: 'Élevée',
      effort: 'Faible',
      impact: 'Moyen',
      icon: <Clock className="h-5 w-5" />,
      benefits: [
        'Élimination totale des erreurs d\'ouverture/fermeture',
        'Respect automatique des créneaux horaires',
        'Réduction drastique de la charge administrative',
        'Cohérence parfaite des processus',
        'Gestion intelligente des exceptions',
        'Audit trail complet des actions automatiques'
      ],
      technicalRequirements: [
        'Système de cron jobs ou task scheduler',
        'Intégration API avec calendrier académique',
        'Gestionnaire d\'exceptions et règles métier',
        'Système de logs et audit trail',
        'Interface de configuration des règles',
        'Mécanisme de rollback en cas d\'erreur'
      ],
      estimatedTime: '1 semaine',
      estimatedCost: '1 500 - 2 500 €',
      useCases: [
        'Ouverture automatique 10 minutes avant le cours',
        'Fermeture automatique 15 minutes après le début',
        'Gestion des cours annulés sans intervention manuelle',
        'Adaptation automatique aux changements d\'horaires'
      ],
      implementationSteps: [
        'Configuration du système de planification',
        'Intégration avec le calendrier existant',
        'Développement des règles métier',
        'Tests des scénarios d\'exception',
        'Mise en place monitoring et alertes',
        'Validation avec utilisateurs pilotes'
      ],
      risks: [
        'Défaillance du système de planification',
        'Désynchronisation avec le calendrier',
        'Gestion inadequate des exceptions',
        'Perte de contrôle manuel en cas de besoin'
      ],
      successMetrics: [
        'Ponctualité ouverture/fermeture = 100%',
        'Réduction interventions manuelles de 95%',
        'Zéro erreur d\'horaire sur 1 mois',
        'Temps de configuration < 5 minutes par règle'
      ],
      alternatives: [
        'Notifications de rappel pour actions manuelles',
        'Semi-automatisation avec validation',
        'Intégration directe calendrier Google/Outlook',
        'Planification hebdomadaire récurrente'
      ],
      dependencies: [
        'Calendrier académique numérisé',
        'Système de planification fiable',
        'Définition claire des règles métier'
      ]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Élevée':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Moyenne':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Faible':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Élevé':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Moyen':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Faible':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Fort':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Moyen':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Faible':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const categories = [...new Set(improvements.map(imp => imp.category))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Spécifications Détaillées - Améliorations Système d'Émargement
        </h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          Analyse complète et détaillée des améliorations prioritaires pour moderniser, 
          sécuriser et optimiser le système d'émargement existant. Chaque amélioration 
          inclut les spécifications techniques, les coûts, les risques et les métriques de succès.
        </p>
      </div>

      {/* Quick Wins */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Zap className="h-5 w-5 mr-2" />
            Quick Wins - ROI Immédiat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {improvements
              .filter(imp => imp.priority === 'Élevée' && imp.effort === 'Faible')
              .map(improvement => (
                <div key={improvement.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center space-x-4">
                    {improvement.icon}
                    <div>
                      <h4 className="font-semibold text-lg">{improvement.title}</h4>
                      <p className="text-sm text-gray-600">{improvement.estimatedTime} • {improvement.estimatedCost}</p>
                      <p className="text-sm text-green-700 font-medium">ROI estimé: 300-500%</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white">Priorité Immédiate</Badge>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>

      {/* Améliorations détaillées par catégorie */}
      {categories.map(category => (
        <Card key={category} className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-600" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {improvements
                .filter(imp => imp.category === category)
                .map(improvement => (
                  <Card key={improvement.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            {improvement.icon}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{improvement.title}</CardTitle>
                            <p className="text-gray-600 mb-3">{improvement.description}</p>
                            <div className="flex items-center space-x-2 mb-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">{improvement.estimatedCost}</span>
                              <span className="text-gray-400">•</span>
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">{improvement.estimatedTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Badge className={getPriorityColor(improvement.priority)}>
                            {improvement.priority}
                          </Badge>
                          <Badge className={getEffortColor(improvement.effort)}>
                            Effort {improvement.effort}
                          </Badge>
                          <Badge className={getImpactColor(improvement.impact)}>
                            Impact {improvement.impact}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Description détaillée */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Description Détaillée
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{improvement.detailedDescription}</p>
                      </div>

                      <Collapsible open={expandedItems.has(improvement.id)} onOpenChange={() => toggleExpanded(improvement.id)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full mb-4">
                            {expandedItems.has(improvement.id) ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                            {expandedItems.has(improvement.id) ? 'Masquer les détails' : 'Voir tous les détails'}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Bénéfices */}
                            <div>
                              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Bénéfices Attendus
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {improvement.benefits.map((benefit, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-green-600 mr-2 mt-0.5">•</span>
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Exigences techniques */}
                            <div>
                              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                                <Settings className="h-4 w-4 mr-2" />
                                Exigences Techniques
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {improvement.technicalRequirements.map((req, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-600 mr-2 mt-0.5">•</span>
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Cas d'usage */}
                            <div>
                              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                                <Target className="h-4 w-4 mr-2" />
                                Cas d'Usage Concrets
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {improvement.useCases.map((useCase, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-purple-600 mr-2 mt-0.5">•</span>
                                    <span>{useCase}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Étapes d'implémentation */}
                            <div>
                              <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
                                <Workflow className="h-4 w-4 mr-2" />
                                Étapes d'Implémentation
                              </h4>
                              <ol className="space-y-2 text-sm">
                                {improvement.implementationSteps.map((step, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">
                                      {index + 1}
                                    </span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            {/* Risques et mitigation */}
                            <div>
                              <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Risques et Mitigation
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {improvement.risks.map((risk, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-red-600 mr-2 mt-0.5">⚠</span>
                                    <span>{risk}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Métriques de succès */}
                            <div>
                              <h4 className="font-semibold text-teal-800 mb-3 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Métriques de Succès
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {improvement.successMetrics.map((metric, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-teal-600 mr-2 mt-0.5">📊</span>
                                    <span>{metric}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Alternatives */}
                            <div>
                              <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                                <Lightbulb className="h-4 w-4 mr-2" />
                                Solutions Alternatives
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {improvement.alternatives.map((alt, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-orange-600 mr-2 mt-0.5">💡</span>
                                    <span>{alt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Dépendances */}
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                <Link className="h-4 w-4 mr-2" />
                                Dépendances
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {improvement.dependencies.map((dep, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-gray-600 mr-2 mt-0.5">🔗</span>
                                    <span>{dep}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Cahier des charges
                              </Button>
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Discuter
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                ))
              }
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Roadmap suggérée avec détails financiers */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-800 text-2xl">Roadmap de Déploiement Recommandée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg border-l-4 border-l-green-500">
              <h4 className="font-bold text-green-800 text-lg mb-2">Phase 1 - Fondations Critiques</h4>
              <p className="text-gray-600 mb-3">Implémentation des améliorations à ROI immédiat</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Durée: 4-6 semaines</p>
                  <p className="text-sm font-medium text-gray-700">Budget: 6 500 - 11 000 €</p>
                  <p className="text-sm font-medium text-gray-700">ROI attendu: 400%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inclut: Gestion automatique horaires, QR Code, géolocalisation</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white rounded-lg border-l-4 border-l-blue-500">
              <h4 className="font-bold text-blue-800 text-lg mb-2">Phase 2 - Expérience Utilisateur</h4>
              <p className="text-gray-600 mb-3">Amélioration de l'interface et des fonctionnalités</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Durée: 6-8 semaines</p>
                  <p className="text-sm font-medium text-gray-700">Budget: 8 000 - 15 000 €</p>
                  <p className="text-sm font-medium text-gray-700">ROI attendu: 250%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inclut: Rapports intelligents, notifications push</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white rounded-lg border-l-4 border-l-purple-500">
              <h4 className="font-bold text-purple-800 text-lg mb-2">Phase 3 - Innovation Avancée</h4>
              <p className="text-gray-600 mb-3">Technologies de pointe et analytics IA</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Durée: 8-12 semaines</p>
                  <p className="text-sm font-medium text-gray-700">Budget: 12 000 - 25 000 €</p>
                  <p className="text-sm font-medium text-gray-700">ROI attendu: 200%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inclut: Analytics IA, authentification biométrique</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé exécutif */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 text-2xl">Résumé Exécutif & Impact Global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="font-bold text-lg mb-2">Efficacité Opérationnelle</h4>
                <p className="text-3xl font-bold text-green-600 mb-2">75%</p>
                <p className="text-sm text-gray-600">Réduction du temps administratif</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h4 className="font-bold text-lg mb-2">Précision & Fiabilité</h4>
                <p className="text-3xl font-bold text-blue-600 mb-2">95%</p>
                <p className="text-sm text-gray-600">Réduction des erreurs de processus</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h4 className="font-bold text-lg mb-2">Satisfaction Utilisateur</h4>
                <p className="text-3xl font-bold text-purple-600 mb-2">4.8/5</p>
                <p className="text-sm text-gray-600">Score de satisfaction prévu</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-white rounded-lg">
            <h4 className="font-bold text-lg mb-4">Investissement Total & Retour sur Investissement</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Investissement total estimé (3 phases)</p>
                <p className="text-2xl font-bold text-gray-800">26 500 - 51 000 €</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">ROI global attendu sur 2 ans</p>
                <p className="text-2xl font-bold text-green-600">300 - 450%</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>* Calculs basés sur les économies de temps administratif, réduction des erreurs, 
                 amélioration de la conformité et augmentation de la satisfaction utilisateur.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceImprovementsList;