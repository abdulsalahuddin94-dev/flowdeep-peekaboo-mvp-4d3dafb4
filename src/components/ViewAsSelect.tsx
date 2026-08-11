import { Users } from "@/lib/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/lib/projects-store";

/**
 * "View as" role switcher. Lives on pages whose content changes per role
 * (Dashboard, Approvals) instead of in the global header.
 */
export function ViewAsSelect({ className }: { className?: string }) {
  const { currentUser, setCurrentUserId, users } = useCurrentUser();
  return (
    <div className={className}>
      <Select value={currentUser.id} onValueChange={setCurrentUserId}>
        <SelectTrigger className="w-[240px] text-xs" aria-label="View as">
          <span className="flex min-w-0 items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0 text-muted-foreground">View as</span>
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id} className="text-xs">
              {u.name} · {u.role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
