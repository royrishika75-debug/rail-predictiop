pages/OperationsDashboard.tsx`,YB={HIGH:`#EF4444`,MEDIUM:`#F59E0B`,LOW:`#10B981`},XB=[{num:`12625`,name:`Kerala Express`,current:18,predicted:19,risk:`MEDIUM`,factor:`Congestion`},{num:`12760`,name:`Charminar SF`,current:8,predicted:21,risk:`HIGH`,factor:`Junction Load`},{num:`17016`,name:`Visakha Exp`,current:3,predicted:5,risk:`LOW`,factor:`Normal`},{num:`12028`,name:`Chennai Mail`,current:0,predicted:8,risk:`MEDIUM`,factor:`Weather`},{num:`11013`,name:`Mumbai Exp`,current:25,predicted:32,risk:`HIGH`,factor:`Signal Hold`},{num:`16031`,name:`Andaman Exp`,current:12,predicted:14,risk:`LOW`,factor:`Normal`}],ZB=[{type:`Platform Conflict Risk`,severity:`HIGH`,station:`Secunderabad`,detail:`Platform 2 overlap 18:48–19:05`},{type:`Junction Congestion`,severity:`HIGH`,station:`Vijayawada`,detail:`3 trains queued, 22 min wait`},{type:`Track Restriction`,severity:`MEDIUM`,station:`Khammam–Warangal`,detail:`60 km/h limit in effect`},{type:`Train Interaction`,severity:`MEDIUM`,station:`Kazipet`,detail:`12625 and 12760 crossing conflict`}];

