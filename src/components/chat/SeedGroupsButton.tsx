import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedChatGroups } from '@/utils/seedChatGroups';

const SeedGroupsButton = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await seedChatGroups();
      toast({
        title: "Succès",
        description: "Les groupes de test ont été créés avec succès",
      });
      // Reload the page to show new groups
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création des groupes",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button
      onClick={handleSeed}
      disabled={isSeeding}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Database className="h-4 w-4" />
      {isSeeding ? 'Création...' : 'Générer groupes test'}
    </Button>
  );
};

export default SeedGroupsButton;
