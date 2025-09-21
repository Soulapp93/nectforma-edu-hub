import React, { useState } from 'react';
import { useUserSchedules } from '@/hooks/useUserSchedules';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ModernScheduleView } from '@/components/schedule/ModernScheduleView';

const EmploiTemps = () => {
  const { schedules, loading, error } = useUserSchedules();
  const { userId, userRole, loading: userLoading } = useCurrentUser();

  if (userLoading || loading) {
    return (
      <div className="min-h-screen nect-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium animate-pulse">Chargement de votre emploi du temps...</p>
          <p className="text-white/70 text-sm mt-2">Préparation de l'interface moderne</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen nect-gradient flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">⚠️</span>
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-white/80 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ModernScheduleView 
      schedules={schedules} 
      userRole={userRole}
      userId={userId}
    />
  );
};

export default EmploiTemps;