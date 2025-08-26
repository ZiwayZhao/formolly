
import { useEffect } from "react";
import { useDatabaseConnection } from "./useDatabaseConnection";
import { useKnowledgeUnits } from "./useKnowledgeUnits";
import { useAcademicSparks } from "./useAcademicSparks";
import { useCareerSparks } from "./useCareerSparks";
import { useRealtimeSubscriptions } from "./useRealtimeSubscriptions";
import { useInvitationCodes } from "./useInvitationCodes";

export function useAdminData() {
  const { 
    connectionError, 
    setConnectionError, 
    testDatabaseConnection 
  } = useDatabaseConnection();
  
  const { 
    units, 
    setUnits, 
    loadKnowledgeUnits 
  } = useKnowledgeUnits();
  
  const { 
    academicSparks, 
    setAcademicSparks, 
    loadAcademicSparks 
  } = useAcademicSparks();
  
  const { 
    careerSparks, 
    setCareerSparks, 
    loadCareerSparks 
  } = useCareerSparks();

  const {
    invitationCodes,
    invitationRecords,
    loadInvitationCodes,
    loadInvitationRecords
  } = useInvitationCodes();

  useRealtimeSubscriptions({ setUnits });

  // 初始化应用 - 静默连接检测
  useEffect(() => {
    const initializeApp = async () => {
      console.log('=== 初始化聚火盆管理系统 ===');
      
      if (!navigator.onLine) {
        setConnectionError('网络连接断开，请检查网络连接');
        return;
      }
      
      const connected = await testDatabaseConnection();
      if (connected) {
        await loadKnowledgeUnits();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadAcademicSparks();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadCareerSparks();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadInvitationCodes();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadInvitationRecords();
      } else {
        console.warn('数据库连接失败，跳过数据加载');
      }
    };

    initializeApp();

    const handleOnline = () => {
      console.log('网络连接恢复');
      setConnectionError(null);
      testDatabaseConnection();
    };

    const handleOffline = () => {
      console.log('网络连接断开');
      setConnectionError('网络连接断开');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    units,
    setUnits,
    academicSparks,
    setAcademicSparks,
    careerSparks,
    setCareerSparks,
    invitationCodes,
    invitationRecords,
    connectionError,
    setConnectionError,
    testDatabaseConnection,
    loadKnowledgeUnits,
    loadAcademicSparks,
    loadCareerSparks,
    loadInvitationCodes,
    loadInvitationRecords
  };
}
