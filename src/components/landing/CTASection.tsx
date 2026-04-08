import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import AnimatedSection from '@/components/landing/AnimatedSection';
import AnimatedButton from '@/components/landing/AnimatedButton';

const CTASection: React.FC = () => {
  return (
    <>
      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, hsl(240 60% 18%) 0%, hsl(242 58% 15%) 30%, hsl(245 55% 13%) 60%, hsl(248 55% 16%) 100%)'
        }}>
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        {/* Glow orbs in CTA */}
        <div className="absolute w-[300px] h-[300px] opacity-20 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          top: '-10%', right: '10%', filter: 'blur(50px)'
        }} />
        <div className="absolute w-[200px] h-[200px] opacity-15 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(255,200,0,0.3) 0%, transparent 70%)',
          bottom: '-5%', left: '15%', filter: 'blur(40px)'
        }} />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Prêt à transformer votre gestion ?
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10">
            Rejoignez les établissements d'enseignement supérieur, organismes de formation, CFA et universités qui ont déjà adopté NECTFORMA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/create-establishment" 
              className="group inline-flex items-center px-8 py-4 bg-background text-primary rounded-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all justify-center"
            >
              Créer mon établissement
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/auth" 
              className="inline-flex items-center px-8 py-4 border-2 border-primary-foreground/30 text-primary-foreground rounded-xl hover:bg-primary-foreground/10 font-semibold text-lg transition-all justify-center"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Screenshots Gallery */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 section-soft-bg" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Monitor className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium text-sm">Aperçu de la plateforme</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Découvrez l'interface en <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">images</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une interface intuitive et moderne pour tous vos besoins de gestion
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { img: tableauDeBordImg, label: 'Tableau de bord', span: 'md:col-span-2 md:row-span-2' },
              { img: emargement1Img, label: 'Émargement', span: '' },
              { img: messagerie1Img, label: 'Messagerie', span: '' },
              { img: emploisTempsImg, label: 'Emplois du temps', span: 'md:col-span-2' },
              { img: gestionFormations1Img, label: 'Formations', span: '' },
              { img: groupesImg, label: 'Groupes', span: '' },
              { img: espaceTravailImg, label: 'Espace de travail', span: '' },
              { img: cahiersTextesImg, label: 'Cahiers de texte', span: '' },
            ].map((item, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 80} className={`${item.span}`}>
                <div className="group relative rounded-xl overflow-hidden shadow-lg border border-primary/10 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 cursor-pointer">
                  <img 
                    src={item.img} 
                    alt={item.label} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    <span className="text-white text-sm font-medium">{item.label}</span>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

       <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 section-newsletter-bg" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-up">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Mail className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium text-sm">Newsletter</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Restez informé des <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">dernières actualités</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Recevez nos articles, conseils et actualités sur la formation professionnelle directement dans votre boîte mail.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
                const email = emailInput?.value?.trim();
                if (!email) return;

                try {
                  const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email-brevo`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                      },
                      body: JSON.stringify({
                        to: email,
                        subject: 'Bienvenue dans la newsletter Nectforma !',
                        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:30px;"><div style="display:inline-block;background:linear-gradient(135deg,#1e1e5a,#2a2a70);padding:12px 20px;border-radius:12px;"><span style="color:#d4a017;font-weight:800;font-size:20px;">NF</span></div></div><h1 style="text-align:center;color:#1f2937;font-size:24px;">Bienvenue dans la newsletter Nectforma !</h1><p style="color:#6b7280;text-align:center;font-size:16px;line-height:1.6;">Merci de votre inscription. Vous recevrez désormais nos derniers articles, conseils et actualités sur la formation professionnelle.</p><div style="text-align:center;margin-top:30px;"><a href="https://nectforma.com/blog" style="display:inline-block;background:linear-gradient(135deg,#1e1e5a,#2a2a70);color:#d4a017;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Découvrir nos articles</a></div></div>`,
                      }),
                    }
                  );

                  // Save subscriber via a simple insert
                  const { supabase } = await import('@/integrations/supabase/client');
                  await supabase.from('newsletter_subscribers').upsert(
                    { email, is_active: true },
                    { onConflict: 'email' }
                  );

                  if (response.ok) {
                    toast.success('Inscription réussie ! Vérifiez votre boîte mail.');
                    form.reset();
                  } else {
                    toast.success('Inscription enregistrée !');
                    form.reset();
                  }
                } catch (error) {
                  console.error('Newsletter subscription error:', error);
                  toast.error("Erreur lors de l'inscription. Veuillez réessayer.");
                }
              }}
            >
              <input
                type="email"
                required
                placeholder="votre@email.com"
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl hover:shadow-lg font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Send className="h-4 w-4" />
                S'inscrire
              </button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              En vous inscrivant, vous acceptez de recevoir nos communications. Désabonnement possible à tout moment.
            </p>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
};

export default CTASection;
