
import React, { useEffect, useState } from 'react';
import { FlameStatsCards } from './flame/FlameStatsCards';
import { FlameAdjustmentForm } from './flame/FlameAdjustmentForm';
import { UserFlameRanking } from './flame/UserFlameRanking';
import { FlameTransactionList } from './flame/FlameTransactionList';
import { useFlameData } from './flame/useFlameData';

export function FlameManagement() {
  const { transactions, userStats, loading, loadFlameData, adjustUserFlame } = useFlameData();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    loadFlameData();
  }, []);

  const handleAdjustUserFlame = async () => {
    const success = await adjustUserFlame(selectedUserId, adjustmentAmount, adjustmentReason);
    if (success) {
      // 重置表单
      setSelectedUserId('');
      setAdjustmentAmount(0);
      setAdjustmentReason('');
    }
  };

  // 计算总统计
  const totalStats = {
    totalUsers: userStats.length,
    totalFlamesInCirculation: userStats.reduce((sum, user) => sum + user.flame_balance, 0),
    totalFlamesEarned: userStats.reduce((sum, user) => sum + user.total_earned, 0),
    totalFlamesSpent: userStats.reduce((sum, user) => sum + user.total_spent, 0),
  };

  return (
    <div className="space-y-6">
      {/* 总体统计 */}
      <FlameStatsCards
        totalUsers={totalStats.totalUsers}
        totalFlamesInCirculation={totalStats.totalFlamesInCirculation}
        totalFlamesEarned={totalStats.totalFlamesEarned}
        totalFlamesSpent={totalStats.totalFlamesSpent}
      />

      {/* 手动调整火苗 */}
      <FlameAdjustmentForm
        userStats={userStats}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        adjustmentAmount={adjustmentAmount}
        setAdjustmentAmount={setAdjustmentAmount}
        adjustmentReason={adjustmentReason}
        setAdjustmentReason={setAdjustmentReason}
        onAdjust={handleAdjustUserFlame}
      />

      {/* 用户火苗排行 */}
      <UserFlameRanking userStats={userStats} loading={loading} />

      {/* 交易记录 */}
      <FlameTransactionList transactions={transactions} loading={loading} />
    </div>
  );
}
