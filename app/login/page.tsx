"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/features/ui/button";
import { Input } from "@/features/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/features/ui/card";
import { Code, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 入力検証
    if (!username || !password) {
      setError("メールアドレスとパスワードを入力してください");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error("ログインエラー:", error);
        setError(error.message);
      } else {
        console.log("ログイン成功:", data);
        toast({
          title: "ログイン成功",
          description: "PixelWorkへようこそ！",
        });
        router.refresh(); // セッションを更新
        await new Promise(resolve => setTimeout(resolve, 500)); // リダイレクト前に少し待機
        router.push("/");
      }
    } catch (err) {
      setError("ログイン処理中にエラーが発生しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              PixelWork
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            タスク管理をもっと楽しく、もっとプログラマーらしく
          </p>
        </div>

        <Card className="border-secondary bg-card shadow-lg">
          <CardHeader className="pb-2 border-b border-secondary">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>ログイン</span>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="pt-6 pb-4 space-y-4">
              {error && (
                <div className="bg-secondary/50 p-3 rounded-md flex items-start gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="terminal-container bg-secondary/50 p-4 rounded-md mt-0">
                <div className="terminal-header flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span className="w-3 h-3 rounded-full bg-destructive"></span>
                  <span className="w-3 h-3 rounded-full bg-muted"></span>
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span className="flex-1 text-center">login.sh</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="terminal-line flex items-center gap-2">
                      <span className="text-primary">$</span>
                      <span className="text-muted-foreground">email:</span>
                    </div>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="メールアドレス"
                      className="terminal-input bg-secondary border-muted"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="terminal-line flex items-center gap-2">
                      <span className="text-primary">$</span>
                      <span className="text-muted-foreground">password:</span>
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="パスワード"
                      className="terminal-input bg-secondary border-muted"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "認証中..." : "ログイン"}
              </Button>

              <div className="flex justify-between w-full text-xs">
                <Link
                  href="/reset-password"
                  className="text-muted-foreground hover:text-primary"
                >
                  パスワードを忘れた場合
                </Link>
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-primary"
                >
                  新規登録はこちら
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© 2023 PixelWork. All rights reserved.</p>
          <p className="mt-1">
            <span className="text-primary">{">"}</span> Made with
            <span className="text-primary">{"<3"}</span> for developers
          </p>
        </div>
      </div>
    </div>
  );
}
