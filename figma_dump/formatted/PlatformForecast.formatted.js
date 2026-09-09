pages/PlatformForecast.tsx`;

function nV({children:e,className:t=``}){return
  jsxDEV(`div`,{className:`bg-[#0C1526] border border-[#1A2840] rounded-lg ${t}`,children:e},
  // {fileName:tV,lineNumber:2,columnNumber:10},this)}
var rV=[{num:1,status:`occupied`,statusLabel:`Occupied`,color:`#F59E0B`,trains:[{id:`12028`,name:`Chennai Mail`,from:`18:35`,to:`18:52`}],available:!1},{num:2,status:`conflict`,statusLabel:`Expected Conflict`,color:`#EF4444`,trains:[{id:`12625`,name:`Kerala Express (arriving)`,from:`18:48`,to:`19:05`},{id:`16031`,name:`Andaman Express (departing)`,from:`18:52`,to:`19:10`}],available:!1},{num:3,status:`available`,statusLabel:`Available`,color:`#10B981`,trains:[],available:!0},{num:4,status:`expected`,statusLabel:`Expected Arrival`,color:`#3B82F6`,trains:[{id:`17016`,name:`Visakha Express`,from:`19:10`,to:`19:28`}],available:!1}],iV=[`18:00`,`18:15`,`18:30`,`18:45`,`19:00`,`19:15`,`19:30`,`19:45`,`20:00`];

function aV(e){let[t,n]=e.split(`:`).map(Number);return((t-18)*60+n)/120*100}

function oV(){return
  jsxDEV(`div`,{className:`p-6 max-w-6xl mx-auto space-y-5`,children:[
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1`,children:`Operations`},
  // {fileName:tV,lineNumber:43,columnNumber:9},this),
  jsxDEV(`h1`,{className:`font-display text-2xl font-bold text-white`,children:`Platform Occupancy Forecast`},
  // {fileName:tV,lineNumber:44,columnNumber:9},this),
  jsxDEV(`div`,{className:`text-sm text-[#4A6080] mt-1`,children:[`Station: `,
  jsxDEV(`span`,{className:`text-[#B8D0E8]`,children:`Secunderabad Junction`},
  // {fileName:tV,lineNumber:45,columnNumber:63},this)]},
  // {fileName:tV,lineNumber:45,columnNumber:9},this),
  jsxDEV(`div`,{className:`inline-block mt-2 text-[10px] font-data text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded px-2 py-1`,children:`Forecast from predicted arrivals and operational schedules · Decision support only`},
  // {fileName:tV,lineNumber:46,columnNumber:9},this)]},
  // {fileName:tV,lineNumber:42,columnNumber:7},this),
  jsxDEV(`div`,{className:`grid grid-cols-2 lg:grid-cols-4 gap-4`,children:rV.map(e=>
  jsxDEV(nV,{className:`p-4`,children:[
  jsxDEV(`div`,{className:`flex items-center justify-between mb-3`,children:[
  jsxDEV(`div`,{className:`font-display font-semibold text-white`,children:[`Platform `,e.num]},
  // {fileName:tV,lineNumber:56,columnNumber:15},this),
  jsxDEV(`span`,{className:`w-2 h-2 rounded-full`,style:{backgroundColor:e.color}},
  // {fileName:tV,lineNumber:57,columnNumber:15},this)]},
  // {fileName:tV,lineNumber:55,columnNumber:13},this),
  jsxDEV(`div`,{className:`text-xs font-data font-semibold mb-2`,style:{color:e.color},children:e.statusLabel},
  // {fileName:tV,lineNumber:59,columnNumber:13},this),e.trains.length>0?
  jsxDEV(`div`,{className:`space-y-1.5`,children:e.trains.map(e=>
  jsxDEV(`div`,{className:`text-[10px] bg-[#112035] rounded p-1.5`,children:[
  jsxDEV(`div`,{className:`font-data text-[#3B82F6]`,children:e.id},
  // {fileName:tV,lineNumber:64,columnNumber:21},this),
  jsxDEV(`div`,{className:`text-[#7A95B0]`,children:e.name},
  // {fileName:tV,lineNumber:65,columnNumber:21},this),
  jsxDEV(`div`,{className:`text-[#4A6080] font-data`,children:[e.from,`–`,e.to]},
  // {fileName:tV,lineNumber:66,columnNumber:21},this)]},e.id,!0,{fileName:tV,lineNumber:63,columnNumber:19},this))},
  // {fileName:tV,lineNumber:61,columnNumber:15},this):
  jsxDEV(`div`,{className:`text-[11px] text-[#10B981]`,children:`No trains scheduled`},
  // {fileName:tV,lineNumber:71,columnNumber:15},this)]},e.num,!0,{fileName:tV,lineNumber:54,columnNumber:11},this))},
  // {fileName:tV,lineNumber:52,columnNumber:7},this),
  jsxDEV(nV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4`,children:`Platform Occupancy Timeline — 18:00 to 20:00`},
  // {fileName:tV,lineNumber:79,columnNumber:9},this),
  jsxDEV(`div`,{className:`flex mb-2 ml-20`,children:iV.map(e=>
  jsxDEV(`div`,{className:`flex-1 text-[9px] font-data text-[#3B5E8C]`,children:e},e,!1,{fileName:tV,lineNumber:84,columnNumber:13},this))},
  // {fileName:tV,lineNumber:82,columnNumber:9},this),
  jsxDEV(`div`,{className:`space-y-3`,children:rV.map(e=>
  jsxDEV(`div`,{className:`flex items-center gap-3`,children:[
  jsxDEV(`div`,{className:`w-20 text-xs text-[#7A95B0] flex-shrink-0 font-data`,children:[`Platform `,e.num]},
  // {fileName:tV,lineNumber:92,columnNumber:15},this),
  jsxDEV(`div`,{className:`flex-1 relative bg-[#080F1E] rounded h-9`,children:[e.trains.map(t=>{
let n=aV(t.from),r=aV(t.to);return
  jsxDEV(`div`,{className:`absolute top-1 bottom-1 rounded flex items-center px-2`,style:{left:`${n}%`,width:`${r-n}%`,backgroundColor:e.color+`25`,borderLeft:`2px solid ${e.color}`},children:
  jsxDEV(`span`,{className:`font-data text-[9px] font-semibold truncate`,style:{color:e.color},children:t.id},
  // {fileName:tV,lineNumber:108,columnNumber:23},this)},t.id,!1,{fileName:tV,lineNumber:98,columnNumber:21},this)}),e.available&&
  jsxDEV(`div`,{className:`absolute inset-1 flex items-center px-2`,children:
  jsxDEV(`span`,{className:`text-[9px] font-data text-[#10B981] opacity-50`,children:`Available`},
  // {fileName:tV,lineNumber:114,columnNumber:21},this)},
  // {fileName:tV,lineNumber:113,columnNumber:19},this),
  jsxDEV(`div`,{className:`absolute top-0 bottom-0 w-px bg-[#3B82F6] opacity-40`,style:{left:`${aV(`19:00`)}%`}},
  // {fileName:tV,lineNumber:119,columnNumber:17},this)]},
  // {fileName:tV,lineNumber:93,columnNumber:15},this)]},e.num,!0,{fileName:tV,lineNumber:91,columnNumber:13},this))},
  // {fileName:tV,lineNumber:89,columnNumber:9},this),
  jsxDEV(`div`,{className:`flex items-center gap-4 mt-4 text-[10px] font-data text-[#4A6080]`,children:[[{color:`#F59E0B`,label:`Occupied`},{color:`#EF4444`,label:`Conflict`},{color:`#10B981`,label:`Available`},{color:`#3B82F6`,label:`Expected`}].map(e=>
  jsxDEV(`div`,{className:`flex items-center gap-1.5`,children:[
  jsxDEV(`span`,{className:`w-2 h-2 rounded-sm inline-block`,style:{backgroundColor:e.color+`60`,border:`1px solid ${e.color}`}},
  // {fileName:tV,lineNumber:133,columnNumber:15},this),e.label]},e.label,!0,{fileName:tV,lineNumber:132,columnNumber:13},this)),
  jsxDEV(`div`,{className:`flex items-center gap-1.5 ml-4`,children:[
  jsxDEV(`span`,{className:`w-px h-3 bg-[#3B82F6] inline-block opacity-60`},
  // {fileName:tV,lineNumber:138,columnNumber:13},this),`Current time (approx.)`]},
  // {fileName:tV,lineNumber:137,columnNumber:11},this)]},
  // {fileName:tV,lineNumber:125,columnNumber:9},this)]},
  // {fileName:tV,lineNumber:78,columnNumber:7},this),
  jsxDEV(nV,{className:`p-5 border-[#EF4444]/30`,children:
  jsxDEV(`div`,{className:`flex items-start gap-3`,children:[
  jsxDEV(`div`,{className:`w-2 h-2 rounded-full bg-[#EF4444] mt-1.5 flex-shrink-0 pulse-dot`},
  // {fileName:tV,lineNumber:147,columnNumber:11},this),
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-sm font-medium text-[#EF4444] mb-1`,children:`Platform 2 Conflict Detected`},
  // {fileName:tV,lineNumber:149,columnNumber:13},this),
  jsxDEV(`div`,{className:`text-xs text-[#7A95B0]`,children:[`Train 12625 (Kerala Express) predicted arrival 18:48–19:05 overlaps with Train 16031 (Andaman Express) scheduled departure 18:52. Buffer: `,
  jsxDEV(`span`,{className:`font-data text-[#EF4444]`,children:`4 minutes`},
  // {fileName:tV,lineNumber:152,columnNumber:23},this),` — below safe threshold.`]},
  // {fileName:tV,lineNumber:150,columnNumber:13},this),
  jsxDEV(`div`,{className:`mt-2 text-[10px] font-data text-[#3B5E8C]`,children:`This forecast is decision support. Platform allocation is the responsibility of station operations staff.`},
  // {fileName:tV,lineNumber:154,columnNumber:13},this)]},
  // {fileName:tV,lineNumber:148,columnNumber:11},this)]},
  // {fileName:tV,lineNumber:146,columnNumber:9},this)},
  // {fileName:tV,lineNumber:145,columnNumber:7},this)]},
  // {fileName:tV,lineNumber:41,columnNumber:5},this)}
var sV=`/workspaces/default/.publishing/src/