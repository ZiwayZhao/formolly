import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  MessageCircle, 
  MapPin, 
  Trash2,
  Loader2,
  User,
  Bot
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  timestamp: Date;
}

interface ZiwayChatProps {
  className?: string;
}

const categories = [
  { value: 'all', label: '全部分类' },
  { value: 'travel_guide', label: '旅行攻略' },
  { value: 'living_tips', label: '生活技巧' },
  { value: 'food_culture', label: '美食文化' },
  { value: 'transportation', label: '交通出行' },
  { value: 'accommodation', label: '住宿指南' },
  { value: 'emergency', label: '紧急情况' },
  { value: 'language', label: '语言沟通' },
  { value: 'shopping', label: '购物指南' },
  { value: 'sightseeing', label: '景点游览' },
  { value: 'general', label: '综合信息' }
];

export default function ZiwayChat({ className = '' }: ZiwayChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '🌍 你好！我是Ziway，你的AI旅行助手！\n\n我为Molly准备了丰富的欧洲旅行和生活经验。无论你想了解哪个城市的攻略、美食推荐、交通指南，还是遇到什么问题需要帮助，都可以随时问我！\n\n试试问我一些问题吧，比如：\n• "巴黎有什么必去的景点？"\n• "在德国超市购物要注意什么？"\n• "欧洲火车通票值得买吗？"\n\n让我们一起探索美丽的欧洲吧！✨',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('formolly-chat-simple', {
        body: {
          message: userMessage.content,
          category: selectedCategory === 'all' ? null : selectedCategory,
          location: selectedLocation || null
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        sources: data.sources || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我现在遇到了一些技术问题，无法回答你的问题。请稍后再试，或者尝试换一种方式提问。😅',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "回答失败",
        description: error.message || "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '🌍 聊天记录已清空！有什么新的旅行问题我可以帮你解答吗？',
        timestamp: new Date()
      }
    ]);
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 聊天头部 */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-orange-600" />
              与 Ziway 聊天
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearChat}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              清空
            </Button>
          </div>
          
          {/* 筛选控件 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="地点筛选（可选）"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm flex-1 sm:w-32"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 消息区域 */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {formatMessageContent(message.content)}
                    </div>
                    
                    {/* 显示来源 */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs text-gray-500 mb-2">参考来源：</div>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.slice(0, 3).map((source, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {source.location && `${source.location} - `}
                              {source.category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-500">Ziway 正在思考...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 输入区域 */}
      <Card className="flex-shrink-0">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="向 Ziway 提问关于欧洲旅行的任何问题..."
              className="flex-1 min-h-[50px] sm:min-h-[60px] max-h-32 resize-none text-sm sm:text-base"
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-orange-600 hover:bg-orange-700 px-4 self-end sm:self-stretch"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
