import { supabase } from '@/integrations/supabase/client';

/**
 * Script pour régénérer les URLs publiques de tous les fichiers du coffre-fort
 * À exécuter une seule fois après la migration du bucket vers public
 */
export async function regenerateCoffreFortUrls() {
  try {
    console.log('🔄 Début de la régénération des URLs...');
    
    // Récupérer tous les fichiers
    const { data: files, error: fetchError } = await supabase
      .from('digital_safe_files')
      .select('id, file_path');

    if (fetchError) {
      throw new Error(`Erreur récupération fichiers: ${fetchError.message}`);
    }

    if (!files || files.length === 0) {
      console.log('✅ Aucun fichier à mettre à jour');
      return { success: true, updated: 0 };
    }

    console.log(`📁 ${files.length} fichiers à mettre à jour`);

    let successCount = 0;
    let errorCount = 0;

    // Mettre à jour chaque fichier avec son URL publique
    for (const file of files) {
      try {
        // Générer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('coffre-fort-files')
          .getPublicUrl(file.file_path);

        // Mettre à jour en base
        const { error: updateError } = await supabase
          .from('digital_safe_files')
          .update({ file_url: publicUrl })
          .eq('id', file.id);

        if (updateError) {
          console.error(`❌ Erreur mise à jour ${file.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Fichier mis à jour: ${file.id}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Erreur traitement ${file.id}:`, err);
        errorCount++;
      }
    }

    console.log(`\n📊 Résultats:`);
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📁 Total: ${files.length}`);

    return {
      success: errorCount === 0,
      updated: successCount,
      errors: errorCount,
      total: files.length
    };

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    throw error;
  }
}

// Fonction pour exécuter depuis la console du navigateur
if (typeof window !== 'undefined') {
  (window as any).regenerateCoffreFortUrls = regenerateCoffreFortUrls;
}
