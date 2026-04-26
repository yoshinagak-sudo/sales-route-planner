"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  department: string | null;
};

type Props = {
  initialUsers: User[];
  initialCurrent: User | null;
};

/**
 * ヘッダ右上のユーザースイッチャー（デモ認証モード専用）
 * - 現在ユーザーの名前/部署を表示
 * - ドロップダウンで切替 -> /api/auth/switch-user -> router.refresh
 */
export function UserSwitcher({ initialUsers, initialCurrent }: Props) {
  const router = useRouter();
  const [current, setCurrent] = React.useState<User | null>(initialCurrent);
  const [loading, setLoading] = React.useState(false);

  const handleSwitch = async (user: User) => {
    if (loading || user.id === current?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "切替失敗");
      }
      setCurrent(user);
      toast.success(`${user.name} に切替えました`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "切替えに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border bg-card",
          "px-3 py-1.5 text-sm hover:bg-muted transition-colors",
          "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          loading && "opacity-60",
        )}
        aria-label="ユーザー切替"
        disabled={loading}
      >
        <span className="grid size-6 place-items-center rounded-full bg-brand/10 text-brand">
          <UserIcon className="size-3.5" />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="font-medium text-foreground">
            {current?.name ?? "未選択"}
          </span>
          {current?.department && (
            <span className="text-[10px] text-muted-foreground">
              {current.department}
            </span>
          )}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>デモユーザー切替</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {initialUsers.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onClick={() => handleSwitch(u)}
            className={cn(
              "flex items-start gap-2 py-2",
              u.id === current?.id && "bg-brand/10",
            )}
          >
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{u.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {u.department ?? "-"} / {u.email}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
