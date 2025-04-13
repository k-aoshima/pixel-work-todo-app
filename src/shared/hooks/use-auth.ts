import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";
import { createClient } from "@/app/utils/supabase/client"; // Corrected path alias

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  // Revert: Call createClient directly
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("認証エラー:", error);
          return false;
        }

        if (session) {
          setIsLoggedIn(true);
          setUsername(session.user.email || "");
          return true;
        }
      } catch (e) {
        console.error("認証チェックエラー:", e);
      }
      return false;
    };

    const setupAuthListener = () => {
      supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          setIsLoggedIn(true);
          setUsername(session.user.email || "");
        } else {
          setIsLoggedIn(false);
          setUsername("");
          router.push("/login");
        }
      });
    };

    checkAuth();
    setupAuthListener();
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "ログアウト",
        description: "ログアウトしました。",
      });
      
      router.push("/login");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      toast({
        title: "エラー",
        description: "ログアウト中にエラーが発生しました。",
      });
    }
  };

  return {
    isLoggedIn,
    username,
    handleLogout,
  };
}
