import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PolitiqueConfidentialite = () => {
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
          <Shield className="h-10 w-10 text-primary mr-4" />
          <h1 className="text-4xl font-bold text-gray-900">
            Politique de Confidentialité
          </h1>
        </div>
        
        <div className="text-sm text-gray-600 mb-8">
          Dernière mise à jour : 20 octobre 2024
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NECTFY (ci-après "nous", "notre" ou "la Société") s'engage à protéger la confidentialité 
              et la sécurité des données personnelles de ses utilisateurs. La présente Politique de Confidentialité 
              explique comment nous collectons, utilisons, partageons et protégeons vos données personnelles 
              lorsque vous utilisez notre plateforme.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD) 
              et à la loi Informatique et Libertés.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données Collectées</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nous collectons les données personnelles suivantes :
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1. Données d'identification</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Identifiants de connexion</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2. Données d'utilisation</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
              <li>Historique de navigation sur la plateforme</li>
              <li>Données de connexion (adresse IP, type de navigateur, système d'exploitation)</li>
              <li>Données d'interaction avec la plateforme</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3. Données pédagogiques</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Informations sur les formations suivies ou dispensées</li>
              <li>Données d'émargement et de présence</li>
              <li>Documents et contenus pédagogiques</li>
              <li>Résultats et évaluations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Finalités du Traitement</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vos données personnelles sont collectées et traitées pour les finalités suivantes :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Fourniture et amélioration de nos services</li>
              <li>Gestion des formations et du suivi pédagogique</li>
              <li>Communication avec vous (support, notifications, informations importantes)</li>
              <li>Respect de nos obligations légales et réglementaires</li>
              <li>Analyse statistique et amélioration de nos services</li>
              <li>Sécurité et prévention de la fraude</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base Légale du Traitement</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le traitement de vos données personnelles repose sur les bases légales suivantes :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Exécution du contrat :</strong> Pour fournir les services demandés</li>
              <li><strong>Consentement :</strong> Pour certaines communications marketing</li>
              <li><strong>Obligation légale :</strong> Pour respecter nos obligations réglementaires</li>
              <li><strong>Intérêt légitime :</strong> Pour améliorer nos services et assurer la sécurité</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partage des Données</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nous ne vendons ni ne louons vos données personnelles. Nous pouvons partager vos données avec :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Prestataires de services :</strong> Pour l'hébergement, le support technique, etc.</li>
              <li><strong>Autorités compétentes :</strong> Si requis par la loi</li>
              <li><strong>Votre organisme de formation :</strong> Dans le cadre de votre inscription</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Tous nos prestataires sont soumis à des obligations strictes de confidentialité et de sécurité.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Conservation des Données</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nous conservons vos données personnelles :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Pendant la durée de votre utilisation de la plateforme</li>
              <li>Pour la durée nécessaire aux finalités pour lesquelles elles ont été collectées</li>
              <li>Conformément aux obligations légales de conservation (notamment 3 ans pour les données de formation)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Après cette période, vos données sont supprimées ou anonymisées de manière sécurisée.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Sécurité des Données</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger 
              vos données contre :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>L'accès non autorisé</li>
              <li>La divulgation</li>
              <li>La modification</li>
              <li>La destruction</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Ces mesures incluent notamment le chiffrement des données, des protocoles de sécurité avancés, 
              et des contrôles d'accès stricts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Vos Droits</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> Corriger vos données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
              <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
              <li><strong>Droit de retirer votre consentement :</strong> À tout moment</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à : 
              <a href="mailto:privacy@nectfy.com" className="text-primary hover:underline ml-1">
                privacy@nectfy.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Notre plateforme utilise des cookies pour :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Assurer le bon fonctionnement de la plateforme</li>
              <li>Mémoriser vos préférences</li>
              <li>Analyser l'utilisation de nos services</li>
              <li>Améliorer votre expérience utilisateur</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter 
              certaines fonctionnalités de la plateforme.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous pouvons modifier cette Politique de Confidentialité à tout moment. Les modifications 
              entreront en vigueur dès leur publication sur la plateforme. Nous vous informerons de tout 
              changement significatif par email ou notification sur la plateforme.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Réclamations</h2>
            <p className="text-gray-700 leading-relaxed">
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation 
              auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) :
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              CNIL - 3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07<br />
              Téléphone : 01 53 73 22 22<br />
              Site web : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant cette Politique de Confidentialité ou le traitement de vos données, 
              vous pouvez nous contacter :
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Email : <a href="mailto:privacy@nectfy.com" className="text-primary hover:underline">privacy@nectfy.com</a><br />
              Adresse : NECTFY - Service Protection des Données
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
              <Link to="/cgu" className="hover:text-white transition-colors">CGU</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PolitiqueConfidentialite;