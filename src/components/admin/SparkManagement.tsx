
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Flame, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AcademicSpark, CareerSpark } from "./types";
import AcademicSparkList from "./AcademicSparkList";
import CareerSparkList from "./CareerSparkList";
import SparkConnectionManager from "./SparkConnectionManager";

interface SparkManagementProps {
  academicSparks: AcademicSpark[];
  careerSparks: CareerSpark[];
  setAcademicSparks: React.Dispatch<React.SetStateAction<AcademicSpark[]>>;
  setCareerSparks: React.Dispatch<React.SetStateAction<CareerSpark[]>>;
  loadAcademicSparks: () => Promise<void>;
  loadCareerSparks: () => Promise<void>;
}

export default function SparkManagement({
  academicSparks,
  careerSparks,
  setAcademicSparks,
  setCareerSparks,
  loadAcademicSparks,
  loadCareerSparks
}: SparkManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("academic");

  const filteredAcademicSparks = academicSparks.filter(spark => {
    if (!searchTerm.trim()) return true;
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    
    return (
      spark.school_name.toLowerCase().includes(lowerCaseSearchTerm) ||
      spark.major_name.toLowerCase().includes(lowerCaseSearchTerm) ||
      spark.spark_number.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const filteredCareerSparks = careerSparks.filter(spark => {
    if (!searchTerm.trim()) return true;
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    
    return (
      spark.job_title.toLowerCase().includes(lowerCaseSearchTerm) ||
      (spark.location && spark.location.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (spark.industry && spark.industry.toLowerCase().includes(lowerCaseSearchTerm)) ||
      spark.spark_number.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const pendingAcademicCount = academicSparks.filter(s => s.status === 'pending').length;
  const pendingCareerCount = careerSparks.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            火种知识图谱管理
          </CardTitle>
          <CardDescription>
            管理学术火种（学校-专业）和职业火种（工作-行业），构建知识连接网络
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">学术火种</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{academicSparks.length}</div>
                <p className="text-xs text-muted-foreground">
                  待审核: <Badge variant={pendingAcademicCount > 0 ? "destructive" : "secondary"}>
                    {pendingAcademicCount}
                  </Badge>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">职业火种</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{careerSparks.length}</div>
                <p className="text-xs text-muted-foreground">
                  待审核: <Badge variant={pendingCareerCount > 0 ? "destructive" : "secondary"}>
                    {pendingCareerCount}
                  </Badge>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">火种连接</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  学术 ↔ 职业关联
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索火种..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={activeTab === 'academic' ? loadAcademicSparks : loadCareerSparks} variant="outline">
              刷新
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="academic">学术火种</TabsTrigger>
              <TabsTrigger value="career">职业火种</TabsTrigger>
              <TabsTrigger value="connections">火种连接</TabsTrigger>
            </TabsList>
            
            <TabsContent value="academic" className="mt-4">
              <AcademicSparkList 
                sparks={filteredAcademicSparks}
                setSparks={setAcademicSparks}
                totalSparkCount={academicSparks.length}
              />
            </TabsContent>
            
            <TabsContent value="career" className="mt-4">
              <CareerSparkList 
                sparks={filteredCareerSparks}
                setSparks={setCareerSparks}
                totalSparkCount={careerSparks.length}
              />
            </TabsContent>
            
            <TabsContent value="connections" className="mt-4">
              <SparkConnectionManager 
                academicSparks={academicSparks}
                careerSparks={careerSparks}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
