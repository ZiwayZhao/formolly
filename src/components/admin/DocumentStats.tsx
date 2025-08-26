
interface DocumentStatsProps {
  stats: {
    total: number;
    completed: number;
    processing: number;
    pending: number;
    failed: number;
  };
}

export default function DocumentStats({ stats }: DocumentStatsProps) {
  return (
    <div className="grid grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold">{stats.total}</div>
        <div className="text-sm text-muted-foreground">总文档</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        <div className="text-sm text-muted-foreground">已完成</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
        <div className="text-sm text-muted-foreground">处理中</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        <div className="text-sm text-muted-foreground">等待处理</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        <div className="text-sm text-muted-foreground">处理失败</div>
      </div>
    </div>
  );
}
