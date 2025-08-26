
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { KnowledgeUnit } from "./types";
import { CATEGORY_OPTIONS, IMPORTANCE_OPTIONS } from "./constants";
import EmbeddingStatusBadge from "./EmbeddingStatusBadge";
import JsonViewer from "./JsonViewer";
import { MessageSquare, FileJson } from 'lucide-react';

interface KnowledgeUnitListProps {
  units: KnowledgeUnit[];
  setUnits: React.Dispatch<React.SetStateAction<KnowledgeUnit[]>>;
  totalUnitCount: number;
}

export default function KnowledgeUnitList({ units, setUnits, totalUnitCount }: KnowledgeUnitListProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleEditSubmit(id: string, jsonContent: string) {
    let entities;
    try {
      entities = JSON.parse(jsonContent);
    } catch (e) {
      toast({
        title: "更新失败",
        description: "内容不是有效的JSON格式。",
        variant: "destructive",
      });
      return;
    }

    const newContent = entities['content'] || entities['项目名称'] || '无标题项目';

    // 数据库触发器 `trigger_handle_knowledge_unit_update` 会自动处理
    // 将 embedding 设置为 NULL 且 status 设置为 'pending'。
    const { error: updateError } = await supabase
      .from('knowledge_units')
      .update({ content: newContent, entities: entities })
      .eq('id', id);

    if (updateError) {
      toast({
        title: "更新失败",
        description: updateError.message,
        variant: "destructive"
      });
      return;
    }

    // 数据库更新成功后，触发向量生成。
    // Admin.tsx 中的实时订阅将自动更新本地状态。
    const { error: invokeError } = await supabase.functions.invoke('generate-embeddings', {
      body: { knowledgeUnitId: id }
    });

    setEditId(null);

    if (invokeError) {
       toast({
        title: "更新成功，但向量生成启动失败",
        description: `知识单元已保存。您可以稍后手动触发向量生成。错误: ${invokeError.message}`,
        variant: "destructive",
        duration: 8000,
      });
    } else {
      toast({
        title: "更新成功",
        description: "知识单元已保存，向量重新生成任务已启动。",
      });
    }
  }

  async function handleDeleteUnit(id: string) {
    const { error } = await supabase
      .from('knowledge_units')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setUnits(prev => prev.filter(unit => unit.id !== id));
    
    toast({
      title: "删除成功",
      description: "知识单元已删除"
    });
  }

  return (
    <ul className="flex flex-col gap-4">
      {units.map((item) => (
        <li
          key={item.id}
          className="rounded-md p-4 bg-accent flex flex-col gap-2 border relative group"
        >
          <div className="absolute right-3 top-2 flex gap-2 opacity-80 group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditId(item.id)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDeleteUnit(item.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
          
          {editId === item.id ? (
            <form
              className="flex flex-col gap-2"
              onSubmit={e => {
                e.preventDefault();
                handleEditSubmit(item.id, (e.target as any).jsonContent.value);
              }}
            >
              <Textarea
                name="jsonContent"
                defaultValue={JSON.stringify(item.entities || { '项目名称': item.content }, null, 2)}
                className="mb-1 min-h-[250px] font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  保存
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditId(null)}
                >
                  取消
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="text-base font-semibold whitespace-pre-wrap pr-20">{item.content}</div>
              <JsonViewer data={item.entities} />
            </>
          )}
          
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
            <EmbeddingStatusBadge status={item.embedding_status} error={item.embedding_error} />
            {item.data_type && (
              <Badge variant={item.data_type === 'qa' ? 'default' : 'secondary'} className="text-xs">
                {item.data_type === 'qa' ? 
                  <MessageSquare className="w-3 h-3 mr-1" /> : 
                  <FileJson className="w-3 h-3 mr-1" />
                }
                {item.data_type === 'qa' ? '问答对' : 'JSON对象'}
              </Badge>
            )}
            {item.category && (
              <Badge variant="default" className="text-xs">
                {CATEGORY_OPTIONS.find(c => c.value === item.category)?.label || item.category}
              </Badge>
            )}
            {item.importance && (
              <Badge variant="secondary" className="text-xs">
                {IMPORTANCE_OPTIONS.find(i => i.value === item.importance)?.label || item.importance}
              </Badge>
            )}
            {item.labels?.map((label, i) => (
              <Badge variant="outline" key={i} className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
            <span>来源: {item.source_name}</span>
            <span>{new Date(item.created_at).toLocaleString()}</span>
          </div>
        </li>
      ))}
      
      {units.length === 0 && (
        <li className="p-8 text-center text-muted-foreground">
          {totalUnitCount > 0 ? '没有匹配的知识单元' : '暂无知识单元，请上传文档或手动添加内容'}
        </li>
      )}
    </ul>
  );
}
