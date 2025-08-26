
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold text-orange-600 tracking-wide">聚火盆 · 知识管理中心</div>
          <div className="text-sm text-muted-foreground">
            RAG智能检索 · 向量化存储 · 语义搜索 · 混合处理策略
          </div>
        </div>
      </div>
    </header>
  );
}
