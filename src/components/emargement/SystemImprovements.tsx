import React from 'react';
import { 
  Smartphone, 
  MapPin, 
  QrCode, 
  BarChart3, 
  Bell, 
  Download, 
  Camera,
  Wifi,
  Zap,
  Clock,
  Shield,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SystemImprovements = () => {
  const improvements = [
    {
      category: "Modernisation Interface",
      color: "bg-blue-500",
      icon: <Smartphone className="h-6 w-6" />,
      items: [
        {
          title: "Interface Mobile-First",
          description: "Application native responsive avec PWA pour utilisation offline",
          priority: "Haute",
          effort: "Moyen"
        },
        {
          title: "Dashboard Temps Réel",
          description: "Visualisation live des présences avec graphiques interactifs",
          priority: "Haute", 
          effort: "Élevé"
        },
        {
          title: "Design System Unifié",
          description: "Interface cohérente et moderne avec thème sombre/clair",
          priority: "Moyenne",
          effort: "Faible"
        }
      ]
    },
    {
      category: "Automatisation",
      color: "bg-green-500",
      icon: <Zap className="h-6 w-6" />,
      items: [
        {
          title: "QR Code Émargement",
          description: "Scan rapide pour signature automatique des étudiants",
          priority: "Haute",
          effort: "Faible"
        },
        {
          title: "Géolocalisation",
          description: "Vérification automatique de la présence physique en salle",
          priority: "Moyenne",
          effort: "Moyen"
        },
        {
          title: "Notifications Push",
          description: "Rappels automatiques 10min avant le cours",
          priority: "Moyenne",
          effort: "Faible"
        }
      ]
    },
    {
      category: "Analytics & Reporting",
      color: "bg-purple-500", 
      icon: <BarChart3 className="h-6 w-6" />,
      items: [
        {
          title: "Tableaux de Bord Avancés",
          description: "Statistiques détaillées par formation, étudiant, période",
          priority: "Haute",
          effort: "Élevé"
        },
        {
          title: "Export Automatisé",
          description: "Génération automatique de rapports PDF/Excel programmés",
          priority: "Moyenne",
          effort: "Moyen"
        },
        {
          title: "Prédiction d'Absentéisme",
          description: "IA pour détecter les patterns d'absence et alerter",
          priority: "Faible",
          effort: "Élevé"
        }
      ]
    },
    {
      category: "Sécurité & Compliance",
      color: "bg-red-500",
      icon: <Shield className="h-6 w-6" />,
      items: [
        {
          title: "Biométrie Avancée",
          description: "Reconnaissance faciale ou empreinte digitale",
          priority: "Faible",
          effort: "Élevé"
        },
        {
          title: "Audit Trail Complet",
          description: "Traçabilité complète de toutes les actions",
          priority: "Haute",
          effort: "Moyen"
        },
        {
          title: "Signature Blockchain",
          description: "Horodatage cryptographique infalsifiable",
          priority: "Faible",
          effort: "Élevé"
        }
      ]
    },
    {
      category: "Workflow Intelligent",
      color: "bg-indigo-500",
      icon: <Clock className="h-6 w-6" />,
      items: [
        {
          title: "Workflow Automatisé",
          description: "Validation automatique selon règles métier",
          priority: "Haute",
          effort: "Moyen"
        },
        {
          title: "Gestion des Retards",
          description: "Politique flexible avec tolérance configurable",
          priority: "Moyenne",
          effort: "Faible"
        },
        {
          title: "Intégration Calendrier",
          description: "Sync avec Google Calendar, Outlook, planning établissement",
          priority: "Moyenne",
          effort: "Moyen"
        }
      ]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Haute': return 'bg-red-100 text-red-800 border-red-200';
      case 'Moyenne': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Faible': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Élevé': return 'bg-red-50 text-red-700';
      case 'Moyen': return 'bg-yellow-50 text-yellow-700';
      case 'Faible': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Propositions d'Amélioration
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Évolution du système d'émargement vers une solution moderne, 
          automatisée et intelligente
        </p>
      </div>

      {/* Améliorations Quick Wins */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Zap className="h-5 w-5 mr-2" />
            Quick Wins - Implémentation Immédiate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code Émargement
              </h4>
              <p className="text-sm text-muted-foreground">
                Génération automatique de QR codes uniques par session. 
                Les étudiants scannent pour s'émarger instantanément.
              </p>
              <Badge className="text-xs">2-3 jours dev</Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notifications Push
              </h4>
              <p className="text-sm text-muted-foreground">
                Rappels automatiques 10min avant les cours. 
                Notifications de validation pour les formateurs.
              </p>
              <Badge className="text-xs">1-2 jours dev</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des améliorations */}
      <div className="space-y-6">
        {improvements.map((category, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                  {category.icon}
                </div>
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <Badge variant="secondary" className={getEffortColor(item.effort)}>
                          {item.effort}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roadmap suggérée */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-primary">Roadmap de Déploiement Suggérée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold">Phase 1 - Quick Wins (1-2 semaines)</h4>
                <p className="text-sm text-muted-foreground">QR Code, Notifications, Interface mobile responsive</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold">Phase 2 - Automation (3-4 semaines)</h4>
                <p className="text-sm text-muted-foreground">Géolocalisation, Workflow automatisé, Dashboard analytics</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold">Phase 3 - Intelligence (2-3 mois)</h4>
                <p className="text-sm text-muted-foreground">IA prédictive, Biométrie, Blockchain, Analytics avancés</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI et bénéfices */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle>Bénéfices Attendus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold">Gain de Temps</h4>
              <p className="text-sm text-muted-foreground">-75% temps d'émargement<br/>-50% temps de validation</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold">Précision</h4>
              <p className="text-sm text-muted-foreground">+95% exactitude<br/>Élimination erreurs manuelles</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold">Satisfaction</h4>
              <p className="text-sm text-muted-foreground">Interface intuitive<br/>Process simplifié</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemImprovements;