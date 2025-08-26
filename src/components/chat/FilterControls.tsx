
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Target } from 'lucide-react';
import { CATEGORY_OPTIONS, IMPORTANCE_OPTIONS } from '@/constants/chatOptions';

interface FilterControlsProps {
  category: string;
  importance: string;
  onCategoryChange: (value: string) => void;
  onImportanceChange: (value: string) => void;
  onClearChat: () => void;
}

export default function FilterControls({
  category,
  importance,
  onCategoryChange,
  onImportanceChange,
  onClearChat
}: FilterControlsProps) {
  return (
    <div className="p-4 border-b bg-muted/30">
      <div className="flex gap-3 items-center text-sm">
        <Target className="w-4 h-4 text-orange-600" />
        <span className="font-medium">检索过滤:</span>
        
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="分类" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={importance} onValueChange={onImportanceChange}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="重要性" />
          </SelectTrigger>
          <SelectContent>
            {IMPORTANCE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearChat}
          className="text-muted-foreground hover:text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          清空
        </Button>
      </div>
    </div>
  );
}
