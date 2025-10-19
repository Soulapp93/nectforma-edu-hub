import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Loader2 } from 'lucide-react';
import { seedTestUsers } from '@/utils/seedUsers';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SeedUsersButtonProps {
  onUsersCreated?: () => void;
}

export const SeedUsersButton = ({ onUsersCreated }: SeedUsersButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleSeedUsers = async () => {
    setLoading(true);
    try {
      const users = await seedTestUsers();
      toast.success(`${users.length} utilisateurs de test créés avec succès`);
      onUsersCreated?.();
    } catch (error) {
      toast.error('Erreur lors de la création des utilisateurs de test');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Générer utilisateurs de test
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Créer des utilisateurs de test ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va créer 16 utilisateurs fictifs pour tester les fonctionnalités :
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>2 Administrateurs</li>
              <li>4 Formateurs</li>
              <li>10 Étudiants</li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              Les utilisateurs seront créés avec différents statuts (Actif, En attente, Inactif).
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleSeedUsers}>
            Créer les utilisateurs
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
