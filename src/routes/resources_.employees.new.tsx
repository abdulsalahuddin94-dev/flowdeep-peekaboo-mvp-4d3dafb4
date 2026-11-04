import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronDown, Trash2, Upload } from "@/lib/icons";
import { toast } from "@/lib/toast";
import { departments } from "@/lib/mock-data";
import { useJobRoles } from "@/lib/projects-store";
import { useEmployees, DEFAULT_MONTHLY_CAPACITY } from "@/lib/employees-store";

export const Route = createFileRoute("/resources_/employees/new")({
  component: AddEmployeePage,
  head: () => ({
    meta: [
      { title: "Add employee · Nexus PMO" },
      { name: "description", content: "Register a new employee with personal and employment information." },
      { property: "og:title", content: "Add employee · Nexus PMO" },
      { property: "og:description", content: "Register a new employee with personal and employment information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const T = {
  en: { title: "Add Employee", back: "Back to Employees", basic: "Basic info", employment: "Employment info", save: "Save", cancel: "Cancel" },
  ar: { title: "إضافة موظف", back: "العودة إلى الموظفين", basic: "البيانات الأساسية", employment: "بيانات التوظيف", save: "حفظ", cancel: "إلغاء" },
};
const TAG_OPTIONS = ["Key talent", "Remote", "Part-time", "Certified", "New hire", "Mentor"];
const GENDERS = ["Male", "Female"];

type Form = { name: string; shortName: string; employeeNumber: string; nationalId: string; phone: string; email: string; birthDate: string; gender: string; dept: string; role: string; employmentTypeId: string; joinedOn: string; tags: string[]; avatar: string };
const empty: Form = { name: "", shortName: "", employeeNumber: "", nationalId: "", phone: "", email: "", birthDate: "", gender: "", dept: "", role: "", employmentTypeId: "", joinedOn: "", tags: [], avatar: "" };

/** DS02 empty-image placeholder — grey disc with a light person silhouette. */
function AvatarPlaceholder() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <clipPath id="emp-avatar-clip"><circle cx="50" cy="50" r="50" /></clipPath>
      <circle cx="50" cy="50" r="50" fill="var(--avatar-placeholder-bg)" />
      <g clipPath="url(#emp-avatar-clip)" fill="var(--avatar-placeholder-fg)">
        <circle cx="50" cy="37" r="16" />
        <path d="M50 57c-17.5 0-32 12.5-33 31h66c-1-18.5-15.5-31-33-31z" />
      </g>
    </svg>
  );
}

function AddEmployeePage() {
  const t = T.en;
  const navigate = useNavigate();
  const { jobRoles } = useJobRoles();
  const { employmentTypes, setEmployees } = useEmployees();
  const [f, setF] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: undefined })); };
  const back = () => navigate({ to: "/resources", search: { tab: "people" } });

  function onFile(file?: File) {
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/.test(file.type) || file.size > 5 * 1024 * 1024) { toast.error("Use a JPG or PNG up to 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => set("avatar", String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit() {
    const req = "This field is required.";
    const next: Partial<Record<keyof Form, string>> = {
      name: f.name.trim() ? undefined : req,
      shortName: f.shortName.trim() ? undefined : req,
      employeeNumber: f.employeeNumber.trim() ? undefined : req,
      phone: f.phone.trim() ? undefined : req,
      email: !f.email.trim() ? req : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) ? undefined : "Enter a valid email.",
      birthDate: f.birthDate ? undefined : req,
      gender: f.gender ? undefined : req,
      dept: f.dept ? undefined : req,
      role: f.role ? undefined : req,
      employmentTypeId: employmentTypes.some((v) => v.id === f.employmentTypeId && v.active) ? undefined : req,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    const id = `EMP-${crypto.randomUUID()}`;
    // Salary and capacity are planned per month from the employee profile, not at creation.
    setEmployees((prev) => [...prev, {
      id, name: f.name.trim(), role: f.role, dept: f.dept, email: f.email.trim(), salary: 0, capacity: DEFAULT_MONTHLY_CAPACITY, util: 0,
      employmentTypeId: f.employmentTypeId, joinedOn: f.joinedOn || new Date().toISOString().slice(0, 10),
      projects: [], tasks: [], allocations: [], leave: [], trips: [], monthly: {}, vacationEntitlement: 0, demo: false,
      shortName: f.shortName.trim(), employeeNumber: f.employeeNumber.trim(), nationalId: f.nationalId.trim() || undefined,
      phone: f.phone.trim(), birthDate: f.birthDate, gender: f.gender, tags: f.tags, avatar: f.avatar || undefined,
    }]);
    toast.success(`${f.name.trim()} added to employees`, { description: "Set the monthly salary & capacity from the profile" });
    back();
  }

  return (
    <div>
      <Link to="/resources" search={{ tab: "people" }} className="mb-2 inline-flex items-center gap-2 text-sm text-breadcrumb-muted transition-colors hover:text-breadcrumb-hover">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />{t.back}
      </Link>
      <PageHeader title={t.title} />

      <section className="glass-card w-full p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">{t.basic}</h2>
        <Field label="Profile picture" optional>
          <div className="flex items-center gap-5">
            <div className="group relative h-[116px] w-[116px] shrink-0 overflow-hidden rounded-full">
              {f.avatar ? (
                <img src={f.avatar} alt="Profile preview" className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:blur-[7px] group-hover:brightness-[.45]" />
              ) : (
                <AvatarPlaceholder />
              )}
              {f.avatar ? (
                <button
                  type="button"
                  onClick={() => set("avatar", "")}
                  aria-label="Remove profile picture"
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-8 w-8 text-destructive" />
                </button>
              ) : null}
            </div>
            <div className="space-y-2.5">
              <p className="text-xs text-muted-foreground">JPG or PNG, Max file size 5 MB</p>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-lg bg-secondary px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                <Upload className="h-4 w-4 text-primary" />Click to Upload
                <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
            </div>
          </div>
        </Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="emp-name" error={errors.name}><Input id="emp-name" placeholder="Enter full name" value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Short name" htmlFor="emp-short" error={errors.shortName}><Input id="emp-short" placeholder="Enter short name" value={f.shortName} onChange={(e) => set("shortName", e.target.value)} /></Field>
          <Field label="Employee number" htmlFor="emp-no" error={errors.employeeNumber}><Input id="emp-no" placeholder="Enter employee number" value={f.employeeNumber} onChange={(e) => set("employeeNumber", e.target.value)} /></Field>
          <Field label="National ID" htmlFor="emp-nid" optional><Input id="emp-nid" placeholder="Enter national ID" value={f.nationalId} onChange={(e) => set("nationalId", e.target.value)} /></Field>
          <Field label="Phone number" htmlFor="emp-phone" error={errors.phone}><Input id="emp-phone" type="tel" placeholder="Enter phone number" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email" htmlFor="emp-email" error={errors.email}><Input id="emp-email" type="email" placeholder="Enter email" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Date of birth" htmlFor="emp-dob" error={errors.birthDate}><Input id="emp-dob" type="date" value={f.birthDate} onChange={(e) => set("birthDate", e.target.value)} /></Field>
          <Field label="Gender" htmlFor="emp-gender" error={errors.gender}>
            <Select value={f.gender} onValueChange={(v) => set("gender", v)}><SelectTrigger id="emp-gender"><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
          </Field>
        </div>
      </section>

      <section className="glass-card mt-6 w-full p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">{t.employment}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department" htmlFor="emp-unit" error={errors.dept}>
            <Select value={f.dept} onValueChange={(v) => set("dept", v)}><SelectTrigger id="emp-unit"><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Job role" htmlFor="emp-role" error={errors.role}>
            <Select value={f.role} onValueChange={(v) => set("role", v)}><SelectTrigger id="emp-role"><SelectValue placeholder="Select job role" /></SelectTrigger><SelectContent>{jobRoles.map((r) => <SelectItem key={r.id} value={r.title}>{r.title}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Employment type" htmlFor="emp-type" error={errors.employmentTypeId} hint="Maintained in Organization → Employment types">
            <Select value={f.employmentTypeId} onValueChange={(v) => set("employmentTypeId", v)}><SelectTrigger id="emp-type"><SelectValue placeholder="Select employment type" /></SelectTrigger><SelectContent>{employmentTypes.filter((v) => v.active).map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Hiring date" htmlFor="emp-hire" optional><Input id="emp-hire" type="date" value={f.joinedOn} onChange={(e) => set("joinedOn", e.target.value)} /></Field>
          <Field label="Tags" htmlFor="emp-tags" optional>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button id="emp-tags" type="button" className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-[var(--field-bg-filled)] px-3 text-sm">
                  <span className={f.tags.length ? "truncate text-foreground" : "text-muted-foreground"}>{f.tags.length ? f.tags.join(", ") : "Select tags"}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {TAG_OPTIONS.map((tag) => (
                  <DropdownMenuCheckboxItem key={tag} checked={f.tags.includes(tag)} onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(on) => set("tags", on ? [...f.tags, tag] : f.tags.filter((x) => x !== tag))}>{tag}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
        </div>
        <div className="mt-7 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={back}>{t.cancel}</Button>
          <Button variant="primary" onClick={submit}>{t.save}</Button>
        </div>
      </section>
    </div>
  );
}
