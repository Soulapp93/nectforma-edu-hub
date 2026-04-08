import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const DocStatCard = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border">
    <div className="text-primary">{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export const TocItem = ({ number, title, roles }: { number: string; title: string; roles?: string[] }) => (
  <div className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
    <Badge variant="outline" className="flex-shrink-0">{number}</Badge>
    <span className="text-sm font-medium">{title}</span>
    {roles && (
      <div className="ml-auto flex gap-1">
        {roles.includes('admin') && <Badge variant="destructive" className="text-[10px] px-1">Admin</Badge>}
        {roles.includes('tuteur') && <Badge variant="secondary" className="text-[10px] px-1">Tuteur</Badge>}
      </div>
    )}
  </div>
);

interface DocSectionWrapperProps {
  id: string;
  number: string;
  title: string;
  description: string;
  roles: string[];
  activeRole: string;
  children: React.ReactNode;
}

export const DocSectionWrapper = ({ id, number, title, description, roles, activeRole, children }: DocSectionWrapperProps) => {
  const isVisible = activeRole === 'all' || roles.includes('all') || roles.includes(activeRole);
  if (!isVisible) return null;

  return (
    <section id={id} className="scroll-mt-32 pdf-section">
      <div className="flex items-start gap-4 mb-6">
        <Badge variant="outline" className="text-lg px-3 py-1 flex-shrink-0">{number}</Badge>
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
};

export const ProcessFlow = ({ steps }: { steps: { icon: React.ReactNode; title: string; description: string }[] }) => (
  <div className="flex flex-wrap items-center justify-center gap-2 p-4 bg-muted/30 rounded-xl">
    {steps.map((step, index) => (
      <React.Fragment key={index}>
        <div className="flex flex-col items-center text-center p-3 min-w-[100px]">
          <div className="p-2 rounded-full bg-primary/10 text-primary mb-2">
            {step.icon}
          </div>
          <span className="text-xs font-semibold">{step.title}</span>
          <span className="text-[10px] text-muted-foreground mt-1">{step.description}</span>
        </div>
        {index < steps.length - 1 && (
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 hidden md:block" />
        )}
      </React.Fragment>
    ))}
  </div>
);

export const InfoCard = ({ title, items }: { title: string; items: string[] }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export const TipCard = ({ type, children }: { type: 'info' | 'warning' | 'success'; children: React.ReactNode }) => {
  const colors = {
    info: 'border-primary/30 bg-primary/5 text-foreground',
    warning: 'border-accent/30 bg-accent/5 text-foreground',
    success: 'border-green-500/30 bg-green-500/5 text-foreground',
  };
  return (
    <div className={`p-4 rounded-lg border ${colors[type]}`}>
      <p className="text-sm">{children}</p>
    </div>
  );
};

export const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <Card className="text-center">
    <CardContent className="pt-6">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <h4 className="font-semibold text-sm">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

export const ScreenshotCard = ({ src, alt, caption }: { src: string; alt: string; caption: string }) => (
  <div className="space-y-2">
    <div className="rounded-xl overflow-hidden border shadow-lg">
      <img src={src} alt={alt} className="w-full h-auto" loading="lazy" />
    </div>
    <p className="text-xs text-center text-muted-foreground">{caption}</p>
  </div>
);

export const RoleCard = ({ role, description, color }: { role: string; description: string; color: 'default' | 'secondary' | 'destructive' | 'outline' }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
    <Badge variant={color}>{role}</Badge>
    <span className="text-sm text-muted-foreground">{description}</span>
  </div>
);
