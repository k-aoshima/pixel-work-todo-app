"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/shared/hooks/use-toast";
import { createClient } from "@/app/utils/supabase/client"; // Corrected path
import { AuthLayout } from "@/features/components/auth-layout";
import { TerminalForm } from "@/features/components/terminal-form";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  // Pass env vars to createClient
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email) {
      setError("メールアドレスを入力してください");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      });

      if (error) {
        console.error("パスワードリセットエラー:", error);
        setError(error.message);
      } else {
        toast({
          title: "メール送信完了",
          description: "パスワードリセット用のメールを送信しました。",
        });
        router.push("/login");
      }
    } catch (err) {
      setError("パスワードリセット処理中にエラーが発生しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputs = [
    {
      label: "email",
      value: email,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmail(e.target.value),
      placeholder: "登録したメールアドレス",
      autoComplete: "email",
      type: "email",
      disabled: loading,
    },
  ];

  return (
    <AuthLayout>
      <TerminalForm
        title="reset-password.sh"
        error={error}
        inputs={inputs}
        onSubmit={handleResetPassword}
        submitText="リセットメールを送信"
        loading={loading}
      >
        <div className="text-sm text-muted-foreground mb-4">
          登録時のメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
        </div>
        <div className="flex justify-end w-full text-xs">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-primary"
          >
            ログインページに戻る
          </Link>
        </div>
      </TerminalForm>
    </AuthLayout>
  );
}
