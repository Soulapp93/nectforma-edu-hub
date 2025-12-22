import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';

const LandingHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-button">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              NECTFY
            </span>
          </Link>
          
          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="nav-link-finbix">
              Accueil
            </Link>
            <Link to="/fonctionnalites" className="nav-link-finbix">
              Fonctionnalités
            </Link>
            <Link to="/solutions" className="nav-link-finbix">
              Solutions
            </Link>
            <Link to="/pourquoi-nous" className="nav-link-finbix">
              À propos
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Dark mode toggle placeholder */}
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Moon className="h-5 w-5" />
            </button>
            
            <Link 
              to="/auth" 
              className="hidden sm:inline-flex text-foreground/80 hover:text-foreground font-medium transition-colors"
            >
              Se connecter
            </Link>
            
            <Link 
              to="/create-establishment" 
              className="btn-finbix text-sm md:text-base"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
