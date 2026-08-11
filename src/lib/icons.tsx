/**
 * Solar icon library (via Iconify) exposed with the icon names used across the app.
 * Single source of truth for iconography — swap a mapping here to restyle globally.
 */
import { Icon as IconifyIcon } from "@iconify/react";
import { Setting4 as SaxSetting4, Add as SaxAdd, Edit2 as SaxEdit2, Trash as SaxTrash } from "iconsax-react";
import type { SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  strokeWidth?: number | string;
};

const STYLE = "linear" as const;

function make(name: string) {
  const Component = ({ size, strokeWidth: _sw, color, ...rest }: IconProps) => (
    <IconifyIcon
      icon={`solar:${name}`}
      {...(size !== undefined ? { width: size, height: size } : {})}
      {...(color ? { color: color as string } : {})}
      {...(rest as Record<string, unknown>)}
    />
  );
  Component.displayName = `Solar(${name})`;
  return Component;
}

const s = (base: string) => make(`${base}-${STYLE}`);

/** Iconsax (vuesax) icons — used for the Filter (settings) and Add (+) actions. */
function sax(Base: typeof SaxAdd, displayName: string) {
  const Component = ({ size, strokeWidth, color, ...rest }: IconProps) => (
    <Base
      variant="Linear"
      {...(size !== undefined ? { size: size as number } : { size: 20 })}
      {...(color ? { color: color as string } : { color: "currentColor" })}
      {...(strokeWidth !== undefined ? { strokeWidth: Number(strokeWidth) } : {})}
      {...(rest as Record<string, unknown>)}
    />
  );
  Component.displayName = displayName;
  return Component;
}

export const Activity = s("pulse");
export const AlertTriangle = s("danger-triangle");
export const ArrowLeft = s("arrow-left");
export const ArrowRight = s("arrow-right");
export const ArrowUpRight = s("arrow-right-up");
export const Bell = s("bell");
export const Briefcase = s("case");
export const Building2 = s("buildings-2");
export const CalendarDays = s("calendar");
export const CalendarIcon = s("calendar");
export const Calendar = s("calendar");
export const Check = s("check-read");
export const CheckCircle2 = s("check-circle");
export const Info = s("info-circle");
export const CheckSquare = s("check-square");
export const ChevronDown = s("alt-arrow-down");
export const ChevronDownIcon = ChevronDown;
export const ChevronUp = s("alt-arrow-up");
export const ChevronUpIcon = ChevronUp;
export const ChevronLeft = s("alt-arrow-left");
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = s("alt-arrow-right");
export const ChevronRightIcon = ChevronRight;
export const Circle = s("record");
export const CircleIcon = Circle;
export const ClipboardCheck = s("clipboard-check");
export const Clock = s("clock-circle");
export const Columns3 = s("widget-4");
export const Command = s("command");
export const Diamond = s("record");
export const DollarSign = s("dollar-minimalistic");
export const Download = s("download");
export const FileSpreadsheet = s("document-text");
export const FileText = s("document-text");
export const FileUp = s("file-send");
export const Filter = sax(SaxSetting4, "Iconsax(Setting4)");
/** Iconsax row actions — table Edit / Delete buttons. */
export const EditAction = sax(SaxEdit2, "Iconsax(Edit2)");
export const DeleteAction = sax(SaxTrash, "Iconsax(Trash)");
export const Flame = s("fire");
export const GanttChartSquare = s("chart-square");
export const GitBranch = s("branching-paths-up");
export const GripVertical = s("sort-vertical");
export const Handshake = s("hand-shake");
export const Inbox = s("inbox");
export const LayoutDashboard = s("widget-5");
export const LayoutGrid = s("widget-4");
export const Link2 = s("link");
export const List = s("list");
export const Lock = s("lock-keyhole-minimalistic");
export const LogOut = s("logout-2");
export const Mail = s("letter");
export const MessageSquare = s("chat-round");
export const Minus = s("minus-circle");
export const MoreHorizontal = s("menu-dots");
export const MoreHorizontalIcon = MoreHorizontal;
export const Package = s("box");
export const PanelLeft = s("sidebar-minimalistic");
export const PanelLeftClose = s("sidebar-minimalistic");
export const PanelLeftOpen = s("sidebar-minimalistic");
export const Paperclip = s("paperclip");
export const PartyPopper = s("confetti");
export const Pencil = s("pen-new-square");
export const Phone = s("phone");
export const PiggyBank = s("safe-2");
export const Plus = sax(SaxAdd, "Iconsax(Add)");
export const Search = s("magnifer");
export const SearchIcon = Search;
export const Send = s("plain-2");
export const ShieldAlert = s("shield-warning");
export const Sparkles = s("stars");
export const Star = s("star");
export const Target = s("target");
export const Trash2 = s("trash-bin-trash");
export const TrendingUp = s("graph-up");
export const TrendingDown = s("graph-down");
export const Trophy = s("cup-star");
export const Upload = s("upload");
export const UserCheck = s("user-check");
export const UserPlus = s("user-plus");
export const Users = s("users-group-two-rounded");
export const Wallet = s("wallet");
export const X = s("close-circle");
export const XIcon = X;
export const XCircle = s("close-circle");
export const Zap = s("bolt");
