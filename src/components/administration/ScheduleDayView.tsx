import React from 'react';
import { Clock, MapPin, User, Calendar, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleSlot } from '@/services/scheduleService';
import SlotActionMenu from './SlotActionMenu';

interface ScheduleDayViewProps {
  selectedDate: Date;
  slots: ScheduleSlot[];
  onEditSlot?: (slot: ScheduleSlot) => void;
  onDuplicateSlot?: (slot: ScheduleSlot) => void;
  onDeleteSlot?: (slot: ScheduleSlot) => void;
}

export const ScheduleDayView: React.FC<ScheduleDayViewProps> = ({ 
  selectedDate, 
  slots, 
  onEditSlot,
  onDuplicateSlot,
  onDeleteSlot
}) => {
  const daySlots = slots.filter(slot => 
    new Date(slot.date).toDateString() === selectedDate.toDateString()
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Convertir le temps en minutes depuis minuit (supporte HH:MM et HH:MM:SS)
  const timeToMinutes = (time: string): number => {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    // Ignore les secondes si présentes
    return hours * 60 + minutes;
  };

  // Calculer la durée d'un créneau en format lisible
  const formatDuration = (slot: ScheduleSlot): string => {
    const startMinutes = timeToMinutes(slot.start_time);
    const endMinutes = timeToMinutes(slot.end_time);
    const durationMinutes = endMinutes - startMinutes;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  };

  // Plage horaire étendue: 7h à 22h (au lieu de 8h-20h)
  const START_HOUR = 7;
  const END_HOUR = 22;
  
  // Générer les créneaux horaires
  const timeSlots = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => {
      const hour = START_HOUR + i;
      return `${hour.toString().padStart(2, '0')}:00`;
    }
  );

  // Détecter les chevauchements entre créneaux
  const detectOverlaps = (slots: ScheduleSlot[]) => {
    const overlapMap = new Map<string, { column: number; totalColumns: number }>();
    const sortedSlots = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    const columns: ScheduleSlot[][] = [];
    
    sortedSlots.forEach(slot => {
      const slotStart = timeToMinutes(slot.start_time);
      const slotEnd = timeToMinutes(slot.end_time);
      
      // Trouver une colonne libre pour ce slot
      let placedInColumn = -1;
      for (let i = 0; i < columns.length; i++) {
        const columnSlots = columns[i];
        const hasOverlap = columnSlots.some(existingSlot => {
          const existingStart = timeToMinutes(existingSlot.start_time);
          const existingEnd = timeToMinutes(existingSlot.end_time);
          return slotStart < existingEnd && slotEnd > existingStart;
        });
        
        if (!hasOverlap) {
          columns[i].push(slot);
          placedInColumn = i;
          break;
        }
      }
      
      // Si aucune colonne libre, créer une nouvelle colonne
      if (placedInColumn === -1) {
        columns.push([slot]);
        placedInColumn = columns.length - 1;
      }
      
      // Calculer le nombre total de colonnes nécessaires pour ce slot
      const totalColumns = columns.filter(col => 
        col.some(s => {
          const sStart = timeToMinutes(s.start_time);
          const sEnd = timeToMinutes(s.end_time);
          return slotStart < sEnd && slotEnd > sStart;
        })
      ).length;
      
      overlapMap.set(slot.id, { column: placedInColumn, totalColumns });
    });
    
    return overlapMap;
  };

  const overlapMap = detectOverlaps(daySlots);

  // Calculer la position et hauteur d'un créneau
  const getSlotPosition = (slot: ScheduleSlot) => {
    const startMinutes = timeToMinutes(slot.start_time);
    const endMinutes = timeToMinutes(slot.end_time);
    const baseMinutes = START_HOUR * 60; // Début de la journée à 7h
    
    const HOUR_HEIGHT = 80; // Hauteur d'une heure en pixels
    
    // Limiter l'affichage à la plage horaire visible
    const visibleStartMinutes = Math.max(startMinutes, baseMinutes);
    const visibleEndMinutes = Math.min(endMinutes, END_HOUR * 60);
    
    const top = ((visibleStartMinutes - baseMinutes) / 60) * HOUR_HEIGHT;
    const height = ((visibleEndMinutes - visibleStartMinutes) / 60) * HOUR_HEIGHT;
    
    // Log pour déboggage
    if (startMinutes < baseMinutes || endMinutes > END_HOUR * 60) {
      console.log(`Cours partiellement hors grille: ${slot.start_time}-${slot.end_time}`, slot);
    }
    
    return { top, height: Math.max(height, 60) }; // Hauteur minimum 60px
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <Card className="mb-8 border-0 shadow-xl overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/5 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                <Calendar className="h-7 w-7 text-white relative z-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-muted-foreground font-medium mt-1">
                  {daySlots.length} créneau{daySlots.length > 1 ? 'x' : ''} programmé{daySlots.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Layout principal: Timeline (66%) + Liste (33%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline - 2/3 de l'espace */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Planning de la journée
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex">
                {/* Colonne des heures */}
                <div className="flex-shrink-0 w-16 pt-2 bg-muted/20 rounded-l-lg">
                  {timeSlots.map((time) => (
                    <div key={time} className="h-20 flex items-start justify-end pr-3">
                      <span className="text-sm text-muted-foreground font-semibold">{time}</span>
                    </div>
                  ))}
                </div>
                
                {/* Zone des cours */}
                <div className="flex-1 relative border-l-2 border-border/50">
                  {/* Lignes de grille horizontales */}
                  {timeSlots.map((time, index) => (
                    <div 
                      key={time} 
                      className="h-20 border-b border-border/20"
                      style={{ position: 'relative' }}
                    />
                  ))}
                  
                  {/* Créneaux de cours positionnés absolument avec gestion des chevauchements */}
                  {daySlots.map((slot, index) => {
                    const { top, height } = getSlotPosition(slot);
                    const duration = formatDuration(slot);
                    const durationMinutes = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
                    
                    // Récupérer les infos de chevauchement
                    const overlapInfo = overlapMap.get(slot.id);
                    const column = overlapInfo?.column ?? 0;
                    const totalColumns = overlapInfo?.totalColumns ?? 1;
                    
                    // Calculer la largeur et la position en fonction des chevauchements
                    const widthPercent = 100 / totalColumns;
                    const leftPercent = (column * 100) / totalColumns;
                    
                    return (
                      <div
                        key={slot.id || index}
                        className="absolute rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group"
                        style={{ 
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `calc(${leftPercent}% + 12px)`,
                          width: `calc(${widthPercent}% - ${totalColumns > 1 ? '16px' : '24px'})`,
                          backgroundColor: slot.color || '#3B82F6',
                          minHeight: '60px'
                        }}
                        onClick={() => onEditSlot?.(slot)}
                      >
                        {/* Effet de brillance au survol */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="h-full p-4 flex flex-col text-white relative z-10">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-base leading-tight flex-1">
                              {slot.formation_modules?.title || 'Module'}
                            </h4>
                            {onEditSlot && onDuplicateSlot && onDeleteSlot && (
                              <SlotActionMenu 
                                slot={slot}
                                onEdit={onEditSlot}
                                onDuplicate={onDuplicateSlot}
                                onDelete={onDeleteSlot}
                              />
                            )}
                          </div>
                          
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center text-white/95 font-medium">
                              <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                              <span>{slot.start_time} - {slot.end_time}</span>
                              <Badge className="ml-2 bg-white/20 text-white border-0 text-xs">
                                {duration}
                              </Badge>
                            </div>
                            
                            {slot.room && durationMinutes >= 60 && (
                              <div className="flex items-center text-white/90">
                                <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                                <span>{slot.room}</span>
                              </div>
                            )}
                            
                            {slot.users && durationMinutes >= 90 && (
                              <div className="flex items-center text-white/90">
                                <User className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                                <span>{slot.users.first_name} {slot.users.last_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des cours - 1/3 de l'espace */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg sticky top-6">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                  <List className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Liste des cours
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {daySlots.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Aucun cours programmé
                </p>
              ) : (
                daySlots.map((slot, index) => (
                  <Card 
                    key={slot.id || index}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
                    style={{ borderLeftColor: slot.color || '#3B82F6' }}
                    onClick={() => onEditSlot?.(slot)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: slot.color || '#3B82F6' }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm text-foreground leading-tight mb-1 truncate">
                            {slot.formation_modules?.title || 'Module'}
                          </h5>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </div>
                          {slot.room && (
                            <div className="flex items-center text-xs text-muted-foreground mb-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{slot.room}</span>
                            </div>
                          )}
                          {slot.users && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <User className="h-3 w-3 mr-1" />
                              <span className="truncate">{slot.users.first_name} {slot.users.last_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};