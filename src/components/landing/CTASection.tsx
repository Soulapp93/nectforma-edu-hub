import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, HeartHandshake } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 bg-lavender">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Prêt à transformer la gestion de vos formations ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Rejoignez les établissements qui font confiance à NECTFY pour simplifier 
            leur quotidien et améliorer l'expérience de leurs apprenants.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-3 h-auto text-base font-medium shadow-button hover:shadow-button-hover transition-all">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/solutions">
              <Button variant="outline" className="rounded-full px-8 py-3 h-auto text-base font-medium border-border bg-card hover:bg-secondary">
                Voir les tarifs
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Données sécurisées</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>Déploiement rapide</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-primary" />
              <span>Support dédié</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
