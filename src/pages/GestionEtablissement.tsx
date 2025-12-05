import React, { useState, useEffect } from 'react';
import EstablishmentSettings from '../components/compte/EstablishmentSettings';
import { toast } from 'sonner';
import { establishmentService, Establishment } from '@/services/establishmentService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';

type EstablishmentDataState = {
  name: string;
  phone: string;
  website: string;
  address: string;
  type: string;
  director: string;
  siret: string;
  numberOfUsers: number;
  logoUrl?: string;
};

const GestionEtablissement = () => {
  const { userId, userRole } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    personalAddress: ''
  });

  const [establishmentData, setEstablishmentData] = useState<EstablishmentDataState>({
    name: '',
    phone: '',
    website: '',
    address: '',
    type: '',
    director: '',
    siret: '',
    numberOfUsers: 0
  });

  // Charger les données de l'établissement depuis Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger l'établissement
        const establishment = await establishmentService.getCurrentUserEstablishment();
        
        if (establishment) {
          setEstablishmentId(establishment.id);
          setEstablishmentData({
            name: establishment.name || '',
            phone: establishment.phone || '',
            website: establishment.website || '',
            address: establishment.address || '',
            type: establishment.type || '',
            director: establishment.director || '',
            siret: establishment.siret || '',
            numberOfUsers: 0,
            logoUrl: establishment.logo_url || undefined
          });
        }

        // Charger les infos de l'admin actuel
        if (userId) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (!error && userData) {
            setAdminData({
              firstName: userData.first_name || '',
              lastName: userData.last_name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              role: userData.role || '',
              personalAddress: ''
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId]);

  const handleLogoUpload = async (files: File[]) => {
    if (files.length > 0 && establishmentId) {
      const file = files[0];
      
      try {
        // Upload to Supabase storage
        const fileName = `${establishmentId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('establishment-logos')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          // Si le bucket n'existe pas, créer une URL temporaire
          const logoUrl = URL.createObjectURL(file);
          setEstablishmentData(prev => ({ ...prev, logoUrl }));
          toast.info('Logo mis à jour localement');
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('establishment-logos')
          .getPublicUrl(uploadData.path);

        // Update establishment with logo URL
        await establishmentService.updateEstablishment(establishmentId, {
          logo_url: publicUrl
        });

        setEstablishmentData(prev => ({ ...prev, logoUrl: publicUrl }));
        toast.success('Logo mis à jour avec succès');
      } catch (error) {
        console.error('Erreur upload logo:', error);
        // Fallback to local preview
        const logoUrl = URL.createObjectURL(file);
        setEstablishmentData(prev => ({ ...prev, logoUrl }));
      }
    }
  };

  const handleSaveEstablishment = async () => {
    if (!establishmentId) {
      toast.error('Établissement non trouvé');
      return;
    }

    try {
      // Mettre à jour l'établissement
      await establishmentService.updateEstablishment(establishmentId, {
        name: establishmentData.name,
        phone: establishmentData.phone,
        website: establishmentData.website,
        address: establishmentData.address,
        type: establishmentData.type,
        director: establishmentData.director,
        siret: establishmentData.siret,
      });

      // Mettre à jour les infos admin si nécessaire
      if (userId) {
        await supabase
          .from('users')
          .update({
            first_name: adminData.firstName,
            last_name: adminData.lastName,
            phone: adminData.phone,
          })
          .eq('id', userId);
      }
      
      toast.success('Informations sauvegardées avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des informations');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Vérifier que l'utilisateur est admin
  if (userRole !== 'Admin' && userRole !== 'AdminPrincipal') {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">
          Vous n'avez pas les droits pour accéder à cette page.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion de l'établissement</h1>
        <p className="text-gray-600">Gérez les informations de l'établissement et les paramètres administrateur</p>
      </div>

      <div className="max-w-4xl">
        <EstablishmentSettings
          adminData={adminData}
          establishmentData={establishmentData}
          onAdminDataChange={setAdminData}
          onEstablishmentDataChange={setEstablishmentData}
          onLogoUpload={handleLogoUpload}
          onSave={handleSaveEstablishment}
        />
      </div>
    </div>
  );
};

export default GestionEtablissement;
