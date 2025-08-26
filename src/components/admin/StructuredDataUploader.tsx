import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import type { KnowledgeUnit } from './types';

interface StructuredDataUploaderProps {
  onUploadComplete: () => void;
}

export default function StructuredDataUploader({ onUploadComplete }: StructuredDataUploaderProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({ title: '未选择文件', description: '请选择要上传的JSON文件。', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      if (file.type !== 'application/json') {
        toast({ title: '文件类型错误', description: `文件 ${file.name} 不是JSON格式，已跳过。`, variant: 'destructive' });
        errorCount++;
        continue;
      }

      try {
        const fileContent = await file.text();
        const jsonData = JSON.parse(fileContent);
        
        const unitsToInsert = (Array.isArray(jsonData) ? jsonData : [jsonData]).map(item => ({
          content: String(item['项目名称'] || item['question'] || file.name.replace('.json', '')),
          entities: item,
          source_name: file.name,
          data_type: item['question'] ? 'qa' : 'json_object',
          category: 'school_info' as const,
          importance: 'medium' as const,
          updated_at: new Date().toISOString(),
          flame_points: 3,
          review_status: 'approved' as const,
        }));

        const { error } = await supabase.from('knowledge_units').insert(unitsToInsert);

        if (error) {
          throw error;
        }
        successCount += unitsToInsert.length;
      } catch (error: any) {
        errorCount++;
        toast({
          title: `文件 ${file.name} 处理失败`,
          description: error.message,
          variant: 'destructive'
        });
      }
    }

    setIsProcessing(false);
    toast({
      title: '上传处理完成',
      description: `成功导入 ${successCount} 个知识单元，失败 ${errorCount} 个文件。`
    });
    
    if (successCount > 0) {
      onUploadComplete();
    }
    setFiles(null);
    // 重置 input
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if(fileInput) fileInput.value = '';

  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>结构化知识上传</CardTitle>
        <CardDescription>
          从此上传高质量的JSON文件，系统将直接将其作为知识单元存入数据库并向量化。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            支持上传单个或多个JSON文件。每个文件可以包含一个JSON对象或一个JSON对象数组。
            系统将自动从 "项目名称" 或 "question" 字段提取内容标题。
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input id="file-upload-input" type="file" accept=".json" onChange={handleFileChange} multiple className="max-w-xs"/>
          <Button onClick={handleUpload} disabled={!files || isProcessing} className="w-full sm:w-auto">
            {isProcessing ? '处理中...' : `上传 ${files?.length || 0} 个文件`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
