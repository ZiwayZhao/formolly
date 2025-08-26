import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface UserRole {
  role: 'admin' | 'user';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isAdmin = userRoles.some(role => role.role === 'admin');

  useEffect(() => {
    // 设置认证状态监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // 延迟获取用户资料和角色
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRoles([]);
        }
        setLoading(false);
      }
    );

    // 检查现有会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        // 创建默认档案
        setProfile({
          id: userId,
          username: user?.email?.split('@')[0] || '用户',
          avatar_url: null
        });
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          avatar_url: data.avatar_url
        });
      } else {
        // 如果没有档案，创建默认档案
        setProfile({
          id: userId,
          username: user?.email?.split('@')[0] || '用户',
          avatar_url: null
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // 创建默认档案
      setProfile({
        id: userId,
        username: user?.email?.split('@')[0] || '用户',
        avatar_url: null
      });
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return;
      }

      setUserRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username || email.split('@')[0]
        }
      }
    });

    if (error) {
      toast({
        title: "注册失败",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "注册成功",
        description: "请检查您的邮箱以确认账户",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "登录失败",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "退出失败",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };

  return {
    user,
    session,
    profile,
    userRoles,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut
  };
}
