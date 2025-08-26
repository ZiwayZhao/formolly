
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InvitationCode {
  id: string;
  code: string;
  type: string;
  created_by: string;
  created_by_admin: boolean;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface InvitationRecord {
  id: string;
  invitation_code_id: string;
  inviter_id: string;
  invitee_id: string;
  flame_reward_given: boolean;
  created_at: string;
}

export function useInvitationCodes() {
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([]);
  const [invitationRecords, setInvitationRecords] = useState<InvitationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadInvitationCodes = useCallback(async () => {
    try {
      setLoading(true);
      console.log('加载邀请码...');
      
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('邀请码加载错误:', error);
        toast({
          title: "邀请码加载失败",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log(`成功加载 ${data?.length || 0} 个邀请码`);
      setInvitationCodes(data || []);
    } catch (error: any) {
      console.error('邀请码加载异常:', error);
      toast({
        title: "加载异常",
        description: "网络连接不稳定，请检查网络后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadInvitationRecords = useCallback(async () => {
    try {
      setLoading(true);
      console.log('加载邀请记录...');
      
      const { data, error } = await supabase
        .from('invitation_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('邀请记录加载错误:', error);
        toast({
          title: "邀请记录加载失败",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log(`成功加载 ${data?.length || 0} 个邀请记录`);
      setInvitationRecords(data || []);
    } catch (error: any) {
      console.error('邀请记录加载异常:', error);
      toast({
        title: "加载异常",
        description: "网络连接不稳定，请检查网络后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const validateInvitationCode = useCallback(async (code: string) => {
    try {
      console.log('验证邀请码:', code);
      
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('邀请码验证错误:', error);
        return { valid: false, message: '邀请码不存在或已失效' };
      }

      // 检查是否已过期
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, message: '邀请码已过期' };
      }

      // 检查使用次数（如果max_uses > 0才检查限制）
      if (data.max_uses > 0 && data.current_uses >= data.max_uses) {
        return { valid: false, message: '邀请码使用次数已达上限' };
      }

      return { valid: true, invitationCode: data };
    } catch (error: any) {
      console.error('邀请码验证异常:', error);
      return { valid: false, message: '验证过程中发生错误' };
    }
  }, []);

  const createAdminInvitationCode = useCallback(async (maxUses: number = 0, expiresAt?: string) => {
    try {
      console.log('创建管理员邀请码...');
      
      // 生成随机邀请码
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data, error } = await supabase
        .from('invitation_codes')
        .insert({
          code,
          type: 'admin',
          created_by_admin: true,
          max_uses: maxUses, // 0表示无限制
          expires_at: expiresAt || null
        })
        .select()
        .single();

      if (error) {
        console.error('创建邀请码错误:', error);
        toast({
          title: "创建邀请码失败",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "邀请码创建成功",
        description: `邀请码：${code}`,
      });

      await loadInvitationCodes();
      return data;
    } catch (error: any) {
      console.error('创建邀请码异常:', error);
      toast({
        title: "创建异常",
        description: "网络连接不稳定，请检查网络后重试",
        variant: "destructive"
      });
      return null;
    }
  }, [toast, loadInvitationCodes]);

  return {
    invitationCodes,
    invitationRecords,
    loading,
    loadInvitationCodes,
    loadInvitationRecords,
    validateInvitationCode,
    createAdminInvitationCode
  };
}
