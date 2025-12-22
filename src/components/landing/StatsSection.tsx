import React from 'react';

const stats = [
  { value: 80, label: 'REDUCES', sublabel: 'effort by more than 80%' },
  { value: 99.9, label: 'MATCH', sublabel: 'accuracy rate of above 99.9%' },
  { value: 50, label: 'COST SAVING', sublabel: 'of more than 50%' },
  { value: 80, label: 'INCREASE', sublabel: 'efficiency by 80%' }
];

const StatsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Voici pourquoi vous choisirez NECTFY
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Des résultats concrets pour optimiser la gestion de vos formations
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              {/* Circular Progress */}
              <div className="relative w-28 h-28 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="42" 
                    fill="none" 
                    stroke="hsl(var(--border))" 
                    strokeWidth="6"
                  />
                  {/* Progress circle - all purple */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="42" 
                    fill="none" 
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(stat.value / 100) * 264} 264`}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">
                    {stat.value}%
                  </span>
                </div>
              </div>
              
              {/* Labels */}
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {stat.label}
              </h4>
              <p className="text-xs text-muted-foreground">
                {stat.sublabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
