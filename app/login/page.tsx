import { Suspense } from "react";
import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
          Yükleniyor...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
