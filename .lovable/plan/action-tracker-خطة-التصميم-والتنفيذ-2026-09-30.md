# Action Tracker — خطة التصميم والتنفيذ

## رأيي: الإدخال فين والعرض فين
المبدأ: **مصدر واحد للأكشنز** (Action Tracker) — والـRisk/Issue بيعرضوا الأكشنز المرتبطة بيهم بس، مش نسخة منفصلة.

| المكان | إدخال | عرض |
|---|---|---|
| **Action Tracker tab** (جنب Status Reports) | إضافة أي أكشن (Risk / Issue / Meeting / General) | كل أكشنز المشروع + فلاتر |
| **Risk drawer** | زرار "Add action" (مربوط بالـRisk تلقائياً) | قسم **Mitigation actions** بدل نص الـMitigation plan: عدد مفتوح/مقفول + قائمة مختصرة |
| **Issue drawer** | نفس الكلام، مربوط بالـIssue | قسم **Action plan actions** |
| **Risk & Issues module** | — | عمود صغير "Actions" (مثلاً 2/5 مقفولة، أحمر لو فيه متأخر) |

الـMitigation plan النصي يفضل كـ"وصف الاستراتيجية" (Summary)، والأكشنز هي خطوات التنفيذ القابلة للمتابعة.

## Action = سجل واحد
- Title، Description
- Source: Risk / Issue / Progress meeting / General + الرابط (Risk ID / Issue ID / اسم وتاريخ الميتنج)
- Owner (شخص) + **Responsibility: Internal / Client / Vendor**
- Due date، Closed date (يتسجل تلقائياً عند الإغلاق)
- Status: Open / In Progress / Done / Cancelled
- **Overdue مشتق** (Due date فات والأكشن مش Done) — مش بيتخزن
- **Comments & Updates**: تحديثات مؤرخة بالاسم، مع Edit/Delete زي الـRisk

## Action Tracker tab
- KPI strip: Open · Overdue · Due this week · Done · **My actions**
- Toolbar: Search بالعنوان + Filter drawer: Source، Responsibility (Internal/Client/Vendor)، Owner، Status، Overdue only، Due date range
- Quick toggle: **My actions** (أكشنز المستخدم الحالي)
- Table: ID · Action · Source (pill قابل للضغط يفتح الـRisk/Issue) · Owner · Responsibility · Due date (أحمر لو متأخر + "3d overdue") · Status (آخر عمود، يتبدل بالأكشنز مع الـHover)
- Row click → **Drawer** (حسب قاعدة Modal vs Drawer): التفاصيل + Comments & Updates + زرار Update status
- **Log meeting actions**: نافذة تسجّل اسم/تاريخ الميتنج وتضيف كذا أكشن مرة واحدة

## تغييرات إضافية
- تغيير "Status updates" في Risk drawer (و"Comments" في Issue drawer) إلى **Comments & Updates**.
- Demo data لمشروع ERP: أكشنز من Risk و Issue و Meeting، فيهم متأخر ومقفول وعلى العميل.
- تحديث SESSIONS.md و DS02/DESIGN.md و roadmap.md، وتحقق في المتصفح.

## Technical details
- Store جديد `src/lib/action-store.tsx` بنفس أسلوب `risk-store` (shared outside React) عشان التاب والـdrawers يقروا نفس البيانات.
- مكوّن `src/components/actions/ActionTracker.tsx` (tab + drawer + form + meeting dialog) يُعاد استخدامه في Risk/Issue drawers كـ`LinkedActions`.
- Overdue يُحسب من Due date والـStatus وقت العرض؛ التواريخ ISO للتخزين والعرض بـ`formatDateWithYear`.
- كل النصوص EN + AR مع RTL.
