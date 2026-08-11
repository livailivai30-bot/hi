# Story Forge

نظام تشغيل محلي للكاتب لإدارة الروايات والمانغا والقصص الطويلة.

## الأنظمة
- Central Story Database v4
- Character Bible + Character State
- World Bible
- Story → Arc → Act → Chapter → Scene → Event
- Relationships + Lore Graph
- Timeline Engine + ages + states + secret events + flashback/flash-forward metadata
- Continuity Engine
- Foreshadowing Manager
- Mystery & Secret Tracker
- Power System + ability usage tracker
- Story Analytics
- Writing Workspace + inline entity references
- AI Story Analyst + secure optional AI Bridge
- Global Search + Command Palette
- Autosave + local version snapshots + Undo/Redo + Import/Export
- Mobile-first PWA/offline cache

## التخزين
المشروع يحفظ بياناته محليًا في المتصفح. الإصدار الحالي من نموذج البيانات هو `story-forge-v4`.
الاستيراد والتصدير JSON يحافظان على الكيانات والروابط.

## الأمان
لا يوجد مفتاح API داخل ملفات GitHub Pages. عند استخدام AI خارجي، يوصى باستخدام Backend/Bridge يحتفظ بالسر خارج المتصفح.

## قاعدة التصميم
Story Forge مخصص لإدارة وكتابة القصة. لا توجد أدوات رسم أو تصميم بصري للفصول.