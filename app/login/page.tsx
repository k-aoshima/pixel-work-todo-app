"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/shared/hooks/use-toast";
import { createClient } from "@/app/utils/supabase/client"; // Corrected path
import { AuthLayout } from "@/features/components/auth-layout";
import { TerminalForm } from "@/features/components/terminal-form";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error("ログインエラー:", error);
        setError(error.message);
      } else {
        toast({
          title: "ログイン成功",
          description: "PixelWorkへようこそ！",
        });
        router.refresh(); // セッションを更新
        await new Promise((resolve) => setTimeout(resolve, 500)); // リダイレクト前に少し待機
        router.push("/");
      }
    } catch (err) {
      setError("ログイン処理中にエラーが発生しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputs = [
    {
      label: "email",
      value: username,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setUsername(e.target.value),
      placeholder: "メールアドレス",
      autoComplete: "email",
      type: "email",
      disabled: loading,
    },
    {
      label: "password",
      value: password,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setPassword(e.target.value),
      placeholder: "パスワード",
      autoComplete: "current-password",
      type: "password",
      disabled: loading,
    },
  ];

  return (
    <AuthLayout>
      <TerminalForm
        title="login.sh"
        error={error}
        inputs={inputs}
        onSubmit={handleLogin}
        submitText="ログイン"
        loading={loading}
      >
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
      </TerminalForm>
    </AuthLayout>
  );
}
