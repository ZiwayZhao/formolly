
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { KnowledgeUnit } from "./types";
import KnowledgeUnitList from "./KnowledgeUnitList";
import QACsvUploader from "./QACsvUploader";

interface KnowledgeManagementProps {
  units: KnowledgeUnit[];
  setUnits: React.Dispatch<React.SetStateAction<KnowledgeUnit[]>>;
  loadKnowledgeUnits: () => Promise<void>;
}

export default function KnowledgeManagement({
  units,
  setUnits,
  loadKnowledgeUnits
}: KnowledgeManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUnits = units.filter(unit => {
    if (!searchTerm.trim()) return true;
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

    const searchableStrings = [
      unit.content,
      ...(unit.labels || []),
      ...(unit.keywords || []),
      ...(unit.school_names || []),
      ...(unit.major_names || []),
      unit.source_name,
      unit.category,
    ];

    if (searchableStrings.some(s => s && String(s).toLowerCase().includes(lowerCaseSearchTerm))) {
      return true;
    }

    if (unit.entities) {
      try {
        if (JSON.stringify(unit.entities).toLowerCase().includes(lowerCaseSearchTerm)) {
          return true;
        }
      } catch (e) { /* ignore */ }
    }

    return false;
  });

  return (
    <div className="space-y-6">
      <QACsvUploader onUploadComplete={loadKnowledgeUnits} />
      
      <section>
        <div className="font-semibold mb-4 text-lg flex items-center justify-between flex-wrap gap-4">
          <span className="flex items-center gap-2">
            知识单元库
            <span className="text-xs text-muted-foreground font-normal">
              （共{units.length}条, 显示{filteredUnits.length}条）
            </span>
          </span>
          <div className="flex items-center gap-2 flex-1" style={{minWidth: '300px', maxWidth: '600px'}}>
             <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="按名称、标签、专业等搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadKnowledgeUnits}
            >
              刷新
            </Button>
          </div>
        </div>
        
        <KnowledgeUnitList 
          units={filteredUnits} 
          setUnits={setUnits}
          totalUnitCount={units.length}
        />
      </section>
    </div>
  );
}
