(()=>{
  const clean=s=>String(s||'').replace(/[،,:؛.!؟!?"“”«»()[\]{}]/g,' ').replace(/^(السيد|السيدة|الملك|الملكة|الأمير|الأميرة|الجنرال|القائد|الزعيم|الشيخ|الدكتور|الطبيب|الطفل|الفتى|الفتاة|الرجل|المرأة)\s+/,'').replace(/\s+/g,' ').trim();
  const key=s=>clean(s).toLocaleLowerCase();
  const valid=s=>{s=clean(s);return s.length>=2&&s.length<=32&&/^[\u0600-\u06FF][\u0600-\u06FF\s'’-]*$/.test(s)};
  const bad=new Set(['هذا','هذه','ذلك','تلك','هناك','الرجل','المرأة','الفتى','الفتاة','الطفل','المدينة','القرية','العالم','الوقت','اليوم','الآن','ثم','بعد','قبل','شيء','نفسه','نفسها','إليه','إليها','عليه','عليها','أمام','خلف']);
  const detect=text=>{
    const t=String(text||''), out=new Map();
    const add=(raw,confidence,source)=>{const n=clean(raw);if(!valid(n)||bad.has(key(n)))return;const k=key(n),old=out.get(k);if(!old||confidence>old.confidence)out.set(k,{name:n,confidence,source})};
    // Existing names are always certain.
    (StoryForge.db.characters||[]).forEach(c=>{if(c.name&&t.toLocaleLowerCase().includes(c.name.toLocaleLowerCase()))add(c.name,1,'existing')});
    // Character dialogue headers: "زارن:" / "زارن —" / "زارن :"
    for(const line of t.split(/\n/)){const m=line.trim().match(/^([\u0600-\u06FF][\u0600-\u06FF\s'’-]{1,28}?)\s*(?::|：|—|-|–)\s*(?:[«“"]|$)/);if(m)add(m[1],.99,'dialogue-header')}
    // Introduction patterns.
    for(const m of t.matchAll(/(?:اسمه|اسمها|يدعى|يُدعى|تدعى|تُدعى|كان اسمه|كانت تدعى)\s+([\u0600-\u06FF][\u0600-\u06FF]{1,24})/gu))add(m[1],.97,'introduction');
    // Verb attribution: only capture ONE or TWO short tokens after the verb, never a whole clause.
    const verbs='قال|قالت|يقول|تقول|أجاب|أجابت|سأل|سألت|صرخ|صرخت|همس|همست|هتف|هتفت|أعلن|أعلنت|فكر|فكرت|نظر|نظرت|وصل|وصلت|ظهر|ظهرت|ابتسم|ابتسمت|بكى|بكت|ركض|ركضت|استدار|استدارت|التفت|التفتت|دخل|دخلت|خرج|خرجت|اقترب|اقتربت|غادر|غادرت|وقف|وقفت|جلس|جلست|عاد|عادت|اختفى|اختفت|أمسك|أمسكت|رفع|رفعت|خفض|خفضت';
    const re1=new RegExp(`(?:${verbs})\\s+(?:إلى\\s+|بـ\\s+)?([\\u0600-\\u06FF][\\u0600-\\u06FF]{1,24}(?:\\s+[\\u0600-\\u06FF][\\u0600-\\u06FF]{1,18})?)(?=\\s*(?:،|:|：|—|!|؟|\\.|$|ثم|وهو|وهي|الذي|التي))`,'gmu');
    for(const m of t.matchAll(re1))add(m[1],.88,'verb-attribution');
    // Reverse form: "زارن قال" / "لورا أجابت".
    const re2=new RegExp(`([\\u0600-\\u06FF][\\u0600-\\u06FF]{1,24})\\s+(?:${verbs})(?=\\s|:|،|\\.|!|؟)`,'gmu');
    for(const m of t.matchAll(re2))add(m[1],.9,'reverse-attribution');
    // Repeated standalone proper-looking tokens: only promote when repeated and seen near a speech/action verb.
    const freq=new Map();for(const m of t.matchAll(/(?<![\u0600-\u06FF])([\u0600-\u06FF]{3,18})(?![\u0600-\u06FF])/gu)){const w=m[1];if(!bad.has(key(w)))freq.set(key(w),(freq.get(key(w))||0)+1)}
    for(const [k,n] of freq){if(n<2||out.has(k))continue;const original=[...t.matchAll(new RegExp(k,'giu'))][0]?.[1]||k;const context=new RegExp(`(?:قال|قالت|أجاب|أجابت|سأل|سألت|نظر|نظرت|صرخ|صرخت|ابتسم|ابتسمت)\\s+${k}|${k}\\s+(?:قال|قالت|أجاب|أجابت|سأل|سألت|نظر|نظرت|صرخ|صرخت|ابتسم|ابتسمت)`,'iu');if(context.test(t))add(original,.84,'repeated-context')}
    return [...out.values()].sort((a,b)=>b.confidence-a.confidence);
  };
  const originalIngest=StoryForge.ingestChapterCharacters;
  StoryForge.characterCandidates=detect;
  StoryForge.ingestChapterCharacters=(text,chapterId)=>{
    const detected=detect(text),added=[],linked=[],chapter=StoryForge.db.chapters.find(c=>c.id===chapterId);if(!chapter)return {candidates:detected,added,linked};
    chapter.characterIds=Array.isArray(chapter.characterIds)?chapter.characterIds:[];
    for(const hit of detected){let c=StoryForge.db.characters.find(x=>key(x.name)===key(hit.name));if(!c){c=StoryForge.create('characters',{name:hit.name,source:'auto-chapter',autoCreated:true,autoDetection:{confidence:hit.confidence,source:hit.source},profile:{},firstAppearanceChapterId:chapterId,appearanceChapterIds:[chapterId]});added.push(c)}else{c.appearanceChapterIds=Array.isArray(c.appearanceChapterIds)?c.appearanceChapterIds:[];if(!c.appearanceChapterIds.includes(chapterId))c.appearanceChapterIds.push(chapterId);c.lastAppearanceChapterId=chapterId;c.updatedAt=new Date().toISOString()}if(!chapter.characterIds.includes(c.id)){chapter.characterIds.push(c.id);linked.push(c)}}
    chapter.autoDetectedCharacterIds=added.map(x=>x.id);chapter.characterDetection={count:detected.length,at:new Date().toISOString(),candidates:detected};StoryForge.save();return {candidates:detected,added,linked};
  };
})();