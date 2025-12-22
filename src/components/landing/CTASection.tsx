import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-violet-700" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      {/* Sparkles */}
      <div className="absolute top-20 right-1/4 w-4 h-4 bg-white rounded-full animate-pulse-glow opacity-60" />
      <div className="absolute bottom-32 left-1/3 w-3 h-3 bg-white rounded-full animate-pulse-glow opacity-40" style={{ animationDelay: '0.5s' }} />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          Prêt à transformer votre 
          <br className="hidden md:block" />
          gestion de formation ?
        </h2>
        
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
          Rejoignez des centaines d'organismes qui font déjà confiance à NECTFY 
          pour simplifier leur quotidien.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link 
            to="/create-establishment" 
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary rounded-full font-semibold text-lg hover:bg-white/90 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
          >
            Créer un compte gratuit
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            to="/auth" 
            className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white border-2 border-white/30 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300"
          >
            Se connecter
          </Link>
        </div>
        
        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-white/80 text-sm md:text-base">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
            <span>Essai gratuit 14 jours</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
            <span>Sans carte bancaire</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
            <span>Support français 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
