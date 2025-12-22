import React from 'react';
import { Link } from 'react-router-dom';

const LandingFooter = () => {
  return (
    <footer className="bg-foreground text-background py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-2xl font-bold text-background">
                NECTFY
              </span>
            </div>
            <p className="text-background/70 max-w-sm leading-relaxed">
              La plateforme tout-en-un pour digitaliser et optimiser 
              la gestion de votre organisme de formation.
            </p>
          </div>
          
          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-background mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-background/70 hover:text-background transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/fonctionnalites" className="text-background/70 hover:text-background transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="text-background/70 hover:text-background transition-colors">
                  Solutions
                </Link>
              </li>
              <li>
                <Link to="/pourquoi-nous" className="text-background/70 hover:text-background transition-colors">
                  À propos
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-semibold text-background mb-4">Légal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/cgu" className="text-background/70 hover:text-background transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/politique-confidentialite" className="text-background/70 hover:text-background transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/60 text-sm">
              © {new Date().getFullYear()} NECTFY. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-background/60 text-sm">
                Fait avec 💜 en France
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
