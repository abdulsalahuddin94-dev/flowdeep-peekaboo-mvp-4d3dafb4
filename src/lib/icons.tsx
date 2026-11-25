/**
 * Vuesax / Iconsax icon library exposed with the icon names used across the app.
 * Single source of truth for iconography — swap a mapping here to restyle globally.
 */
import * as Sax from "iconsax-react";
import { Icon } from "@iconify/react";
import { X as LucideX, Check as LucideCheck } from "lucide-react";
import type { SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  strokeWidth?: number | string;
  isActive?: boolean;
};

type SaxComponent = (typeof Sax)["Add"];

/** Solar (iconify) icon that swaps outline -> bold when active. Used by the sidebar. */
function solar(name: string) {
  const Component = ({ size, isActive, strokeWidth: _sw, ...rest }: IconProps) => (
    <Icon
      icon={isActive ? `solar:${name}-bold` : `solar:${name}-outline`}
      width={size ?? 20}
      height={size ?? 20}
      {...(rest as Record<string, unknown>)}
    />
  );
  Component.displayName = `Solar(${name})`;
  return Component;
}

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
export const IdCard = sax("Personalcard");
export const Building2 = ({ size, isActive, ...rest }: IconProps) => (
  <Icon
    icon={isActive ? "solar:buildings-bold" : "solar:buildings-outline"}
    width={size ?? 20}
    height={size ?? 20}
    {...(rest as Record<string, unknown>)}
  />
);
Building2.displayName = "SolarBuildings";

/**
 * Sidebar navigation icons — Solar library, outline by default and bold when active.
 * Keep these in sync with src/components/AppSidebar.tsx.
 */
export const NavDashboard = solar("widget-4");
export const NavPortfolio = solar("folder");
export const NavResources = solar("users-group-rounded");
export const NavClientsVendors = solar("users-group-two-rounded");
export const NavFinancials = solar("dollar-minimalistic");
export const NavOrganization = solar("buildings");
export const NavApprovals = solar("clipboard-check");
export const NavRisks = solar("shield-warning");
export const NavActionTracker = solar("checklist-minimalistic");
export const NavMeetings = solar("calendar-minimalistic");
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
export const Eye = sax("Eye");
export const FileSpreadsheet = sax("DocumentText");
export const FileText = sax("DocumentText");
export const FileUp = sax("DocumentUpload");
export const Filter = sax("Setting4");
/** Table row actions — Edit / Delete buttons. */
export const EditAction = sax("Edit2");
export const DeleteAction = sax("Trash");
export const Flame = sax("Flash");
export const Folder = sax("Folder");
export const FolderFavorite = sax("FolderFavorite");
export const GanttChartSquare = sax("ChartSquare");
export const GitBranch = sax("Hierarchy");
export const GripVertical = sax("Sort");
export const Handshake = sax("People");
export const Inbox = sax("DirectInbox");
export const LayoutDashboard = sax("Element4");
export const LayoutGrid = sax("Element3");
export const Link2 = sax("Link2");
export const List = sax("TextalignJustifycenter");
export const Lock = sax("Lock");
export const LogOut = sax("Logout");
export const Mail = sax("Sms");
export const MessageSquare = sax("Message");
export const Minus = sax("MinusCirlce");
export const Moon = sax("Moon");
/**
 * Leave / day-off marker — a beach umbrella. The Iconsax sun glyph reads as a
 * snowflake at 12-16px, so leave gets its own unambiguous, offline-drawn mark.
 */
export const Umbrella = ({ size = 20, ...rest }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...(rest as Record<string, unknown>)}
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.5238 1.25C5.84974 1.25 1.25 5.84974 1.25 11.5238C1.25 12.201 1.79898 12.75 2.47619 12.75H11.25V20C11.25 20.6904 10.6904 21.25 10 21.25C9.30964 21.25 8.75 20.6904 8.75 20V19C8.75 18.5858 8.41421 18.25 8 18.25C7.58579 18.25 7.25 18.5858 7.25 19V20C7.25 21.5188 8.48122 22.75 10 22.75C11.5188 22.75 12.75 21.5188 12.75 20V12.75H21.5238C22.201 12.75 22.75 12.201 22.75 11.5238C22.75 5.84974 18.1503 1.25 12.4762 1.25H11.5238ZM8.84386 3.16683C5.39174 4.27297 2.87041 7.4588 2.75419 11.25H6.41544C6.59146 9.80771 6.94148 7.65426 7.60615 5.73755C7.92504 4.81796 8.32834 3.91674 8.84386 3.16683ZM7.92709 11.25C8.10314 9.86814 8.43343 7.93018 9.02335 6.229C9.38457 5.18734 9.82539 4.28791 10.3479 3.66173C10.8617 3.04589 11.4026 2.75 12 2.75C12.5974 2.75 13.1383 3.04589 13.6521 3.66173C14.1746 4.28791 14.6154 5.18734 14.9767 6.229C15.5666 7.93018 15.8969 9.86814 16.0729 11.25H7.92709ZM17.5846 11.25C17.4086 9.80771 17.0585 7.65426 16.3939 5.73755C16.075 4.81796 15.6717 3.91675 15.1562 3.16684C18.6083 4.27298 21.1296 7.45881 21.2458 11.25H17.5846Z"
    />
  </svg>
);
Umbrella.displayName = "Umbrella";
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
/** Activate / deactivate toggle used by table row actions + confirm popups. */
/** Pill switch (knob on the right when active) — clearer than the circle variant at 16px. */
export const ToggleActive = ({ size = 20, ...rest }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...(rest as Record<string, unknown>)}
  >
    <rect x="2" y="6" width="20" height="12" rx="6" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="16" cy="12" r="3" fill="currentColor" />
  </svg>
);
ToggleActive.displayName = "ToggleActive";
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
/** Close (✕) — plain thin X used by every dialog/sheet/chip close button. */
export const X = ({ strokeWidth = 1.5, ...rest }: IconProps) => (
  <LucideX strokeWidth={Number(strokeWidth)} {...(rest as Record<string, unknown>)} />
);
X.displayName = "CloseX";
/** Plain checkmark (no circle) — checkbox indicator. */
export const CheckMark = LucideCheck;
export const XIcon = X;
export const XCircle = sax("CloseCircle");
export const Zap = sax("Flash");
