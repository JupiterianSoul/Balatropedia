import { useState } from "react";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { AuthDialog } from "./AuthDialog";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { IS_LOCAL } from "@/lib/localAdapter";

export function UserButton() {
  // Single-user / offline APK build: never show sign-in chrome. The local
  // adapter still returns a stub user under the hood so favorites and
  // tier-list state continue to persist; we just don't expose any auth UI.
  if (IS_LOCAL) return null;

  const { user, isSignedIn, signOut } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const t = useT();

  async function handleSignOut() {
    await signOut();
    toast({ title: t("ui.user.signed_out") });
  }

  if (!isSignedIn) {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5 border-accent/40 bg-card text-xs hover:border-accent/70"
          onClick={() => setDialogOpen(true)}
          data-testid="button-signin-header"
        >
          <UserIcon className="h-3.5 w-3.5" />
          {t("ui.user.sign_in")}
        </Button>
        <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5 border-border bg-card text-xs hover:border-accent/40"
          data-testid="button-user-menu"
          title={user!.email}
        >
          <UserIcon className="h-3.5 w-3.5 text-accent" />
          <span data-testid="text-user-status">
            {t("ui.user.signed_in_short")}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
          {user!.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} data-testid="button-signout" className="gap-2 text-sm">
          <LogOut className="h-4 w-4" />
          {t("ui.user.sign_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

