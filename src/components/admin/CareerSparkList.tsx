
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Briefcase, Calendar, MapPin, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CareerSpark } from "./types";

interface CareerSparkListProps {
  sparks: CareerSpark[];
  setSparks: React.Dispatch<React.SetStateAction<CareerSpark[]>>;
  totalSparkCount: number;
}

export default function CareerSparkList({ sparks, setSparks, totalSparkCount }: CareerSparkListProps) {
  const [expandedSparks, setExpandedSparks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleSpark = (sparkId: string) => {
    const newExpanded = new Set(expandedSparks);
    if (newExpanded.has(sparkId)) {
      newExpanded.delete(sparkId);
    } else {
      newExpanded.add(sparkId);
    }
    setExpandedSparks(newExpanded);
  };

  const updateSparkStatus = async (sparkId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('career_sparks')
        .update({ status })
        .eq('id', sparkId);

      if (error) throw error;

      setSparks(prev => prev.map(spark => 
        spark.id === sparkId ? { ...spark, status } : spark
      ));

      toast({
        title: "状态更新成功",
        description: `火种已${status === 'approved' ? '批准' : '拒绝'}`,
      });
    } catch (error: any) {
      console.error('更新火种状态失败:', error);
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">已批准</Badge>;
      case 'rejected':
        return <Badge variant="destructive">已拒绝</Badge>;
      case 'pending':
        return <Badge variant="secondary">待审核</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (sparks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">暂无职业火种</h3>
          <p className="text-muted-foreground">
            还没有职业火种数据。火种包含工作岗位的详细要求和发展信息。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          显示 {sparks.length} / {totalSparkCount} 个职业火种
        </h3>
      </div>
      
      {sparks.map((spark) => (
        <Card key={spark.id} className="overflow-hidden">
          <Collapsible 
            open={expandedSparks.has(spark.id)}
            onOpenChange={() => toggleSpark(spark.id)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSparks.has(spark.id) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <Briefcase className="h-5 w-5 text-purple-500" />
                    <div>
                      <CardTitle className="text-base">
                        {spark.job_title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {spark.spark_number}
                        </span>
                        {spark.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {spark.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {spark.flame_points} 火苗
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(spark.status)}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">行业：</span>
                      {spark.industry || '未指定'}
                    </div>
                    <div>
                      <span className="font-medium">创建时间：</span>
                      {new Date(spark.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>

                  {spark.career_spark_attributes && spark.career_spark_attributes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">火种属性：</h4>
                      <div className="grid gap-2">
                        {spark.career_spark_attributes.map((attr) => (
                          <div key={attr.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <span className="font-medium">{attr.attribute_type}:</span>
                              <span className="ml-2">{attr.attribute_value}</span>
                              {attr.year && <span className="text-xs text-muted-foreground ml-2">({attr.year}年)</span>}
                            </div>
                            <Badge variant="outline" className={`text-xs ${
                              attr.confidence_level === 'high' ? 'border-green-500 text-green-700' :
                              attr.confidence_level === 'medium' ? 'border-yellow-500 text-yellow-700' :
                              'border-red-500 text-red-700'
                            }`}>
                              {attr.confidence_level}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {spark.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        size="sm" 
                        onClick={() => updateSparkStatus(spark.id, 'approved')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        批准
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateSparkStatus(spark.id, 'rejected')}
                      >
                        拒绝
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
