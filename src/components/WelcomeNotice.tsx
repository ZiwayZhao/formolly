import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Save, X, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WelcomeNoticeData {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
}

interface WelcomeNoticeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showEditButton?: boolean;
}

export default function WelcomeNotice({ open, onOpenChange, showEditButton = false }: WelcomeNoticeProps) {
  const [notice, setNotice] = useState<WelcomeNoticeData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // 加载开屏须知数据
  const loadNotice = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('formolly_welcome_notice')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading notice:', error);
        return;
      }

      if (data) {
        setNotice(data as WelcomeNoticeData);
        setEditTitle(data.title);
        setEditContent(data.content);
      }
    } catch (error) {
      console.error('Error loading notice:', error);
    }
  };

  // 保存编辑的须知
  const saveNotice = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast({
        title: "保存失败",
        description: "标题和内容不能为空",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        title: editTitle.trim(),
        content: editContent.trim(),
        updated_at: new Date().toISOString()
      };

      let result;
      if (notice) {
        // 更新现有记录
        result = await (supabase as any)
          .from('formolly_welcome_notice')
          .update(updateData)
          .eq('id', notice.id)
          .select()
          .single();
      } else {
        // 创建新记录
        result = await (supabase as any)
          .from('formolly_welcome_notice')
          .insert({
            ...updateData,
            is_active: true
          })
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setNotice(result.data as WelcomeNoticeData);
      setIsEditing(false);
      toast({
        title: "保存成功",
        description: "开屏须知已更新"
      });
    } catch (error: any) {
      console.error('Error saving notice:', error);
      toast({
        title: "保存失败",
        description: error.message || "保存时出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    if (notice) {
      setEditTitle(notice.title);
      setEditContent(notice.content);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (open) {
      loadNotice();
    }
  }, [open]);

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-orange-600">
            {isEditing ? '编辑开屏须知' : (notice?.title || 'Formolly')}
          </DialogTitle>
          {showEditButton && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="ml-auto"
            >
              <Edit className="w-4 h-4 mr-1" />
              编辑
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {isEditing ? (
            // 编辑模式
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="输入标题"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="content">内容</Label>
                <Textarea
                  id="content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="输入开屏须知内容，支持换行和表情符号"
                  rows={15}
                  className="mt-1 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-1" />
                  取消
                </Button>
                <Button
                  onClick={saveNotice}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {loading ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          ) : (
            // 显示模式
            <div className="space-y-4">
              <div className="prose prose-orange max-w-none">
                <div className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  {notice ? formatContent(notice.content) : '加载中...'}
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => onOpenChange(false)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8"
                >
                  开始使用 Formolly
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
