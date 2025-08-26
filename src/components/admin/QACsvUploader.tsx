import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { parse } from 'papaparse';
import type { KnowledgeUnit } from './types';

interface QACsvUploaderProps {
  onUploadComplete: () => void;
}

interface QAItem {
  question: string;
  answer: string;
}

async function parseCSV(file: File): Promise<QAItem[]> {
  return new Promise((resolve, reject) => {
    parse(file, {
      header: true,
      encoding: 'UTF-8',
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors.map(error => error.message).join('\n')));
        } else {
          const typedData = results.data as QAItem[];
          resolve(typedData);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export default function QACsvUploader({ onUploadComplete }: QACsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: '未选择文件', description: '请选择要上传的 CSV 文件。', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    
    try {
      const questions = await parseCSV(file);
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        
        const knowledgeUnits = batch.map(q => ({
          content: q.question,
          entities: { question: q.question, answer: q.answer },
          source_name: file.name,
          data_type: 'qa' as const,
          category: 'experience_guide' as const,
          importance: 'medium' as const,
          updated_at: new Date().toISOString(),
          flame_points: 3,
          review_status: 'approved' as const,
        }));

        const { error } = await supabase
          .from('knowledge_units')
          .insert(knowledgeUnits);

        if (error) {
          console.error('批量插入知识单元失败:', error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      toast({
        title: '上传处理完成',
        description: `成功导入 ${successCount} 个问答，失败 ${errorCount} 个。`,
      });
      onUploadComplete();
      setFile(null);
      const fileInput = document.getElementById('csv-upload-input') as HTMLInputElement;
      if(fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('CSV 解析失败:', error);
      toast({
        title: "上传失败",
        description: error.message || '文件格式不正确，请确保文件为 UTF-8 编码的 CSV 格式',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV 问答知识上传</CardTitle>
        <CardDescription>
          从此上传包含问答对的CSV文件，系统将直接将其作为知识单元存入数据库并向量化。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            请上传 UTF-8 编码的 CSV 文件，确保包含 "question" 和 "answer" 两列。
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input id="csv-upload-input" type="file" accept=".csv" onChange={handleFileChange} className="max-w-xs"/>
          <Button onClick={handleUpload} disabled={!file || isLoading} className="w-full sm:w-auto">
            {isLoading ? '处理中...' : '上传 CSV 文件'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
