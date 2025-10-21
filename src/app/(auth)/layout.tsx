import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">OpenAsApp</h1>
          <p className="text-muted-foreground">
            Quote Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
