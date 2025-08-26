
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FlameTransactionWithProfile {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  created_at: string;
  username: string | null;
}

interface FlameTransactionListProps {
  transactions: FlameTransactionWithProfile[];
  loading: boolean;
}

export function FlameTransactionList({ transactions, loading }: FlameTransactionListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getTransactionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'initial_bonus': '注册奖励',
      'invitation_reward': '邀请奖励',
      'chat_cost': 'AI问答消费',
      'admin_adjustment': '管理员调整',
      'contribution_reward': '贡献奖励'
    };
    return typeMap[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近交易记录</CardTitle>
        <CardDescription>
          最近100条火苗交易记录
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">加载中...</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {transaction.username || '未知用户'}
                    </span>
                    <Badge variant={transaction.amount > 0 ? 'default' : 'destructive'}>
                      {getTransactionTypeLabel(transaction.transaction_type)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {transaction.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(transaction.created_at)}
                  </div>
                </div>
                <div className={`font-bold text-lg ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无交易记录
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
