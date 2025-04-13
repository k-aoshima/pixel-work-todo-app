"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/shared/hooks/use-toast";
import { createClient } from "@/app/utils/supabase/client"; // Corrected path
import { AuthLayout } from "@/features/components/auth-layout";
import { TerminalForm } from "@/features/components/terminal-form";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username || !password) {
      setError("メールアドレスとパスワードを入力してください");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: username,
        password: password,
        options: {
          emailRedirectTo: `${location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "登録成功",
          description: "登録確認メールを送信しました",
        });
        router.push("/login");
      }
    } catch (err) {
      setError("登録処理中にエラーが発生しました");
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
      autoComplete: "new-password",
      type: "password",
      disabled: loading,
    },
  ];

  return (
    <AuthLayout>
      <TerminalForm
        title="register.sh"
        error={error}
        inputs={inputs}
        onSubmit={handleRegister}
        submitText="新規登録"
        loading={loading}
      >
        <div className="flex justify-end w-full text-xs">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-primary"
          >
            アカウントをお持ちの方はこちら
          </Link>
        </div>
      </TerminalForm>
    </AuthLayout>
  );
}
