
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { SourceDocument } from "./types";

interface DocumentItemProps {
  doc: SourceDocument;
  onReprocess: (doc: SourceDocument) => void;
  onViewDocument: (doc: SourceDocument) => void;
  onDelete: (doc: SourceDocument) => void;
  deletingDocumentId: string | null;
}

export default function DocumentItem({ 
  doc, 
  onReprocess, 
  onViewDocument, 
  onDelete, 
  deletingDocumentId 
}: DocumentItemProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { text: '等待处理', variant: 'outline' as const },
      'processing': { text: '处理中', variant: 'default' as const },
      'completed': { text: '已完成', variant: 'secondary' as const },
      'failed': { text: '处理失败', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.text}
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium">{doc.filename}</div>
          <div className="text-sm text-muted-foreground">
            {doc.file_type} · {(doc.file_size / 1024).toFixed(1)}KB
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            上传时间: {new Date(doc.created_at).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReprocess(doc)}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            重新处理
          </Button>
          
          {doc.processing_status === 'completed' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onViewDocument(doc)}
              className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700"
              disabled={!doc.extracted_text || !doc.extracted_text.trim()}
            >
              <Eye className="w-4 h-4" />
              知识管理
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={deletingDocumentId === doc.id}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除文档</AlertDialogTitle>
                <AlertDialogDescription>
                  您确定要删除文档 "{doc.filename}" 吗？此操作无法撤销，将同时删除文件和所有相关数据。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(doc)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {getStatusBadge(doc.processing_status)}
        </div>
      </div>
    </div>
  );
}
