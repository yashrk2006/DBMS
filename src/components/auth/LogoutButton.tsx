'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
  hideText?: boolean;
}

export function LogoutButton({ className, hideText = false }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Logged out successfully');
      // Force a full refresh to clear any cached states/cookies
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err.message || 'Logout synthesis failed');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold text-sm ${className}`}
    >
      <LogOut size={18} />
      {!hideText && <span>Terminate Session</span>}
    </button>
  );
}
