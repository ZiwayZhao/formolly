
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { File, CheckCircle, AlertCircle } from 'lucide-react';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface UploadedFile {
  id: string;
  name: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface UploadProgressProps {
  files: UploadedFile[];
}

export default function UploadProgress({ files }: UploadProgressProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-700">上传进度</h4>
      {files.map((file) => (
        <div key={file.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {file.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : file.status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <File className="w-5 h-5 text-blue-500" />
              )}
              <span className="font-medium">{file.name}</span>
            </div>
            <span className="text-sm text-gray-500">
              {file.status === 'uploading' && '上传中...'}
              {file.status === 'processing' && '提取内容并智能命名中...'}
              {file.status === 'completed' && '已完成'}
              {file.status === 'error' && '处理失败'}
            </span>
          </div>
          
          {file.status !== 'completed' && file.status !== 'error' && (
            <Progress value={file.progress} className="mb-2" />
          )}
          
          {file.error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{file.error}</AlertDescription>
            </Alert>
          )}
        </div>
      ))}
    </div>
  );
}
