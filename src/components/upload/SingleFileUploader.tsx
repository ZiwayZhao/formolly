import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface SingleFileUploaderProps {
  onFilesAdded: (files: File[]) => void | Promise<void>;
  isDragOver: boolean;
  setIsDragOver: (isDragOver: boolean) => void;
  disabled?: boolean;
}

export default function SingleFileUploader({ 
  onFilesAdded, 
  isDragOver, 
  setIsDragOver, 
  disabled 
}: SingleFileUploaderProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesAdded(droppedFiles);
  }, [onFilesAdded, setIsDragOver]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      onFilesAdded(selectedFiles);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver 
          ? 'border-orange-500 bg-orange-50' 
          : 'border-gray-300 hover:border-orange-400'
      } ${disabled ? 'opacity-50' : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        上传知识文档
      </h3>
      <p className="text-gray-500 mb-4">
        支持微信文章HTML、PDF文档、图片文件<br/>
        <span className="text-sm">文档将自动提取内容并根据主要内容智能命名</span>
      </p>
      <Button asChild disabled={disabled}>
        <label>
          选择文件
          <input
            type="file"
            multiple
            accept=".html,.pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </Button>
      <p className="text-xs text-gray-400 mt-2">
        或者直接拖拽文件到这里
      </p>
    </div>
  );
}
