
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";

interface DocumentFilterProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export default function DocumentFilter({ 
  statusFilter, 
  onStatusFilterChange, 
  filteredCount, 
  totalCount 
}: DocumentFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unarchived">未归档</SelectItem>
          <SelectItem value="archived">已归档</SelectItem>
          <SelectItem value="all">所有文档</SelectItem>
          <SelectSeparator />
          <SelectItem value="completed">已完成</SelectItem>
          <SelectItem value="processing">处理中</SelectItem>
          <SelectItem value="pending">等待处理</SelectItem>
          <SelectItem value="failed">处理失败</SelectItem>
        </SelectContent>
      </Select>
      <div className="text-sm text-muted-foreground">
        显示 {filteredCount} / {totalCount} 个文档
      </div>
    </div>
  );
}
