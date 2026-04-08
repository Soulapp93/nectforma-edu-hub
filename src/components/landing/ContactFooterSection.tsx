import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, Send, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import NectformaLogo from '@/components/NectformaLogo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ContactFooterSection: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <>
      {/* Contact Section */}
       <section id="contact" className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 section-contact-bg" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Mail className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium">Contactez-nous</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Une question ? <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Parlons-en</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour répondre à toutes vos questions et vous accompagner dans votre projet.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-primary/20">
                <h3 className="text-xl font-bold text-foreground mb-4">Pourquoi nous contacter ?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Démonstration personnalisée
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Devis sur mesure
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Questions techniques
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Partenariats et intégrations
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <h3 className="text-2xl font-bold text-foreground mb-6">Envoyez-nous un message</h3>
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                
                const formData = new FormData(e.currentTarget);
                const data = {
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  email: formData.get('email') as string,
                  subject: formData.get('subject') as string,
                  message: formData.get('message') as string,
                };

                try {
                  const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-form`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                      },
                      body: JSON.stringify(data),
                    }
                  );

                  const result = await response.json();

                  if (response.ok) {
                    toast.success("Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.");
                    (e.target as HTMLFormElement).reset();
                  } else {
                    throw new Error(result.error || "Erreur lors de l'envoi");
                  }
                } catch (error) {
                  console.error('Error sending contact form:', error);
                  toast.error("Erreur lors de l'envoi du message. Veuillez réessayer.");
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Sujet
                  </label>
                  <Select name="subject" required>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Sélectionnez un sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demande de démonstration</SelectItem>
                      <SelectItem value="devis">Demande de devis</SelectItem>
                      <SelectItem value="support">Support technique</SelectItem>
                      <SelectItem value="partenariat">Partenariat</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                    placeholder="Décrivez votre demande..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:shadow-lg transform hover:scale-[1.02] font-semibold text-lg transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                  {!isSubmitting && <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-12 md:py-16 border-t border-white/10" style={{ background: 'linear-gradient(180deg, hsl(240 60% 14%) 0%, hsl(242 58% 10%) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <NectformaLogo variant="light" size="lg" />
              </div>
              <p className="text-white/60 mb-4 max-w-md">
                La plateforme complète pour digitaliser et automatiser la gestion des établissements d'enseignement supérieur, organismes de formation, CFA et universités.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Navigation</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#fonctionnalites" className="hover:text-golden transition-colors">Solutions</a></li>
                <li><Link to="/fonctionnalites" className="hover:text-golden transition-colors">Fonctionnalités</Link></li>
                <li><Link to="/pourquoi-nous" className="hover:text-golden transition-colors">Pourquoi nous ?</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Légal</h4>
              <ul className="space-y-2 text-white/60">
                <li><Link to="/cgu" className="hover:text-golden transition-colors">CGU</Link></li>
                <li><Link to="/politique-confidentialite" className="hover:text-golden transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-white/50 text-sm">
            <p>© 2025 NECTFORMA. Tous droits réservés.</p>
            <p className="mt-2 md:mt-0">Made with ❤️ for formation professionals</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default ContactFooterSection;
