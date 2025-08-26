
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy, Users, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  username: string | null;
  invitation_code: string | null;
  flame_balance: number;
}

export function UserInvitationCode() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [inviteCount, setInviteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadInviteCount();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('加载用户资料错误:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('加载用户资料异常:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInviteCount = async () => {
    try {
      const { data, error } = await supabase
        .from('invitation_records')
        .select('id')
        .eq('inviter_id', user?.id);

      if (error) {
        console.error('加载邀请统计错误:', error);
        return;
      }

      setInviteCount(data?.length || 0);
    } catch (error) {
      console.error('加载邀请统计异常:', error);
    }
  };

  const copyInvitationCode = () => {
    if (profile?.invitation_code) {
      navigator.clipboard.writeText(profile.invitation_code);
      toast({
        title: "已复制",
        description: "邀请码已复制到剪贴板",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">无法加载用户信息</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我的火苗余额</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.flame_balance}</div>
            <p className="text-xs text-muted-foreground">可用于AI问答</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功邀请人数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inviteCount}</div>
            <p className="text-xs text-muted-foreground">每邀请1人获得20火苗</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计获得火苗</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inviteCount * 20}</div>
            <p className="text-xs text-muted-foreground">通过邀请获得</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>我的邀请码</CardTitle>
          <CardDescription>
            分享您的邀请码给朋友，每成功邀请一人注册可获得20点火苗奖励
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.invitation_code ? (
            <>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700">您的专属邀请码</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="bg-white px-3 py-2 rounded border text-lg font-mono font-bold text-blue-600">
                      {profile.invitation_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyInvitationCode}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">邀请说明：</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 您的邀请码最多可以邀请5个人注册</li>
                  <li>• 每成功邀请1人注册，您将获得20点火苗奖励</li>
                  <li>• 火苗可用于AI问答服务</li>
                  <li>• 分享给朋友时，请让他们在注册时输入您的邀请码</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>您的邀请码正在生成中，请稍后刷新页面</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
