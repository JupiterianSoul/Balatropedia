import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { signupSchema, loginSchema, passwordRules, type SignupInput, type LoginInput } from "@shared/schema";

function PasswordStrength({ value, labels }: { value: string; labels: Record<string, string> }) {
  const passed = passwordRules.filter((r) => r.test(value)).length;
  const pct = (passed / passwordRules.length) * 100;
  const tone = passed <= 2 ? "bg-destructive" : passed <= 4 ? "bg-accent" : "bg-primary";
  return (
    <div className="space-y-2" data-testid="password-strength">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {passwordRules.map((r) => {
          const ok = r.test(value);
          return (
            <li
              key={r.id}
              data-testid={`pwrule-${r.id}`}
              data-passed={ok}
              className={`flex items-center gap-1.5 text-[11px] ${ok ? "text-primary" : "text-muted-foreground"}`}
            >
              {ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0 opacity-50" />}
              <span>{labels[r.id] ?? r.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "signin",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
}) {
  const [tab, setTab] = useState<string>(defaultTab);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const t = useT();

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });
  const signupPwd = signupForm.watch("password");

  const pwLabels: Record<string, string> = {
    min: t("ui.auth.pw_min"),
    upper: t("ui.auth.pw_upper"),
    lower: t("ui.auth.pw_lower"),
    digit: t("ui.auth.pw_digit"),
    symbol: t("ui.auth.pw_symbol"),
  };

  async function onLogin(values: LoginInput) {
    try {
      await signIn(values);
      toast({ title: t("ui.auth.welcome_back"), description: t("ui.auth.signed_in") });
      onOpenChange(false);
      loginForm.reset();
    } catch (e: any) {
      toast({ title: t("ui.auth.signin_failed"), description: parseErr(e, t("ui.auth.something_wrong")), variant: "destructive" });
    }
  }

  async function onSignup(values: SignupInput) {
    try {
      await signUp(values);
      toast({ title: t("ui.auth.account_created"), description: t("ui.auth.youre_signed_in") });
      onOpenChange(false);
      signupForm.reset();
    } catch (e: any) {
      toast({ title: t("ui.auth.create_failed"), description: parseErr(e, t("ui.auth.something_wrong")), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-auth">
        <DialogHeader>
          <DialogTitle className="font-pixel text-xl text-accent">{t("ui.auth.vault_title")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("ui.auth.vault_desc")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" data-testid="tab-signin">{t("ui.auth.signin")}</TabsTrigger>
            <TabsTrigger value="signup" data-testid="tab-signup">{t("ui.auth.signup")}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4">
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t("ui.auth.email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  data-testid="input-login-email"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">{t("ui.auth.password")}</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  data-testid="input-login-password"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginForm.formState.isSubmitting}
                data-testid="button-submit-signin"
              >
                {loginForm.formState.isSubmitting ? t("ui.auth.signing_in") : t("ui.auth.signin")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">{t("ui.auth.email")}</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  data-testid="input-signup-email"
                  {...signupForm.register("email")}
                />
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">{t("ui.auth.password")}</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("ui.auth.pw_placeholder")}
                  data-testid="input-signup-password"
                  {...signupForm.register("password")}
                />
                <PasswordStrength value={signupPwd ?? ""} labels={pwLabels} />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={signupForm.formState.isSubmitting}
                data-testid="button-submit-signup"
              >
                {signupForm.formState.isSubmitting ? t("ui.auth.creating") : t("ui.auth.signup")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <p className="mt-3 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-center text-[11px] text-accent" data-testid="text-session-note">
          {t("ui.auth.session_note")}
        </p>
      </DialogContent>
    </Dialog>
  );
}

function parseErr(e: any, fallback: string): string {
  const msg = String(e?.message ?? e ?? "");
  const m = msg.match(/^\d+:\s*(.*)$/);
  if (m) {
    try {
      const j = JSON.parse(m[1]);
      if (j.message) return j.message;
    } catch {
      return m[1];
    }
  }
  return msg || fallback;
}