function QB({children:e,className:t=``}){return
  jsxDEV(`div`,{className:`bg-[#0C1526] border border-[#1A2840] rounded-lg ${t}`,children:e},
  // {fileName:Z,lineNumber:26,columnNumber:10},this)}

function $B({label:e,value:t,sub:n,color:r=`white`}){return
  jsxDEV(QB,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-[11px] font-data text-[#4A6080] uppercase tracking-widest mb-2`,children:e},
  // {fileName:Z,lineNumber:32,columnNumber:7},this),
  jsxDEV(`div`,{className:`font-display font-bold text-3xl`,style:{color:r},children:t},
  // {fileName:Z,lineNumber:33,columnNumber:7},this),n&&
  jsxDEV(`div`,{className:`text-xs text-[#3B5E8C] mt-1`,children:n},
  // {fileName:Z,lineNumber:34,columnNumber:15},this)]},
  // {fileName:Z,lineNumber:31,columnNumber:5},this)}

function eV(){let[e,t]=(0,b.useState)(`all`),n=XB.filter(t=>e===`all`||t.risk===e);return
  jsxDEV(`div`,{className:`p-6 max-w-7xl mx-auto space-y-5`,children:[
  jsxDEV(`div`,{className:`flex items-start justify-between`,children:[
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1`,children:`Operations Center`},
  // {fileName:Z,lineNumber:48,columnNumber:11},this),
  jsxDEV(`h1`,{className:`font-display text-2xl font-bold text-white`,children:`Railway Operations Intelligence`},
  // {fileName:Z,lineNumber:49,columnNumber:11},this)]},
  // {fileName:Z,lineNumber:47,columnNumber:9},this),
  jsxDEV(`div`,{className:`text-[10px] font-data text-[#4A6080]`,children:[`Last sync: `,new Date().toLocaleTimeString(`en-IN`,{hour:`2-digit`,minute:`2-digit`}),` IST`]},
  // {fileName:Z,lineNumber:51,columnNumber:9},this)]},
  // {fileName:Z,lineNumber:46,columnNumber:7},this),
  jsxDEV(`div`,{className:`grid grid-cols-2 lg:grid-cols-4 gap-4`,children:[
  jsxDEV($B,{label:`Active Trains`,value:`1,842`,sub:`South Central Zone`},
  // {fileName:Z,lineNumber:58,columnNumber:9},this),
  jsxDEV($B,{label:`Predicted Delays`,value:`326`,sub:`17.7% of active trains`,color:`#F59E0B`},
  // {fileName:Z,lineNumber:59,columnNumber:9},this),
  jsxDEV($B,{label:`High Risk Trains`,value:`48`,sub:`Needs attention`,color:`#EF4444`},
  // {fileName:Z,lineNumber:60,columnNumber:9},this),
  jsxDEV($B,{label:`Congested Sections`,value:`17`,sub:`4 critical, 13 moderate`,color:`#F97316`},
  // {fileName:Z,lineNumber:61,columnNumber:9},this)]},
  // {fileName:Z,lineNumber:57,columnNumber:7},this),
  jsxDEV(QB,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4`,children:`Delay Hotspot Map — South Central Zone`},
  // {fileName:Z,lineNumber:66,columnNumber:9},this),
  jsxDEV(`div`,{className:`relative bg-[#080F1E] rounded-lg overflow-hidden`,style:{height:220},children:[
  jsxDEV(`svg`,{viewBox:`0 0 700 220`,width:`100%`,height:`100%`,children:[
  jsxDEV(`defs`,{children:
  jsxDEV(`pattern`,{id:`opsgrid`,x:`0`,y:`0`,width:`40`,height:`40`,patternUnits:`userSpaceOnUse`,children:
  jsxDEV(`path`,{d:`M 40 0 L 0 0 0 40`,fill:`none`,stroke:`#0C1526`,strokeWidth:`0.5`},
  // {fileName:Z,lineNumber:73,columnNumber:17},this)},
  // {fileName:Z,lineNumber:72,columnNumber:15},this)},
  // {fileName:Z,lineNumber:71,columnNumber:13},this),
  jsxDEV(`rect`,{width:`700`,height:`220`,fill:`url(#opsgrid)`},
  // {fileName:Z,lineNumber:76,columnNumber:13},this),
  jsxDEV(`line`,{x1:`80`,y1:`110`,x2:`620`,y2:`110`,stroke:`#1E3354`,strokeWidth:`3`},
  // {fileName:Z,lineNumber:79,columnNumber:13},this),
  jsxDEV(`line`,{x1:`350`,y1:`110`,x2:`350`,y2:`50`,stroke:`#1E3354`,strokeWidth:`2`},
  // {fileName:Z,lineNumber:82,columnNumber:13},this),
  jsxDEV(`line`,{x1:`500`,y1:`110`,x2:`550`,y2:`60`,stroke:`#1E3354`,strokeWidth:`2`},
  // {fileName:Z,lineNumber:83,columnNumber:13},this),[{x:160,label:`Vijayawada`,delay:`HIGH`,r:28,color:`#EF4444`},{x:280,label:`Khammam`,delay:`MEDIUM`,r:20,color:`#F59E0B`},{x:400,label:`Warangal`,delay:`MEDIUM`,r:22,color:`#F59E0B`},{x:490,label:`Kazipet`,delay:`LOW`,r:14,color:`#10B981`},{x:590,label:`Secunderabad`,delay:`HIGH`,r:25,color:`#EF4444`}].map(e=>
  jsxDEV(`g`,{children:[
  jsxDEV(`circle`,{cx:e.x,cy:110,r:e.r,fill:e.color,opacity:.15},
  // {fileName:Z,lineNumber:94,columnNumber:17},this),
  jsxDEV(`circle`,{cx:e.x,cy:110,r:8,fill:e.color,opacity:.8},
  // {fileName:Z,lineNumber:95,columnNumber:17},this),
  jsxDEV(`circle`,{cx:e.x,cy:110,r:4,fill:e.color},
  // {fileName:Z,lineNumber:96,columnNumber:17},this),
  jsxDEV(`text`,{x:e.x,y:137,textAnchor:`middle`,fill:e.color,fontSize:`9`,fontFamily:`JetBrains Mono`,children:e.label.split(` `)[0]},
  // {fileName:Z,lineNumber:97,columnNumber:17},this),
  jsxDEV(`text`,{x:e.x,y:149,textAnchor:`middle`,fill:e.color,fontSize:`8`,fontFamily:`JetBrains Mono`,opacity:.7,children:e.delay},
  // {fileName:Z,lineNumber:98,columnNumber:17},this)]},e.label,!0,{fileName:Z,lineNumber:93,columnNumber:15},this)),
  jsxDEV(`rect`,{x:`130`,y:`98`,width:`36`,height:`14`,rx:`2`,fill:`#1A2F50`,stroke:`#3B82F6`,strokeWidth:`1`},
  // {fileName:Z,lineNumber:103,columnNumber:13},this),
  jsxDEV(`text`,{x:`148`,y:`109`,textAnchor:`middle`,fill:`#3B82F6`,fontSize:`8`,fontFamily:`JetBrains Mono`,children:`12625`},
  // {fileName:Z,lineNumber:104,columnNumber:13},this),
  jsxDEV(`rect`,{x:`380`,y:`98`,width:`36`,height:`14`,rx:`2`,fill:`#2A1515`,stroke:`#EF4444`,strokeWidth:`1`},
  // {fileName:Z,lineNumber:106,columnNumber:13},this),
  jsxDEV(`text`,{x:`398`,y:`109`,textAnchor:`middle`,fill:`#EF4444`,fontSize:`8`,fontFamily:`JetBrains Mono`,children:`12760`},
  // {fileName:Z,lineNumber:107,columnNumber:13},this)]},
  // {fileName:Z,lineNumber:69,columnNumber:11},this),
  jsxDEV(`div`,{className:`absolute bottom-3 right-3 flex items-center gap-4 text-[9px] font-data`,children:[[`HIGH`,`#EF4444`],[`MEDIUM`,`#F59E0B`],[`LOW`,`#10B981`]].map(([e,t])=>
  jsxDEV(`div`,{className:`flex items-center gap-1`,children:[
  jsxDEV(`span`,{className:`w-2 h-2 rounded-full inline-block`,style:{backgroundColor:t}},
  // {fileName:Z,lineNumber:114,columnNumber:17},this),
  jsxDEV(`span`,{style:{color:t},children:e},
  // {fileName:Z,lineNumber:115,columnNumber:17},this)]},e,!0,{fileName:Z,lineNumber:113,columnNumber:15},this))},
  // {fileName:Z,lineNumber:111,columnNumber:11},this)]},
  // {fileName:Z,lineNumber:67,columnNumber:9},this)]},
  // {fileName:Z,lineNumber:65,columnNumber:7},this),
  jsxDEV(QB,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`flex items-center justify-between mb-4`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest`,children:`Train Risk Table`},
  // {fileName:Z,lineNumber:125,columnNumber:11},this),
  jsxDEV(`div`,{className:`flex gap-1`,children:[`all`,`HIGH`,`MEDIUM`,`LOW`].map(n=>
  jsxDEV(`button`,{onClick:()=>t(n),className:`text-[10px] font-data px-2 py-1 rounded transition-all ${e===n?`bg-[#1A2F50] text-[#3B82F6] border border-[#3B82F6]`:`text-[#4A6080] border border-transparent hover:text-[#7A95B0]`}`,children:n===`all`?`All`:n},n,!1,{fileName:Z,lineNumber:128,columnNumber:15},this))},
  // {fileName:Z,lineNumber:126,columnNumber:11},this)]},
  // {fileName:Z,lineNumber:124,columnNumber:9},this),
  jsxDEV(`div`,{className:`overflow-x-auto`,children:
  jsxDEV(`table`,{className:`w-full text-sm`,children:[
  jsxDEV(`thead`,{children:
  jsxDEV(`tr`,{className:`border-b border-[#1A2840]`,children:[`Train`,`Name`,`Current Delay`,`Predicted Dest.`,`Risk`,`Main Factor`].map(e=>
  jsxDEV(`th`,{className:`text-left py-2 px-3 text-[11px] font-data text-[#4A6080] uppercase tracking-wider font-medium`,children:e},e,!1,{fileName:Z,lineNumber:145,columnNumber:19},this))},
  // {fileName:Z,lineNumber:143,columnNumber:15},this)},
  // {fileName:Z,lineNumber:142,columnNumber:13},this),
  jsxDEV(`tbody`,{children:n.map(e=>
  jsxDEV(`tr`,{className:`border-b border-[#112035] hover:bg-[#112035] transition-colors`,children:[
  jsxDEV(`td`,{className:`py-3 px-3 font-data text-white font-semibold`,children:e.num},
  // {fileName:Z,lineNumber:152,columnNumber:19},this),
  jsxDEV(`td`,{className:`py-3 px-3 text-[#7A95B0]`,children:e.name},
  // {fileName:Z,lineNumber:153,columnNumber:19},this),
  jsxDEV(`td`,{className:`py-3 px-3 font-data`,style:{color:e.current>15?`#EF4444`:e.current>5?`#F59E0B`:`#10B981`},children:[e.current>0?`+${e.current}`:`—`,` min`]},
  // {fileName:Z,lineNumber:154,columnNumber:19},this),
  jsxDEV(`td`,{className:`py-3 px-3 font-data`,style:{color:e.predicted>20?`#EF4444`:e.predicted>10?`#F59E0B`:`#10B981`},children:[`+`,e.predicted,` min`]},
  // {fileName:Z,lineNumber:157,columnNumber:19},this),
  jsxDEV(`td`,{className:`py-3 px-3`,children:
  jsxDEV(`span`,{className:`text-[10px] font-data font-semibold px-2 py-0.5 rounded border`,style:{color:YB[e.risk],borderColor:YB[e.risk]+`40`,backgroundColor:YB[e.risk]+`10`},children:e.risk},
  // {fileName:Z,lineNumber:161,columnNumber:21},this)},
  // {fileName:Z,lineNumber:160,columnNumber:19},this),
  jsxDEV(`td`,{className:`py-3 px-3 text-xs text-[#7A95B0]`,children:e.factor},
  // {fileName:Z,lineNumber:166,columnNumber:19},this)]},e.num,!0,{fileName:Z,lineNumber:151,columnNumber:17},this))},
  // {fileName:Z,lineNumber:149,columnNumber:13},this)]},
  // {fileName:Z,lineNumber:141,columnNumber:11},this)},
  // {fileName:Z,lineNumber:140,columnNumber:9},this)]},
  // {fileName:Z,lineNumber:123,columnNumber:7},this),
  jsxDEV(QB,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4`,children:`Upcoming Operational Conflicts`},
  // {fileName:Z,lineNumber:176,columnNumber:9},this),
  jsxDEV(`div`,{className:`grid grid-cols-1 md:grid-cols-2 gap-3`,children:ZB.map(e=>
  jsxDEV(`div`,{className:`flex items-start gap-3 p-3 bg-[#112035] rounded-lg border-l-2`,style:{borderColor:YB[e.severity]},children:[
  jsxDEV(`div`,{className:`flex-shrink-0 mt-0.5`,children:
  jsxDEV(`span`,{className:`text-[10px] font-data font-semibold px-1.5 py-0.5 rounded`,style:{color:YB[e.severity],backgroundColor:YB[e.severity]+`15`},children:e.severity},
  // {fileName:Z,lineNumber:182,columnNumber:17},this)},
  // {fileName:Z,lineNumber:181,columnNumber:15},this),
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-sm font-medium text-white`,children:e.type},
  // {fileName:Z,lineNumber:188,columnNumber:17},this),
  jsxDEV(`div`,{className:`text-xs text-[#4A6080] mt-0.5`,children:e.station},
  // {fileName:Z,lineNumber:189,columnNumber:17},this),
  jsxDEV(`div`,{className:`text-xs text-[#3B5E8C] mt-0.5`,children:e.detail},
  // {fileName:Z,lineNumber:190,columnNumber:17},this)]},
  // {fileName:Z,lineNumber:187,columnNumber:15},this)]},e.type,!0,{fileName:Z,lineNumber:179,columnNumber:13},this))},
  // {fileName:Z,lineNumber:177,columnNumber:9},this)]},
  // {fileName:Z,lineNumber:175,columnNumber:7},this)]},
  // {fileName:Z,lineNumber:45,columnNumber:5},this)}
var tV=`/workspaces/default/.publishing/src/