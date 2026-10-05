import { useCallback, useEffect, useState } from "react";
import { logActivity } from "@/lib/activity-store";

/**
 * Project meetings register. Actions raised in a meeting live in the Action
 * Tracker and point back here via `meetingId`.
 */

export type AttendeeParty = "Internal" | "Client" | "Vendor" | "Stakeholder" | "Other";
export const ATTENDEE_PARTIES: AttendeeParty[] = ["Internal", "Client", "Vendor", "Stakeholder", "Other"];

export type MeetingType = "Progress meeting" | "Steering committee" | "Workshop" | "Client review" | "Other";
export const MEETING_TYPES: MeetingType[] = ["Progress meeting", "Steering committee", "Workshop", "Client review", "Other"];

export type Attendee = { id: string; name: string; party: AttendeeParty; organization?: string; email?: string };

export type Meeting = {
  id: string;
  project: string;
  title: string;
  type: MeetingType;
  /** ISO date. */
  date: string;
  /** HH:mm, optional. */
  time?: string;
  location?: string;
  notes?: string;
  attendees: Attendee[];
  cancelled?: boolean;
};

export type MeetingStatus = "Scheduled" | "Held" | "Cancelled";
const todayIso = () => new Date().toISOString().slice(0, 10);
/** Status is derived from the date (except an explicit cancellation). */
export function meetingStatus(m: Pick<Meeting, "date" | "cancelled">, today = todayIso()): MeetingStatus {
  if (m.cancelled) return "Cancelled";
  return m.date > today ? "Scheduled" : "Held";
}

const P = "ERP System Upgrade";
const SEED: Meeting[] = [
  {
    id: "M-001", project: P, title: "Steering committee", type: "Steering committee", date: "2026-09-10", time: "10:00", location: "Board room",
    notes: "Reviewed phase 2 readiness and training logistics.",
    attendees: [
      { id: "at1", name: "Aisha Khoury", party: "Internal" },
      { id: "at2", name: "Sara Al-Rashid", party: "Internal" },
      { id: "at3", name: "Client Finance Lead", party: "Client", organization: "Client" },
      { id: "at4", name: "Ministry Liaison", party: "Stakeholder", organization: "Ministry of Digital Economy" },
    ],
  },
  {
    id: "M-002", project: P, title: "Weekly progress meeting", type: "Progress meeting", date: "2026-09-24", time: "09:30", location: "Teams",
    attendees: [
      { id: "at1", name: "Aisha Khoury", party: "Internal" },
      { id: "at2", name: "Mei Chen", party: "Internal" },
      { id: "at3", name: "Client IT Manager", party: "Client", organization: "Client" },
      { id: "at4", name: "Omar Haddad", party: "Vendor", organization: "SAP Partner" },
    ],
  },
  {
    id: "M-003", project: P, title: "Cutover readiness workshop", type: "Workshop", date: "2026-10-20", time: "13:00", location: "Workshop room B",
    attendees: [
      { id: "at1", name: "John Smith", party: "Internal" },
      { id: "at2", name: "Omar Haddad", party: "Vendor", organization: "SAP Partner" },
    ],
  },
];

let state: Meeting[] = SEED;
const listeners = new Set<() => void>();
function set(next: Meeting[]) { state = next; listeners.forEach((l) => l()); }

export function useMeetings() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const addMeeting = useCallback((m: Omit<Meeting, "id">, by: string) => {
    const n = Math.max(0, ...state.map((x) => Number(x.id.replace(/\D/g, "")) || 0));
    const id = `M-${String(n + 1).padStart(3, "0")}`;
    logActivity({ project: m.project, kind: "Meeting", ref: id, title: m.title, text: "Meeting created", by });
    set([{ ...m, id }, ...state]);
    return id;
  }, []);
  const updateMeeting = useCallback((id: string, patch: Partial<Meeting>, by: string) => {
    const m = state.find((x) => x.id === id);
    if (m) logActivity({ project: m.project, kind: "Meeting", ref: id, title: patch.title ?? m.title, text: "Meeting details edited", by });
    set(state.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);
  const removeMeeting = useCallback((id: string, by: string) => {
    const m = state.find((x) => x.id === id);
    if (m) logActivity({ project: m.project, kind: "Meeting", ref: id, title: m.title, text: "Meeting deleted", by });
    set(state.filter((x) => x.id !== id));
  }, []);

  return { meetings: state, addMeeting, updateMeeting, removeMeeting };
}
