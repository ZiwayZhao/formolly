
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Database } from 'lucide-react';
import { ChatMessage } from '@/hooks/useRAGChat';

interface MessageItemProps {
  message: ChatMessage;
  index: number;
}

export default function MessageItem({ message, index }: MessageItemProps) {
  const isUser = message.role === 'user';
  
  return (
    <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <Card className={`${isUser ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
          <CardContent className="p-4">
            <div className="whitespace-pre-wrap text-sm">
              {message.content}
            </div>
            
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  参考来源 ({message.retrievedCount}个相关知识)
                </div>
                <div className="space-y-2">
                  {message.sources.map((source, i) => (
                    <div key={i} className="text-xs bg-white/50 rounded p-2 border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {source.category}
                        </Badge>
                        <span className="text-muted-foreground">
                          相似度: {(source.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-gray-700">{source.content}</div>
                    </div>
                  ))}
                </div>
                
                {message.processingTime && (
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    处理时间: {message.processingTime}ms
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
