
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Link, School, Briefcase, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AcademicSpark, CareerSpark, SparkConnection } from "./types";

interface SparkConnectionManagerProps {
  academicSparks: AcademicSpark[];
  careerSparks: CareerSpark[];
}

export default function SparkConnectionManager({ academicSparks, careerSparks }: SparkConnectionManagerProps) {
  const [connections, setConnections] = useState<SparkConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('spark_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // 类型安全的连接数据处理
      const typedConnections: SparkConnection[] = (data || []).map(item => ({
        id: item.id,
        academic_spark_id: item.academic_spark_id,
        career_spark_id: item.career_spark_id,
        connection_strength: item.connection_strength,
        connection_type: item.connection_type as 'direct' | 'related' | 'potential',
        created_at: item.created_at,
      }));
      
      setConnections(typedConnections);
    } catch (error: any) {
      console.error('加载火种连接失败:', error);
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const getAcademicSparkName = (sparkId: string) => {
    const spark = academicSparks.find(s => s.id === sparkId);
    return spark ? `${spark.school_name} - ${spark.major_name}` : '未知学术火种';
  };

  const getCareerSparkName = (sparkId: string) => {
    const spark = careerSparks.find(s => s.id === sparkId);
    return spark ? `${spark.job_title}${spark.location ? ` (${spark.location})` : ''}` : '未知职业火种';
  };

  const getConnectionTypeBadge = (type: string) => {
    switch (type) {
      case 'direct':
        return <Badge variant="default">直接关联</Badge>;
      case 'related':
        return <Badge variant="secondary">相关联</Badge>;
      case 'potential':
        return <Badge variant="outline">潜在关联</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'text-green-600';
    if (strength >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载火种连接中...</p>
        </CardContent>
      </Card>
    );
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">暂无火种连接</h3>
          <p className="text-muted-foreground mb-4">
            还没有建立学术火种与职业火种之间的关联。这些连接将帮助AI更好地为用户提供升学就业建议。
          </p>
          <Button onClick={loadConnections} variant="outline">
            刷新
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          共 {connections.length} 个火种连接
        </h3>
        <Button onClick={loadConnections} variant="outline" size="sm">
          刷新
        </Button>
      </div>

      <div className="grid gap-4">
        {connections.map((connection) => (
          <Card key={connection.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <School className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    {getAcademicSparkName(connection.academic_spark_id)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  {getConnectionTypeBadge(connection.connection_type)}
                  <span className={`text-sm font-medium ${getStrengthColor(connection.connection_strength)}`}>
                    {Math.round(connection.connection_strength * 100)}%
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">
                    {getCareerSparkName(connection.career_spark_id)}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                创建时间: {new Date(connection.created_at).toLocaleString('zh-CN')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
