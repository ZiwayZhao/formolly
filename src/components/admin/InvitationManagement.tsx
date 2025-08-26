
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useInvitationCodes } from '@/hooks/useInvitationCodes';
import { Copy, Plus, Users, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InvitationManagement() {
  const { 
    invitationCodes, 
    invitationRecords, 
    loading, 
    loadInvitationCodes, 
    loadInvitationRecords,
    createAdminInvitationCode 
  } = useInvitationCodes();
  
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadInvitationCodes();
    loadInvitationRecords();
  }, [loadInvitationCodes, loadInvitationRecords]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已复制",
      description: "邀请码已复制到剪贴板",
    });
  };

  const handleCreateInvitationCode = async () => {
    await createAdminInvitationCode(maxUses, expiresAt || undefined);
    setMaxUses(1);
    setExpiresAt('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总邀请码数</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitationCodes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃邀请码</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitationCodes.filter(code => code.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功邀请数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitationRecords.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>创建管理员邀请码</CardTitle>
          <CardDescription>
            创建由管理员生成的邀请码，可以设置使用次数和过期时间
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUses">最大使用次数</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">过期时间（可选）</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleCreateInvitationCode} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            创建邀请码
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>邀请码列表</CardTitle>
          <CardDescription>
            所有邀请码的管理和监控
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">加载中...</div>
          ) : (
            <div className="space-y-4">
              {invitationCodes.map((code) => (
                <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {code.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Badge variant={code.type === 'admin' ? 'default' : 'secondary'}>
                        {code.type === 'admin' ? '管理员' : '用户'}
                      </Badge>
                      <Badge variant={code.is_active ? 'default' : 'destructive'}>
                        {code.is_active ? '活跃' : '已禁用'}
                      </Badge>
                      <span>使用次数: {code.current_uses}/{code.max_uses}</span>
                      {code.expires_at && (
                        <span>过期时间: {formatDate(code.expires_at)}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      创建时间: {formatDate(code.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              
              {invitationCodes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无邀请码
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>邀请记录</CardTitle>
          <CardDescription>
            用户使用邀请码的记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">加载中...</div>
          ) : (
            <div className="space-y-4">
              {invitationRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="text-sm">
                      邀请人: {record.inviter_id}
                    </div>
                    <div className="text-sm">
                      被邀请人: {record.invitee_id}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Badge variant={record.flame_reward_given ? 'default' : 'secondary'}>
                        {record.flame_reward_given ? '已发放奖励' : '未发放奖励'}
                      </Badge>
                      <span>时间: {formatDate(record.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {invitationRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无邀请记录
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
