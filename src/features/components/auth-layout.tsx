import { Code } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
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

        {children}

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© 2023 PixelWork. All rights reserved.</p>
          <p className="mt-1">
            <span className="text-primary">{">"}</span> Made with{" "}
            <span className="text-primary">{"<3"}</span> for developers
          </p>
        </div>
      </div>
    </div>
  );
}
