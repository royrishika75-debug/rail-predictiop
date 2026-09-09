pages/HistoricalReplay.tsx`,fV=[{time:`10:00`,actual:0,predicted:2,error:2},{time:`10:30`,actual:5,predicted:6,error:1},{time:`11:15`,actual:12,predicted:10,error:-2},{time:`12:00`,actual:18,predicted:16,error:-2},{time:`13:00`,actual:22,predicted:24,error:2},{time:`14:00`,actual:20,predicted:21,error:1},{time:`15:00`,actual:17,predicted:18,error:1},{time:`16:00`,actual:15,predicted:14,error:-1},{time:`17:00`,actual:12,predicted:13,error:1},{time:`18:00`,actual:10,predicted:10,error:0},{time:`19:00`,actual:9,predicted:10,error:1}];

function pV({children:e,className:t=``}){return
  jsxDEV(`div`,{className:`bg-[#0C1526] border border-[#1A2840] rounded-lg ${t}`,children:e},
  // {fileName:Q,lineNumber:19,columnNumber:10},this)}
var mV=({active:e,payload:t,label:n})=>e&&t?.length?
  jsxDEV(`div`,{className:`bg-[#0C1526] border border-[#1A2840] rounded px-3 py-2 text-xs font-data shadow-xl`,children:[
  jsxDEV(`div`,{className:`text-[#7A95B0] mb-1`,children:n},
  // {fileName:Q,lineNumber:26,columnNumber:9},void 0),t.map(e=>
  jsxDEV(`div`,{style:{color:e.color},children:[e.name,`: `,e.value,` min`]},e.dataKey,!0,{fileName:Q,lineNumber:28,columnNumber:11},void 0))]},
  // {fileName:Q,lineNumber:25,columnNumber:7},void 0):null;

function hV(){let[e,t]=(0,b.useState)(0),[n,r]=(0,b.useState)(!1),[i,a]=(0,b.useState)(null),o=fV[e],s=()=>{if(n){i&&clearInterval(i),a(null),r(!1);return}t(0),r(!0);
let e=setInterval(()=>{t(t=>t>=fV.length-1?(clearInterval(e),r(!1),t):t+1)},600);a(e)},c=fV.slice(0,e+1);return
  jsxDEV(`div`,{className:`p-6 max-w-6xl mx-auto space-y-5`,children:[
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1`,children:`Analysis`},
  // {fileName:Q,lineNumber:72,columnNumber:9},this),
  jsxDEV(`h1`,{className:`font-display text-2xl font-bold text-white`,children:`Historical Journey Replay`},
  // {fileName:Q,lineNumber:73,columnNumber:9},this),
  jsxDEV(`p`,{className:`text-sm text-[#4A6080] mt-1`,children:`Evaluate forecasting system against known historical outcomes.`},
  // {fileName:Q,lineNumber:74,columnNumber:9},this)]},
  // {fileName:Q,lineNumber:71,columnNumber:7},this),
  jsxDEV(pV,{className:`p-5`,children:
  jsxDEV(`div`,{className:`grid grid-cols-2 md:grid-cols-4 gap-3`,children:[
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-[11px] font-data text-[#4A6080] mb-1`,children:`Train`},
  // {fileName:Q,lineNumber:81,columnNumber:13},this),
  jsxDEV(`select`,{className:`w-full bg-[#112035] border border-[#1A2840] rounded text-sm text-[#B8D0E8] px-2 py-1.5 outline-none`,children:[
  jsxDEV(`option`,{children:`12625 — Kerala Express`},
  // {fileName:Q,lineNumber:83,columnNumber:15},this),
  jsxDEV(`option`,{children:`12760 — Charminar SF`},
  // {fileName:Q,lineNumber:84,columnNumber:15},this),
  jsxDEV(`option`,{children:`17016 — Visakha Express`},
  // {fileName:Q,lineNumber:85,columnNumber:15},this)]},
  // {fileName:Q,lineNumber:82,columnNumber:13},this)]},
  // {fileName:Q,lineNumber:80,columnNumber:11},this),
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-[11px] font-data text-[#4A6080] mb-1`,children:`Date`},
  // {fileName:Q,lineNumber:89,columnNumber:13},this),
  jsxDEV(`select`,{className:`w-full bg-[#112035] border border-[#1A2840] rounded text-sm text-[#B8D0E8] px-2 py-1.5 outline-none`,children:[
  jsxDEV(`option`,{children:`2024-09-01`},
  // {fileName:Q,lineNumber:91,columnNumber:15},this),
  jsxDEV(`option`,{children:`2024-08-31`},
  // {fileName:Q,lineNumber:92,columnNumber:15},this),
  jsxDEV(`option`,{children:`2024-08-30`},
  // {fileName:Q,lineNumber:93,columnNumber:15},this)]},
  // {fileName:Q,lineNumber:90,columnNumber:13},this)]},
  // {fileName:Q,lineNumber:88,columnNumber:11},this),
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-[11px] font-data text-[#4A6080] mb-1`,children:`Model`},
  // {fileName:Q,lineNumber:97,columnNumber:13},this),
  jsxDEV(`select`,{className:`w-full bg-[#112035] border border-[#1A2840] rounded text-sm text-[#B8D0E8] px-2 py-1.5 outline-none`,children:[
  jsxDEV(`option`,{children:`RailPredict V2`},
  // {fileName:Q,lineNumber:99,columnNumber:15},this),
  jsxDEV(`option`,{children:`RailPredict V1`},
  // {fileName:Q,lineNumber:100,columnNumber:15},this),
  jsxDEV(`option`,{children:`Baseline (XGBoost)`},
  // {fileName:Q,lineNumber:101,columnNumber:15},this)]},
  // {fileName:Q,lineNumber:98,columnNumber:13},this)]},
  // {fileName:Q,lineNumber:96,columnNumber:11},this),
  jsxDEV(`div`,{className:`flex items-end`,children:
  jsxDEV(`button`,{onClick:s,className:`w-full py-1.5 rounded text-sm font-medium transition-all ${n?`bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40`:`bg-[#3B82F6] hover:bg-[#2563EB] text-white`}`,children:n?`⏹ Stop`:`⏮ Replay Journey`},
  // {fileName:Q,lineNumber:105,columnNumber:13},this)},
  // {fileName:Q,lineNumber:104,columnNumber:11},this)]},
  // {fileName:Q,lineNumber:79,columnNumber:9},this)},
  // {fileName:Q,lineNumber:78,columnNumber:7},this),
  jsxDEV(`div`,{className:`grid grid-cols-1 lg:grid-cols-3 gap-5`,children:[
  jsxDEV(pV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4`,children:`Journey Timeline`},
  // {fileName:Q,lineNumber:123,columnNumber:11},this),
  jsxDEV(`div`,{className:`space-y-0`,children:fV.map((n,a)=>{
let o=a===e,s=a<e;return
  jsxDEV(`button`,{onClick:()=>{t(a),r(!1),i&&clearInterval(i)},className:`w-full flex items-center gap-3 py-2 px-2 rounded transition-all text-left ${o?`bg-[#1A2F50]`:s?`opacity-70 hover:bg-[#112035]`:`opacity-30 hover:bg-[#112035]`}`,children:[
  jsxDEV(`div`,{className:`w-2 h-2 rounded-full flex-shrink-0 ${o?`bg-[#3B82F6]`:s?`bg-[#2A4470]`:`bg-[#1A2840]`}`},
  // {fileName:Q,lineNumber:136,columnNumber:19},this),
  jsxDEV(`div`,{className:`flex-1`,children:
  jsxDEV(`div`,{className:`font-data text-xs ${o?`text-[#3B82F6]`:s?`text-[#7A95B0]`:`text-[#3B5E8C]`}`,children:n.time},
  // {fileName:Q,lineNumber:138,columnNumber:21},this)},
  // {fileName:Q,lineNumber:137,columnNumber:19},this),s||o?
  jsxDEV(`div`,{className:`flex gap-3 font-data text-[10px]`,children:[
  jsxDEV(`span`,{style:{color:n.actual>15?`#EF4444`:n.actual>8?`#F59E0B`:`#10B981`},children:[`A:`,n.actual]},
  // {fileName:Q,lineNumber:142,columnNumber:23},this),
  jsxDEV(`span`,{className:`text-[#3B82F6]`,children:[`P:`,n.predicted]},
  // {fileName:Q,lineNumber:143,columnNumber:23},this)]},
  // {fileName:Q,lineNumber:141,columnNumber:21},this):null]},n.time,!0,{fileName:Q,lineNumber:129,columnNumber:17},this)})},
  // {fileName:Q,lineNumber:124,columnNumber:11},this)]},
  // {fileName:Q,lineNumber:122,columnNumber:9},this),
  jsxDEV(`div`,{className:`lg:col-span-2 space-y-4`,children:[
  jsxDEV(pV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3`,children:[`Snapshot @ `,o.time]},
  // {fileName:Q,lineNumber:156,columnNumber:13},this),
  jsxDEV(`div`,{className:`grid grid-cols-3 gap-3`,children:[{label:`Actual Delay`,value:`+${o.actual} min`,color:o.actual>15?`#EF4444`:o.actual>8?`#F59E0B`:`#10B981`},{label:`Predicted Delay`,value:`+${o.predicted} min`,color:`#3B82F6`},{label:`Prediction Error`,value:`${o.error>0?`+`:``}${o.error} min`,color:Math.abs(o.error)<=2?`#10B981`:`#F59E0B`}].map(e=>
  jsxDEV(`div`,{className:`bg-[#112035] rounded p-3 text-center`,children:[
  jsxDEV(`div`,{className:`text-[10px] font-data text-[#4A6080] mb-1`,children:e.label},
  // {fileName:Q,lineNumber:164,columnNumber:19},this),
  jsxDEV(`div`,{className:`font-data font-bold text-lg`,style:{color:e.color},children:e.value},
  // {fileName:Q,lineNumber:165,columnNumber:19},this)]},e.label,!0,{fileName:Q,lineNumber:163,columnNumber:17},this))},
  // {fileName:Q,lineNumber:157,columnNumber:13},this)]},
  // {fileName:Q,lineNumber:155,columnNumber:11},this),
  jsxDEV(pV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3`,children:`Actual vs. RailPredict Forecast`},
  // {fileName:Q,lineNumber:173,columnNumber:13},this),
  jsxDEV(vu,{width:`100%`,height:220,children:
  jsxDEV(bB,{data:c,margin:{top:4,right:16,left:-20,bottom:0},children:[
  jsxDEV(sP,{strokeDasharray:`3 3`,stroke:`#112035`},
  // {fileName:Q,lineNumber:176,columnNumber:17},this),
  jsxDEV(mR,{dataKey:`time`,tick:{fontSize:10,fill:`#4A6080`,fontFamily:`JetBrains Mono`},axisLine:!1,tickLine:!1},
  // {fileName:Q,lineNumber:177,columnNumber:17},this),
  jsxDEV(kR,{tick:{fontSize:10,fill:`#4A6080`,fontFamily:`JetBrains Mono`},axisLine:!1,tickLine:!1,unit:`m`},
  // {fileName:Q,lineNumber:178,columnNumber:17},this),
  jsxDEV(LD,{content:
  jsxDEV(mV,{},
  // {fileName:Q,lineNumber:179,columnNumber:35},this)},
  // {fileName:Q,lineNumber:179,columnNumber:17},this),
  jsxDEV(Md,{wrapperStyle:{fontSize:11,fontFamily:`JetBrains Mono`,color:`#4A6080`}},
  // {fileName:Q,lineNumber:180,columnNumber:17},this),
  jsxDEV(RM,{y:0,stroke:`#1A2840`},
  // {fileName:Q,lineNumber:181,columnNumber:17},this),
  jsxDEV(dF,{type:`monotone`,dataKey:`actual`,stroke:`#F59E0B`,strokeWidth:2,dot:{fill:`#F59E0B`,r:3},name:`Actual`},
  // {fileName:Q,lineNumber:182,columnNumber:17},this),
  jsxDEV(dF,{type:`monotone`,dataKey:`predicted`,stroke:`#3B82F6`,strokeWidth:2,strokeDasharray:`4 2`,dot:{fill:`#3B82F6`,r:3},name:`Predicted`},
  // {fileName:Q,lineNumber:183,columnNumber:17},this)]},
  // {fileName:Q,lineNumber:175,columnNumber:15},this)},
  // {fileName:Q,lineNumber:174,columnNumber:13},this)]},
  // {fileName:Q,lineNumber:172,columnNumber:11},this),
  jsxDEV(pV,{className:`p-4`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3`,children:`Replay Summary · Demo Data`},
  // {fileName:Q,lineNumber:190,columnNumber:13},this),
  jsxDEV(`div`,{className:`grid grid-cols-4 gap-3`,children:[{label:`Journey MAE`,value:`1.8 min`},{label:`Max Error`,value:`3 min`},{label:`Within ±5 min`,value:`100%`},{label:`Model Version`,value:`V2`}].map(e=>
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-[10px] text-[#4A6080] font-data`,children:e.label},
  // {fileName:Q,lineNumber:199,columnNumber:19},this),
  jsxDEV(`div`,{className:`font-data font-semibold text-sm text-white`,children:e.value},
  // {fileName:Q,lineNumber:200,columnNumber:19},this)]},e.label,!0,{fileName:Q,lineNumber:198,columnNumber:17},this))},
  // {fileName:Q,lineNumber:191,columnNumber:13},this)]},
  // {fileName:Q,lineNumber:189,columnNumber:11},this)]},
  // {fileName:Q,lineNumber:153,columnNumber:9},this)]},
  // {fileName:Q,lineNumber:120,columnNumber:7},this)]},
  // {fileName:Q,lineNumber:70,columnNumber:5},this)}
var $=`/workspaces/default/.publishing/src/