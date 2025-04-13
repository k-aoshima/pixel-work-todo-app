import { useState, useEffect, useCallback } from "react"; // useCallbackを追加
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";
import { createClient } from "@/app/utils/supabase/client";
import type { User } from "@supabase/supabase-js"; // User型をインポート
export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<User | null>(null); // user stateを追加
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // 認証状態を更新する関数 (useCallbackでメモ化)
  const updateAuthState = useCallback((session: any) => { // sessionの型をanyに変更 (より柔軟に対応)
    if (session?.user) {
      setIsLoggedIn(true);
      setUsername(session.user.email || "");
      setUser(session.user); // user stateを更新
    } else {
      setIsLoggedIn(false);
      setUsername("");
      setUser(null); // user stateをクリア
    }
  }, []); // 依存配列は空

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("認証エラー:", error);
        }
        updateAuthState(session); // 認証状態を更新
        // セッションがない場合、ログインページへリダイレクト（初回チェック時）
        if (!session) {
           router.push("/login");
        }
      } catch (e) {
        console.error("認証チェックエラー:", e);
        updateAuthState(null); // エラー時も状態をクリア
         router.push("/login");
      }
    };

    const setupAuthListener = () => {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        updateAuthState(session); // 認証状態の変更を検知して更新
        // ログアウト時などにログインページへリダイレクト
        if (!session && window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/reset-password') {
          router.push("/login");
        }
      });
      // クリーンアップ関数
      return () => {
        authListener?.subscription.unsubscribe();
      };
    };

    checkAuth();
    const unsubscribe = setupAuthListener();

    return () => {
      unsubscribe(); // コンポーネントのアンマウント時にリスナーを解除
    };
  // router, supabase.auth, updateAuthState を依存配列に追加
  }, [router, supabase.auth, updateAuthState]);
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "ログアウト",
        description: "ログアウトしました。",
      });
      // 状態更新は onAuthStateChange に任せる
      // router.push("/login"); // リダイレクトも onAuthStateChange で処理される
    } catch (error: any) { // エラーの型を any に変更
      // AuthSessionMissingError の場合は警告のみ表示し、トーストは出さない (セッションがないのは期待される場合もある)
      if (error.name === 'AuthSessionMissingError') {
         console.warn("Supabase signOut failed: Auth session missing. State might be out of sync or already logged out.");
         // 状態が不整合の場合に備えてクリアし、リダイレクトを試みる
         updateAuthState(null);
         if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/reset-password') {
           router.push("/login");
         }
      } else {
        // その他のエラーはコンソールに出力し、トーストでユーザーに通知
        console.error("ログアウトエラー:", error);
        toast({
          title: "エラー",
          description: error.message || "ログアウト中にエラーが発生しました。", // エラーメッセージを表示
          variant: "destructive",
        });
      }
    }
  };

  return {
    isLoggedIn,
    username,
    user, // userオブジェクトを返す
    handleLogout,
  };
}
