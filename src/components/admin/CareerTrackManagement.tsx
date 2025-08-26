
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CareerTrack } from "./types";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CareerTrackEditor from "./CareerTrackEditor";
import { Badge } from "@/components/ui/badge";

interface CareerTrackManagementProps {
  careerTracks: CareerTrack[];
  setCareerTracks: React.Dispatch<React.SetStateAction<CareerTrack[]>>;
  loadCareerTracks: () => Promise<void>;
}

export default function CareerTrackManagement({
  careerTracks,
  setCareerTracks,
  loadCareerTracks,
}: CareerTrackManagementProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<CareerTrack | null>(null);
  const { toast } = useToast();

  const attributeNameMap: { [key: string]: string } = {
    experience_years: '经验',
    salary_range: '薪资',
    school_background: '毕业院校',
    education_background: '专业',
    required_skills: '必备技能',
    personality_fit: '性格要求',
    recommendations: '建议',
  };

  async function handleDeleteCareerTrack(id: string) {
    const { error } = await supabase
      .from('career_sparks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
      return;
    }
    setCareerTracks(prev => prev.filter(track => track.id !== id));
    toast({ title: "删除成功", description: "求职路径已删除" });
  }

  async function handleUpdateCareerTrackStatus(id: string, status: CareerTrack['status']) {
     const { data, error } = await supabase
      .from('career_sparks')
      .update({ status })
      .eq('id', id)
      .select('*, career_spark_attributes(*)')
      .single();

    if (error) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
      return;
    }
     // 使用类型断言来处理数据库返回的数据
     setCareerTracks(prev => prev.map(track => track.id === id ? (data as CareerTrack) : track));
     toast({ title: "状态更新成功" });
  }

  const handleEditClick = (track: CareerTrack) => {
    setSelectedTrack(track);
    setIsEditorOpen(true);
  };

  const handleAddClick = () => {
    setSelectedTrack(null);
    setIsEditorOpen(true);
  };
  
  const onSave = () => {
      setIsEditorOpen(false);
      setSelectedTrack(null);
      loadCareerTracks();
  }

  return (
    <>
      <Separator />
      <section>
        <div className="font-semibold mb-4 text-lg flex items-center justify-between">
          <span>求职路径火种管理</span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAddClick} className="flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" />
                新增火种
            </Button>
            <Button variant="outline" size="sm" onClick={loadCareerTracks}>刷新</Button>
          </div>
        </div>
        <ul className="flex flex-col gap-4">
          {careerTracks.map((track) => (
            <li key={track.id} className="rounded-md p-4 bg-accent border space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-base">{track.job_title}</p>
                   {(track.industry || track.location) && 
                    <p className="text-sm text-muted-foreground">{[track.industry, track.location].filter(Boolean).join(' - ')}</p>
                  }
                  <p className="text-sm text-muted-foreground">火种编号: {track.spark_number}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                   <Select value={track.status} onValueChange={(newStatus) => handleUpdateCareerTrackStatus(track.id, newStatus as CareerTrack['status'])}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="设置状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">待审核</SelectItem>
                        <SelectItem value="approved">已批准</SelectItem>
                        <SelectItem value="rejected">已拒绝</SelectItem>
                      </SelectContent>
                    </Select>
                  <Button size="icon" variant="ghost" onClick={() => handleEditClick(track)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteCareerTrack(track.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {track.career_spark_attributes && track.career_spark_attributes.length > 0 && (
                <>
                  <div className="border-t border-dashed -mx-4"></div>
                  <div className="space-y-2 text-sm">
                    {track.career_spark_attributes.map(attr => (
                      <div key={attr.id} className="flex items-baseline gap-2 group">
                        <span className="font-medium text-muted-foreground flex-shrink-0 w-24">
                          {attributeNameMap[attr.attribute_type] || attr.attribute_type}
                          {attr.year && ` (${attr.year})`}: 
                        </span>
                        <span className="whitespace-pre-wrap flex-1">{attr.attribute_value}</span>
                        <Badge variant={attr.status === 'approved' ? 'default' : 'secondary'} className="self-center">{attr.status}</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
               <div className="text-xs text-muted-foreground pt-2 border-t border-dashed">
                <span>提交于: {new Date(track.created_at).toLocaleString()}</span>
              </div>
            </li>
          ))}
          {careerTracks.length === 0 && (
            <li className="p-8 text-center text-muted-foreground">
              暂无求职路径数据
            </li>
          )}
        </ul>
      </section>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTrack ? "编辑求职路径" : "新增求职路径"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <CareerTrackEditor 
              track={selectedTrack}
              onSave={onSave}
              onCancel={() => setIsEditorOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
