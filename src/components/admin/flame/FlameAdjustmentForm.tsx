
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserFlameStats {
  user_id: string;
  username: string | null;
  flame_balance: number;
  total_earned: number;
  total_spent: number;
}

interface FlameAdjustmentFormProps {
  userStats: UserFlameStats[];
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  adjustmentAmount: number;
  setAdjustmentAmount: (amount: number) => void;
  adjustmentReason: string;
  setAdjustmentReason: (reason: string) => void;
  onAdjust: () => void;
}

export function FlameAdjustmentForm({
  userStats,
  selectedUserId,
  setSelectedUserId,
  adjustmentAmount,
  setAdjustmentAmount,
  adjustmentReason,
  setAdjustmentReason,
  onAdjust
}: FlameAdjustmentFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>手动调整用户火苗</CardTitle>
        <CardDescription>
          为指定用户手动增加或扣除火苗
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">选择用户</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="选择用户" />
              </SelectTrigger>
              <SelectContent>
                {userStats.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.username || '未知用户'} (余额: {user.flame_balance})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">调整数量</Label>
            <Input
              id="amount"
              type="number"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
              placeholder="正数增加，负数扣除"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">调整原因</Label>
            <Input
              id="reason"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="调整原因说明"
            />
          </div>
        </div>
        
        <Button 
          onClick={onAdjust}
          disabled={!selectedUserId || adjustmentAmount === 0}
        >
          确认调整
        </Button>
      </CardContent>
    </Card>
  );
}
