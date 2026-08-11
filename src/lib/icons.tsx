/**
 * Vuesax / Iconsax icon library exposed with the icon names used across the app.
 * Single source of truth for iconography — swap a mapping here to restyle globally.
 */
import * as Sax from "iconsax-react";
import type { SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  strokeWidth?: number | string;
};

type SaxComponent = (typeof Sax)["Add"];

/** Wrap an Iconsax (vuesax) icon so it accepts the lucide-style prop shape. */
function sax(name: keyof typeof Sax) {
  const Base = Sax[name] as SaxComponent;
  const Component = ({ size, strokeWidth, color, ...rest }: IconProps) => (
    <Base
      variant="Linear"
      size={(size as number) ?? 20}
      color={(color as string) ?? "currentColor"}
      {...(strokeWidth !== undefined ? { strokeWidth: Number(strokeWidth) } : {})}
      {...(rest as Record<string, unknown>)}
    />
  );
  Component.displayName = `Vuesax(${String(name)})`;
  return Component;
}

export const Activity = sax("Activity");
export const AlertTriangle = sax("Danger");
export const ArrowLeft = sax("ArrowLeft");
export const ArrowRight = sax("ArrowRight");
export const ArrowUpRight = sax("ArrowUp");
export const Bell = sax("Notification");
export const Briefcase = sax("Briefcase");
export const Building2 = sax("Buildings2");
export const CalendarDays = sax("Calendar");
export const CalendarIcon = CalendarDays;
export const Calendar = CalendarDays;
export const Check = sax("TickCircle");
export const CheckCircle2 = sax("TickCircle");
export const Info = sax("InfoCircle");
export const CheckSquare = sax("TickSquare");
export const ChevronDown = sax("ArrowDown2");
export const ChevronDownIcon = ChevronDown;
export const ChevronUp = sax("ArrowUp2");
export const ChevronUpIcon = ChevronUp;
export const ChevronLeft = sax("ArrowLeft2");
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = sax("ArrowRight2");
export const ChevronRightIcon = ChevronRight;
export const Circle = sax("Record");
export const CircleIcon = Circle;
export const ClipboardCheck = sax("ClipboardTick");
export const Clock = sax("Clock");
export const Columns3 = sax("Grid2");
export const Command = sax("Command");
export const Diamond = sax("Record");
export const DollarSign = sax("DollarCircle");
export const Download = sax("DocumentDownload");
export const FileSpreadsheet = sax("DocumentText");
export const FileText = sax("DocumentText");
export const FileUp = sax("DocumentUpload");
export const Filter = sax("Setting4");
/** Table row actions — Edit / Delete buttons. */
export const EditAction = sax("Edit2");
export const DeleteAction = sax("Trash");
export const Flame = sax("Flash");
export const GanttChartSquare = sax("ChartSquare");
export const GitBranch = sax("Hierarchy");
export const GripVertical = sax("Sort");
export const Handshake = sax("People");
export const Inbox = sax("DirectInbox");
export const LayoutDashboard = sax("Category");
export const LayoutGrid = sax("Element3");
export const Link2 = sax("Link2");
export const List = sax("TextalignJustifycenter");
export const Lock = sax("Lock");
export const LogOut = sax("Logout");
export const Mail = sax("Sms");
export const MessageSquare = sax("Message");
export const Minus = sax("MinusCirlce");
export const Moon = sax("Moon");
export const Sun = sax("Sun");
export const MoreHorizontal = sax("More");
export const MoreHorizontalIcon = MoreHorizontal;
export const Package = sax("Box");
export const PanelLeft = sax("HambergerMenu");
export const PanelLeftClose = PanelLeft;
export const PanelLeftOpen = PanelLeft;
export const Paperclip = sax("Paperclip");
export const PartyPopper = sax("Gift");
export const Pencil = sax("Edit");
export const Phone = sax("Call");
export const PiggyBank = sax("Wallet2");
export const Power = sax("ToggleOffCircle");
export const Plus = sax("Add");
export const Search = sax("SearchNormal1");
export const SearchIcon = Search;
export const Send = sax("Send2");
export const ShieldAlert = sax("ShieldCross");
export const Sparkles = sax("Magicpen");
export const Star = sax("Star1");
export const Target = sax("Gps");
export const Trash2 = sax("Trash");
export const TrendingUp = sax("TrendUp");
export const TrendingDown = sax("TrendDown");
export const Trophy = sax("Cup");
export const Upload = sax("Export");
export const UserCheck = sax("UserTick");
export const UserPlus = sax("UserAdd");
export const Users = sax("Profile2User");
export const Wallet = sax("Wallet");
/** Close (✕) — used by every dialog/sheet/chip close button. */
export const X = sax("CloseCircle");
export const XIcon = X;
export const XCircle = X;
export const Zap = sax("Flash");
