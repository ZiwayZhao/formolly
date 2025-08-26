
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FlameTransactionWithProfile {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  created_at: string;
  username: string | null;
}

interface UserFlameStats {
  user_id: string;
  username: string | null;
  flame_balance: number;
  total_earned: number;
  total_spent: number;
}

export function useFlameData() {
  const [transactions, setTransactions] = useState<FlameTransactionWithProfile[]>([]);
  const [userStats, setUserStats] = useState<UserFlameStats[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadFlameData = async () => {
    setLoading(true);
    try {
      // 加载火苗交易记录
      const { data: transactionData, error: transactionError } = await supabase
        .from('flame_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionError) {
        console.error('加载火苗交易记录错误:', transactionError);
        toast({
          title: "加载失败",
          description: "无法加载火苗交易记录",
          variant: "destructive"
        });
      } else {
        // 获取所有用户的用户名
        const userIds = [...new Set(transactionData?.map(t => t.user_id) || [])];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        // 手动连接数据
        const transactionsWithProfiles = (transactionData || []).map(transaction => ({
          ...transaction,
          username: profilesData?.find(p => p.id === transaction.user_id)?.username || null
        }));

        setTransactions(transactionsWithProfiles);
      }

      // 加载用户火苗统计
      const { data: statsData, error: statsError } = await supabase
        .from('profiles')
        .select('id, username, flame_balance')
        .order('flame_balance', { ascending: false });

      if (statsError) {
        console.error('加载用户火苗统计错误:', statsError);
      } else {
        // 计算每个用户的详细统计信息
        const statsWithDetails = await Promise.all(
          (statsData || []).map(async (user) => {
            const { data: userTransactions } = await supabase
              .from('flame_transactions')
              .select('amount')
              .eq('user_id', user.id);

            const totalEarned = userTransactions
              ?.filter(t => t.amount > 0)
              .reduce((sum, t) => sum + t.amount, 0) || 0;

            const totalSpent = Math.abs(userTransactions
              ?.filter(t => t.amount < 0)
              .reduce((sum, t) => sum + t.amount, 0) || 0);

            return {
              user_id: user.id,
              username: user.username,
              flame_balance: user.flame_balance,
              total_earned: totalEarned,
              total_spent: totalSpent
            };
          })
        );

        setUserStats(statsWithDetails);
      }
    } catch (error) {
      console.error('加载火苗数据异常:', error);
      toast({
        title: "加载异常",
        description: "网络连接不稳定，请稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adjustUserFlame = async (userId: string, amount: number, reason: string) => {
    if (!userId || amount === 0) {
      toast({
        title: "参数错误",
        description: "请选择用户并输入调整数量",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('flame_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'admin_adjustment',
          amount: amount,
          description: reason || '管理员手动调整'
        });

      if (error) {
        console.error('调整火苗余额错误:', error);
        toast({
          title: "调整失败",
          description: error.message,
          variant: "destructive"
        });
        return false;
      } else {
        toast({
          title: "调整成功",
          description: `已为用户${amount > 0 ? '增加' : '扣除'}${Math.abs(amount)}点火苗`,
        });
        
        // 重新加载数据
        await loadFlameData();
        return true;
      }
    } catch (error) {
      console.error('调整火苗余额异常:', error);
      toast({
        title: "调整异常",
        description: "操作失败，请稍后重试",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    transactions,
    userStats,
    loading,
    loadFlameData,
    adjustUserFlame
  };
}
