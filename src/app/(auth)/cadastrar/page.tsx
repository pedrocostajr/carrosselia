import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Comece a criar carrosséis inteligentes para o Instagram.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignUpForm />
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
