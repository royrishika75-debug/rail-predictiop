pages/NetworkIntelligence.tsx`,LB=[{id:`12625`,name:`Kerala Express`,status:`delayed`,delay:18,position:0},{id:`12760`,name:`Charminar SF`,status:`high-risk`,delay:8,position:2},{id:`17016`,name:`Visakha Express`,status:`on-time`,delay:2,position:3}],RB=[80,170,260,350,440],zB=[`Vijayawada Junction`,`Khammam`,`Warangal`,`Kazipet`,`Secunderabad Junction`],BB={"on-time":`#10B981`,delayed:`#F59E0B`,"high-risk":`#EF4444`};

function VB({children:e,className:t=``}){return
  jsxDEV(`div`,{className:`bg-[#0C1526] border border-[#1A2840] rounded-lg ${t}`,children:e},
  // {fileName:Y,lineNumber:27,columnNumber:10},this)}

function HB(){let[e,t]=(0,b.useState)(`12625`),n=LB.find(t=>t.id===e);return
  jsxDEV(`div`,{className:`p-6 max-w-7xl mx-auto space-y-5`,children:[
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1`,children:`Network Intelligence`},
  // {fileName:Y,lineNumber:38,columnNumber:9},this),
  jsxDEV(`h1`,{className:`font-display text-2xl font-bold text-white`,children:`Network Delay Propagation`},
  // {fileName:Y,lineNumber:39,columnNumber:9},this),
  jsxDEV(`p`,{className:`text-sm text-[#4A6080] mt-1`,children:`Forecasted network impact — decision support only.`},
  // {fileName:Y,lineNumber:40,columnNumber:9},this)]},
  // {fileName:Y,lineNumber:37,columnNumber:7},this),
  jsxDEV(`div`,{className:`grid grid-cols-1 lg:grid-cols-3 gap-5`,children:[
  jsxDEV(VB,{className:`lg:col-span-2 p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4`,children:`Railway Network — South Central Zone`},
  // {fileName:Y,lineNumber:46,columnNumber:11},this),
  jsxDEV(`svg`,{viewBox:`0 0 600 520`,className:`w-full`,style:{height:360},children:[
  jsxDEV(`line`,{x1:`100`,y1:RB[0],x2:`100`,y2:RB[4],stroke:`#1A2840`,strokeWidth:`4`,strokeLinecap:`round`},
  // {fileName:Y,lineNumber:49,columnNumber:13},this),e===`12625`&&
  jsxDEV(`line`,{x1:`100`,y1:RB[0],x2:`100`,y2:RB[2],stroke:`#EF4444`,strokeWidth:`3`,strokeOpacity:`0.3`,strokeDasharray:`8 4`},
  // {fileName:Y,lineNumber:53,columnNumber:15},this),zB.map((t,n)=>{
let r=e===`12625`&&n<=2;return
  jsxDEV(`g`,{children:[
  jsxDEV(`circle`,{cx:`100`,cy:RB[n],r:`10`,fill:`#112035`,stroke:r?`#EF4444`:`#2A4470`,strokeWidth:`2`},
  // {fileName:Y,lineNumber:62,columnNumber:19},this),
  jsxDEV(`circle`,{cx:`100`,cy:RB[n],r:`4`,fill:r?`#EF4444`:`#3B82F6`},
  // {fileName:Y,lineNumber:63,columnNumber:19},this),
  jsxDEV(`text`,{x:`120`,y:RB[n]+4,fill:r?`#EF4444`:`#B8D0E8`,fontSize:`12`,fontFamily:`Inter`,children:t},
  // {fileName:Y,lineNumber:66,columnNumber:19},this),r&&n>0&&
  jsxDEV(`text`,{x:`290`,y:RB[n]+4,fill:`#EF4444`,fontSize:`10`,fontFamily:`JetBrains Mono`,opacity:`0.8`,children:`IMPACT ZONE`},
  // {fileName:Y,lineNumber:70,columnNumber:21},this),
  jsxDEV(`line`,{x1:`115`,y1:RB[n],x2:`118`,y2:RB[n],stroke:`#2A4470`,strokeWidth:`1`},
  // {fileName:Y,lineNumber:76,columnNumber:19},this)]},t,!0,{fileName:Y,lineNumber:60,columnNumber:17},this)}),LB.map(n=>{
let r=RB[n.position]+(n.status===`delayed`?30:0),i=n.id===e,a=BB[n.status];return
  jsxDEV(`g`,{className:`cursor-pointer`,onClick:()=>t(n.id),children:[
  jsxDEV(`rect`,{x:`140`,y:r-14,width:`120`,height:`28`,rx:`4`,fill:i?`#1A2F50`:`#112035`,stroke:a,strokeWidth:i?2:1},
  // {fileName:Y,lineNumber:90,columnNumber:19},this),
  jsxDEV(`text`,{x:`150`,y:r+4,fill:a,fontSize:`10`,fontFamily:`JetBrains Mono`,fontWeight:`600`,children:n.id},
  // {fileName:Y,lineNumber:100,columnNumber:19},this),
  jsxDEV(`text`,{x:`196`,y:r+4,fill:`#7A95B0`,fontSize:`10`,fontFamily:`Inter`,children:n.delay>0?`+${n.delay}m`:`On Time`},
  // {fileName:Y,lineNumber:103,columnNumber:19},this),
  jsxDEV(`line`,{x1:`140`,y1:r,x2:`110`,y2:RB[n.position],stroke:a,strokeWidth:`1`,strokeDasharray:`3 2`,strokeOpacity:`0.5`},
  // {fileName:Y,lineNumber:108,columnNumber:19},this),
  jsxDEV(`circle`,{cx:`110`,cy:RB[n.position],r:`5`,fill:a,opacity:`0.2`},
  // {fileName:Y,lineNumber:109,columnNumber:19},this)]},n.id,!0,{fileName:Y,lineNumber:88,columnNumber:17},this)}),e===`12625`&&
  jsxDEV(S.Fragment,{children:[
  jsxDEV(`text`,{x:`310`,y:`150`,fill:`#EF4444`,fontSize:`10`,fontFamily:`JetBrains Mono`,opacity:`0.7`,children:`← Delay propagation`},
  // {fileName:Y,lineNumber:117,columnNumber:17},this),
  jsxDEV(`text`,{x:`310`,y:`165`,fill:`#EF4444`,fontSize:`10`,fontFamily:`JetBrains Mono`,opacity:`0.7`,children:`   zone (+8 to +15 min)`},
  // {fileName:Y,lineNumber:118,columnNumber:17},this)]},void 0,!0)]},
  // {fileName:Y,lineNumber:47,columnNumber:11},this),
  jsxDEV(`div`,{className:`flex gap-2 mt-3`,children:LB.map(n=>
  jsxDEV(`button`,{onClick:()=>t(n.id),className:`flex items-center gap-2 text-xs font-data px-3 py-1.5 rounded border transition-all`,style:{borderColor:e===n.id?BB[n.status]:`#1A2840`,backgroundColor:e===n.id?BB[n.status]+`15`:`transparent`,color:e===n.id?BB[n.status]:`#4A6080`},children:[
  jsxDEV(`span`,{className:`w-1.5 h-1.5 rounded-full inline-block`,style:{backgroundColor:BB[n.status]}},
  // {fileName:Y,lineNumber:136,columnNumber:17},this),n.id,` · `,n.name.split(` `)[0]]},n.id,!0,{fileName:Y,lineNumber:126,columnNumber:15},this))},
  // {fileName:Y,lineNumber:124,columnNumber:11},this)]},
  // {fileName:Y,lineNumber:45,columnNumber:9},this),
  jsxDEV(`div`,{className:`space-y-4`,children:[
  jsxDEV(VB,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4`,children:`Network Impact`},
  // {fileName:Y,lineNumber:147,columnNumber:13},this),n&&
  jsxDEV(`div`,{className:`mb-4 p-3 bg-[#112035] rounded border-l-2`,style:{borderColor:BB[n.status]},children:[
  jsxDEV(`div`,{className:`font-data text-xs font-semibold mb-1`,style:{color:BB[n.status]},children:[`Train `,n.id,` · `,n.name]},
  // {fileName:Y,lineNumber:150,columnNumber:17},this),
  jsxDEV(`div`,{className:`text-xs text-[#4A6080]`,children:[`Current delay: +`,n.delay,` min`]},
  // {fileName:Y,lineNumber:153,columnNumber:17},this)]},
  // {fileName:Y,lineNumber:149,columnNumber:15},this),[{label:`Affected Trains`,value:`3`},{label:`Affected Stations`,value:`2`},{label:`Congested Sections`,value:`1`}].map(e=>
  jsxDEV(`div`,{className:`flex items-center justify-between py-2 border-b border-[#112035]`,children:[
  jsxDEV(`div`,{className:`text-xs text-[#7A95B0]`,children:e.label},
  // {fileName:Y,lineNumber:162,columnNumber:17},this),
  jsxDEV(`div`,{className:`font-data font-semibold text-white`,children:e.value},
  // {fileName:Y,lineNumber:163,columnNumber:17},this)]},e.label,!0,{fileName:Y,lineNumber:161,columnNumber:15},this)),
  jsxDEV(`div`,{className:`mt-3 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded`,children:[
  jsxDEV(`div`,{className:`text-[11px] text-[#4A6080] mb-1 font-data`,children:`Potential Delay Propagation`},
  // {fileName:Y,lineNumber:167,columnNumber:15},this),
  jsxDEV(`div`,{className:`font-data font-semibold text-[#EF4444]`,children:`+8 to +15 min`},
  // {fileName:Y,lineNumber:168,columnNumber:15},this)]},
  // {fileName:Y,lineNumber:166,columnNumber:13},this)]},
  // {fileName:Y,lineNumber:146,columnNumber:11},this),
  jsxDEV(VB,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3`,children:`Status Legend`},
  // {fileName:Y,lineNumber:174,columnNumber:13},this),[{label:`On Time`,status:`on-time`,desc:`≤ 5 min delay`},{label:`Delayed`,status:`delayed`,desc:`6–25 min delay`},{label:`High Risk`,status:`high-risk`,desc:`> 25 min or cascading`}].map(e=>
  jsxDEV(`div`,{className:`flex items-center gap-3 py-2`,children:[
  jsxDEV(`span`,{className:`w-2.5 h-2.5 rounded-full flex-shrink-0`,style:{backgroundColor:BB[e.status]}},
  // {fileName:Y,lineNumber:181,columnNumber:17},this),
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-xs text-white font-medium`,children:e.label},
  // {fileName:Y,lineNumber:183,columnNumber:19},this),
  jsxDEV(`div`,{className:`text-[10px] text-[#4A6080]`,children:e.desc},
  // {fileName:Y,lineNumber:184,columnNumber:19},this)]},
  // {fileName:Y,lineNumber:182,columnNumber:17},this)]},e.label,!0,{fileName:Y,lineNumber:180,columnNumber:15},this))]},
  // {fileName:Y,lineNumber:173,columnNumber:11},this),
  jsxDEV(VB,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3`,children:`Active Trains · Zone`},
  // {fileName:Y,lineNumber:192,columnNumber:13},this),LB.map(e=>
  jsxDEV(`div`,{className:`flex items-center justify-between py-2 border-b border-[#112035] last:border-0`,children:[
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`font-data text-xs text-white`,children:e.id},
  // {fileName:Y,lineNumber:196,columnNumber:19},this),
  jsxDEV(`div`,{className:`text-[10px] text-[#4A6080]`,children:e.name},
  // {fileName:Y,lineNumber:197,columnNumber:19},this)]},
  // {fileName:Y,lineNumber:195,columnNumber:17},this),
  jsxDEV(`span`,{className:`text-[10px] font-data font-semibold`,style:{color:BB[e.status]},children:e.delay>0?`+${e.delay}m`:`—`},
  // {fileName:Y,lineNumber:199,columnNumber:17},this)]},e.id,!0,{fileName:Y,lineNumber:194,columnNumber:15},this))]},
  // {fileName:Y,lineNumber:191,columnNumber:11},this)]},
  // {fileName:Y,lineNumber:144,columnNumber:9},this)]},
  // {fileName:Y,lineNumber:43,columnNumber:7},this)]},
  // {fileName:Y,lineNumber:36,columnNumber:5},this)}
var X=`/workspaces/default/.publishing/src/