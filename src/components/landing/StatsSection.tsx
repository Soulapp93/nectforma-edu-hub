import React from 'react';

const stats = [
  {
    value: 80,
    label: 'Temps économisé',
    description: 'sur les tâches administratives'
  },
  {
    value: 99,
    label: 'Disponibilité',
    description: 'de la plateforme garantie'
  },
  {
    value: 95,
    label: 'Satisfaction client',
    description: 'taux de recommandation'
  }
];

const StatsSection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 finbix-hero-bg opacity-50" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] finbix-gradient-orb opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] finbix-gradient-orb opacity-15" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="finbix-title text-foreground mb-4">
            Des résultats concrets
          </h2>
          <p className="finbix-subtitle mx-auto">
            Rejoignez des centaines d'organismes qui font déjà confiance à NECTFY 
            pour optimiser leur gestion.
          </p>
        </div>

        {/* Stats circles */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Circular progress */}
              <div className="relative w-40 h-40 md:w-48 md:h-48 mb-6">
                {/* Glass background */}
                <div className="absolute inset-0 rounded-full glass-card-strong" />
                
                {/* SVG Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="6"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${stat.value * 2.64} 264`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(262, 72%, 55%)" />
                      <stop offset="100%" stopColor="hsl(280, 75%, 60%)" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl md:text-5xl font-bold text-foreground">
                    {stat.value}%
                  </span>
                </div>
              </div>
              
              {/* Label */}
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                {stat.label}
              </h3>
              <p className="text-muted-foreground">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional info cards */}
        <div className="mt-16 md:mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: '500+', label: 'Formations gérées' },
            { value: '10K+', label: 'Apprenants' },
            { value: '50+', label: 'Établissements' },
            { value: '24/7', label: 'Support client' }
          ].map((item, index) => (
            <div 
              key={index}
              className="glass-card-strong rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300"
            >
              <p className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {item.value}
              </p>
              <p className="text-muted-foreground font-medium">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
