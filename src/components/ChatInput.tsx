import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSendMessage, isLoading = false }: ChatInputProps) {
  const [inputMessage, setInputMessage] = useState('');

  const sendMessage = () => {
    if (!inputMessage.trim() || isLoading) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 p-3 sm:p-4 bg-white dark:bg-gray-900 border-t">
      <Textarea
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="向 Ziway 提问关于欧洲旅行的任何问题..."
        className="flex-1 min-h-[50px] sm:min-h-[60px] max-h-32 resize-none text-sm sm:text-base"
        disabled={isLoading}
      />
      <Button
        onClick={sendMessage}
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
  );
}
