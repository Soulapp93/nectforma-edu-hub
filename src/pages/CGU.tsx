import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const CGU = () => {
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
            
            <Link 
              to="/" 
              className="flex items-center text-gray-700 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center mb-8">
          <FileText className="h-10 w-10 text-primary mr-4" />
          <h1 className="text-4xl font-bold text-gray-900">
            Conditions Générales d'Utilisation
          </h1>
        </div>
        
        <div className="text-sm text-gray-600 mb-8">
          Dernière mise à jour : 20 octobre 2024
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les modalités 
              et conditions d'utilisation de la plateforme NECTFY (ci-après "la Plateforme"), ainsi que les droits 
              et obligations des parties dans ce cadre.
            </p>
            <p className="text-gray-700 leading-relaxed">
              L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Accès à la Plateforme</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              La Plateforme est accessible gratuitement à tout utilisateur disposant d'un accès à Internet. 
              Tous les frais supportés par l'utilisateur pour accéder au service (matériel informatique, 
              logiciels, connexion Internet, etc.) sont à sa charge.
            </p>
            <p className="text-gray-700 leading-relaxed">
              NECTFY met en œuvre tous les moyens raisonnables à sa disposition pour assurer un accès 
              de qualité à la Plateforme, mais n'est tenue à aucune obligation d'y parvenir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Création de Compte</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pour utiliser la Plateforme, l'utilisateur doit créer un compte en fournissant des informations 
              exactes et à jour. L'utilisateur s'engage à :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Fournir des informations exactes, complètes et à jour</li>
              <li>Maintenir la confidentialité de ses identifiants de connexion</li>
              <li>Informer immédiatement NECTFY de toute utilisation non autorisée de son compte</li>
              <li>Ne pas créer de compte pour le compte d'un tiers sans autorisation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Services Proposés</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NECTFY propose une plateforme de gestion de formations incluant notamment :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>La gestion des formations et modules pédagogiques</li>
              <li>L'émargement numérique et signatures électroniques</li>
              <li>La planification des emplois du temps</li>
              <li>La gestion des utilisateurs (formateurs, apprenants, administrateurs)</li>
              <li>La messagerie intégrée</li>
              <li>Le stockage sécurisé de documents</li>
              <li>Les tableaux de bord et statistiques</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Propriété Intellectuelle</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tous les contenus présents sur la Plateforme (textes, images, graphismes, logo, vidéos, etc.) 
              sont la propriété exclusive de NECTFY ou de ses partenaires et sont protégés par les lois 
              françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie 
              des éléments de la Plateforme, quel que soit le moyen ou le procédé utilisé, est interdite, 
              sauf autorisation écrite préalable de NECTFY.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Protection des Données Personnelles</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NECTFY s'engage à respecter la réglementation applicable en matière de protection des données 
              personnelles, notamment le Règlement Général sur la Protection des Données (RGPD).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Pour plus d'informations sur la collecte et le traitement de vos données personnelles, 
              veuillez consulter notre <Link to="/politique-confidentialite" className="text-primary hover:underline">
              Politique de Confidentialité</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Responsabilités</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NECTFY ne peut être tenue responsable :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès à la Plateforme</li>
              <li>De l'utilisation frauduleuse ou abusive de la Plateforme par un utilisateur</li>
              <li>De l'impossibilité d'accéder temporairement à la Plateforme pour des opérations de maintenance</li>
              <li>Des contenus publiés par les utilisateurs sur la Plateforme</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modification des CGU</h2>
            <p className="text-gray-700 leading-relaxed">
              NECTFY se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs 
              seront informés de ces modifications par email et/ou par un avis sur la Plateforme. 
              La poursuite de l'utilisation de la Plateforme après ces modifications vaut acceptation 
              des nouvelles CGU.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Résiliation</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              L'utilisateur peut résilier son compte à tout moment depuis les paramètres de son compte 
              ou en contactant le support NECTFY.
            </p>
            <p className="text-gray-700 leading-relaxed">
              NECTFY se réserve le droit de suspendre ou de supprimer le compte d'un utilisateur 
              en cas de violation des présentes CGU, sans préavis ni indemnité.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Droit Applicable et Juridiction</h2>
            <p className="text-gray-700 leading-relaxed">
              Les présentes CGU sont régies par le droit français. En cas de litige relatif à 
              l'interprétation ou à l'exécution des présentes, et à défaut d'accord amiable, 
              les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant les présentes CGU, vous pouvez nous contacter à l'adresse : 
              <a href="mailto:contact@nectfy.com" className="text-primary hover:underline ml-1">
                contact@nectfy.com
              </a>
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
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
              <Link to="/pourquoi-nous" className="hover:text-white transition-colors">Pourquoi nous ?</Link>
              <Link to="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CGU;