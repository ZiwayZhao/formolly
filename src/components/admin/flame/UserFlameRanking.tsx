
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserFlameStats {
  user_id: string;
  username: string | null;
  flame_balance: number;
  total_earned: number;
  total_spent: number;
}

interface UserFlameRankingProps {
  userStats: UserFlameStats[];
  loading: boolean;
}

export function UserFlameRanking({ userStats, loading }: UserFlameRankingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>用户火苗排行榜</CardTitle>
        <CardDescription>
          按火苗余额排序的用户列表
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">加载中...</div>
        ) : (
          <div className="space-y-2">
            {userStats.slice(0, 20).map((user, index) => (
              <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium">{user.username || '未知用户'}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span>余额: <span className="font-bold text-blue-600">{user.flame_balance}</span></span>
                  <span>获得: <span className="text-green-600">{user.total_earned}</span></span>
                  <span>消费: <span className="text-red-600">{user.total_spent}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
