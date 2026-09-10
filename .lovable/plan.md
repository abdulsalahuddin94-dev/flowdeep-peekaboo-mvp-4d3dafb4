# خطة تنفيذ الطلب (النقطة 01 + تعديلات البروجيكت والمخاطر والماليات)

الطلب كبير ومتشعب، فهقسمه لـ 6 مراحل منفصلة. كل مرحلة تشتغل لوحدها وتتسلم جاهزة.

---

## المرحلة 1 — التصنيفات والقواعد في Organization

- تاب جديد **Risk Categories** جوه Organization بنفس تجربة Tags و Cost Categories:
  إضافة/تعديل/حذف + عمود Status مع سويتش تنشيط/تعطيل + Related Projects.
- التصنيفات المعطّلة تختفي من قوائم اختيار المخاطر الجديدة، وتفضل ظاهرة على المخاطر القديمة.
- في **Rules & Thresholds** قسم جديد **Risk & Issues**: حدود الـScore لكل مستوى
  (Critical / High / Medium / Low) + وصف مقاييس Probability و Impact من 1 لـ 5.

عن سؤالك: أرقام 1–5 ومصفوفة 5×5 هي فعلاً الشائعة عالمياً (PMI/PMBOK)،
لكن **حدود المستويات نفسها بتختلف من شركة لشركة**، فتنفيذ التهيئة له لزوم فعلاً.

---

## المرحلة 2 — دورة حياة المخاطرة

- سجل تحديثات لكل مخاطرة: تعليق حر + توثيق أي تغيير في Probability / Impact / Score / Status،
  مع اسم مين غيّر وتاريخ التغيير.
- «Update risk status» يتحول من حقل Mitigation plan إلى حقل **Comment** إجباري
  مع إمكانية تعديل الخطورة في نفس الخطوة (خفض الخطورة يبقى خطوة موثقة).
- عند فتح أي مخاطرة من الجدول: الـSide panel يعرض Mitigation plan وتحته
  **Status updates** تحت بعضها بالتاريخ.
- زر **Convert to Issue** على المخاطرة: بينشئ Issue مربوط تلقائياً بالمخاطرة
  ويحوّل حالتها لـ Realized.
- إزالة **Risk Owner** من نافذة Log a new risk.
- تاب **Risk & Issues** جوه صفحة البروجيكت جنب Status Reports (مفلتر على البروجيكت).

---

## المرحلة 3 — تعديلات جدول الـWBS

- Manage Dependencies: قسم **Add New Dependency** يبقى فوق، و**Current Dependencies**
  تحته بارتفاع ثابت وScroll داخلي مع Remove لكل عنصر — النافذة مش هتكبر أبداً.
- Progress Update: يعرض التاسك المفتوحة فقط، وإلغاء قائمة تاسكات الـMilestone بالكامل.
- الـRight click: إزالة **Edit**؛ التعديل يبقى مباشر على الجدول.
  الـType مش قابل للتغيير من الجدول، والـ**Financial link** بالضغط على الخلية
  يفتح نافذة Link financial items المعروفة.

---

## المرحلة 4 — فصل الماليات لـ Cost و Revenue

- تاب Financials جوه البروجيكت يتقسم **Cost** و **Revenue** (الـRevenue يختفي للمشاريع الداخلية).
- كل تاب فيه Finance link خاص به.
- **Cost breakdown table**: لكل بند Cost Category (من بيانات Organization) + الاسم + الوصف
  + Amount + Date، والربط بأي Milestone لاحقاً يحدّث التاريخ تلقائياً من تاريخ الـMilestone.
- إدخال **Actual spent** مقابل الـPlanned، ونسبة الاستخدام (Utilization) ظاهرة على كل بند
  وعلى إجمالي التاب.
- جدول Revenue plan: كل Row **بيتوسّع** ويظهر تحته الـActuals بتواريخها.
- حذف الجدول الموجود في الصورة (Revenue Recognition — sample).

الـBest practice المتبعة في أنظمة الـPMO: صف واحد للـPlanned وتحته الـActuals
كـsub-rows مع عمود Variance و Utilization ملوّن — وده اللي هنمشي عليه.

---

## المرحلة 5 — Baseline على مستوى البروجيكت

- إزالة Baseline من كل تاب على حدة.
- **Save Baseline** واحد على مستوى البروجيكت (يغطي الـWBS والماليات مع بعض).
- قبل الـBaseline: التعديل مفتوح في كل مكان. بعده: التعديل من خلال **Change plan**
  من قائمة الـ3 نقط فوق يمين فقط.
- نقل **Baseline Version Dropdown** من جوه التابات (WBS/Gantt والماليات)
  لأعلى الصفحة جنب Submit status.

---

## المرحلة 6 — مراجعة نهائية

مراجعة الشاشات كلها، والتأكد إن كل نافذة ماشية على الـDesign System المتفق عليه،
وإن مافيش أخطاء بناء.

---

## ملاحظات فنية

- التصنيفات وقواعد المخاطر تُخزَّن بنفس أسلوب `org-rules` و `org-active` الحالي.
- سجل تحديثات المخاطرة يُخزَّن كمصفوفة `updates[]` على المخاطرة.
- الـFinancial links تكمل على `FinanceLinksProvider` الحالي مع إضافة الـActuals.
- الـBaseline يتحول من `useTabBaseline` لحالة واحدة على مستوى البروجيكت.
