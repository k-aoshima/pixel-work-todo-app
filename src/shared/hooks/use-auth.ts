import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem("pixelwork-auth");
      if (authData) {
        try {
          const { username, isLoggedIn } = JSON.parse(authData);
          if (isLoggedIn) {
            setIsLoggedIn(true);
            setUsername(username);
            return true;
          }
        } catch (e) {
          console.error("認証データの解析エラー:", e);
        }
      }
      return false;
    };

    const isAuth = checkAuth();
    if (!isAuth) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("pixelwork-auth");
    toast({
      title: "ログアウト",
      description: "ログアウトしました。",
    });
    router.push("/login");
  };

  return {
    isLoggedIn,
    username,
    handleLogout,
  };
}
