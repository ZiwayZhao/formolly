
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { KnowledgeUnit } from "@/components/admin/types";

interface UseRealtimeSubscriptionsProps {
  setUnits: React.Dispatch<React.SetStateAction<KnowledgeUnit[]>>;
}

export function useRealtimeSubscriptions({ setUnits }: UseRealtimeSubscriptionsProps) {
  useEffect(() => {
    const knowledgeChannel = supabase
      .channel('public:knowledge_units')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'knowledge_units' },
        (payload) => {
          console.log('知识单元实时更新:', payload);
          if (payload.eventType === 'UPDATE') {
            const updatedUnit = payload.new as KnowledgeUnit;
            setUnits(currentUnits =>
              currentUnits.map(unit =>
                unit.id === updatedUnit.id ? { ...unit, ...updatedUnit } : unit
              )
            );
          } else if (payload.eventType === 'INSERT') {
            const newUnit = payload.new as KnowledgeUnit;
            setUnits(currentUnits => [newUnit, ...currentUnits]);
          } else if (payload.eventType === 'DELETE') {
            const oldUnitId = (payload.old as any).id;
            setUnits(currentUnits => currentUnits.filter(unit => unit.id !== oldUnitId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(knowledgeChannel);
    };
  }, [setUnits]);
}
