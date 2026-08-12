# تعميم تجربة Organization على البروجيكت كله

الهدف: كل صفحة في التطبيق تبقى بنفس الـ pattern اللي شوفته في Cost Categories — Breadcrumb، Subpages في الـ Sidebar، Toolbar موحد (Search + Filter + Main CTA)، وجداول/Popups/Buttons من نفس الـ Design System.

## 1) مكوّنات مشتركة جديدة (Design System layer)

- `PageShell` — Breadcrumb (Parent > Current) + Title اختياري، بدل ما كل صفحة تعمل header بشكل مختلف.
- `Toolbar` — Search (rounded, 36px) + Filter button (بعدّاد الفلاتر) على الشمال، Main CTA على اليمين. نفس اللي في Organization بالحرف.
- `DataTable` wrapper — يجمع StyledTable + TableRowActions (hover: edit/delete دائرية) + TablePagination بشكل ثابت.
- توحيد `PageHeader` القديم ليستخدم PageShell (أو يتشال).
- كل الألوان/المقاسات من tokens في `src/styles.css` — مفيش hex في الكومبوننتس.

## 2) Sidebar — Page + Subpages لكل موديول

نفس أسلوب Organization (collapsible + gradient pill على الـ subpage النشط):

- Portfolio → All Projects / Gantt (والـ tabs الأعمق تفضل جوة الصفحة)
- Resources → Capacity / Requests
- Financials → Overview (P&L) / Costs / CapEx-OpEx / Recognition
- Clients & Vendors → Clients / Vendors
- Approvals يفضل زي ما هو (badge)
- الصفحات المخفية (Pipeline / Risks / Reports / Procurement / Settings) تتجهّز بنفس الشكل عشان لما تتفتح تبقى متسقة

كل subpage بتشتغل بـ `?tab=` في URL زي Organization.

## 3) تطبيق على الصفحات (واحدة واحدة)

| صفحة | التعديل |
|---|---|
| Dashboard (`index.tsx`) | Breadcrumb + KPI cards على tokens الجديدة |
| Portfolio list | Breadcrumb، Toolbar موحّد، جدول موحّد + pagination، ألوان RAG الهادية |
| Project detail | Breadcrumb (Portfolio > اسم المشروع)، الـ tabs تفضل جوة الصفحة، Toolbars داخلية موحّدة |
| Resources | Breadcrumb + subpages + Toolbar + جدول موحّد |
| Financials | Breadcrumb + subpages + Toolbar + جداول موحّدة |
| Clients & Vendors | Breadcrumb + subpages + Toolbar + جدول موحّد |
| Approvals | Breadcrumb + جدول موحّد |
| Auth | ألوان/buttons/inputs بالتوكنز الجديدة فقط |
| Hidden pages | نفس المعالجة لو موجودة في الكود |

## 4) توحيد الـ Components القديمة

- كل الـ Dialogs تتحول لـ `form-dialog` (16px radius, Iconsax close) و `confirm-dialog` للتأكيدات (success/info/warning/danger).
- كل الـ buttons/inputs/selects: 36px height، 8px radius، states من الـ palette الجديد.
- Checkbox 20×20 + الأيقونة الحالية.
- كل الأيقونات من Iconsax عبر `@/lib/icons` (مفيش imports مباشرة).
- Tables: hover row token، actions دائرية عند الـ hover، pagination موحّد.

## ملاحظات تقنية

- مفيش تغيير في الـ business logic أو الداتا — عرض وتنسيق فقط.
- التغييرات الأساسية في `src/styles.css` + كومبوننتس مشتركة، والصفحات تستهلكها، فأي تعديل مستقبلي يبقى في مكان واحد.
