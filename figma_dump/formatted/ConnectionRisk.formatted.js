pages/ConnectionRisk.tsx`;

function cV({children:e,className:t=``}){return
  jsxDEV(`div`,{className:`bg-[#0C1526] border border-[#1A2840] rounded-lg ${t}`,children:e},
  // {fileName:sV,lineNumber:2,columnNumber:10},this)}
var lV=[{trainA:{num:`12625`,name:`Kerala Express`,arrival:`19:19`,p10:`19:10`,p90:`19:34`},trainB:{num:`12770`,name:`Golconda Express`,departure:`19:32`},buffer:13,platform:{from:2,to:5},risk:`HIGH`},{trainA:{num:`17016`,name:`Visakha Express`,arrival:`19:10`,p10:`19:05`,p90:`19:22`},trainB:{num:`12722`,name:`Dakshin Express`,departure:`19:45`},buffer:35,platform:{from:4,to:4},risk:`LOW`},{trainA:{num:`12760`,name:`Charminar SF`,arrival:`18:55`,p10:`18:48`,p90:`19:20`},trainB:{num:`11014`,name:`Mumbai LTT Exp`,departure:`19:10`},buffer:15,platform:{from:6,to:3},risk:`MEDIUM`}],uV={HIGH:`#EF4444`,MEDIUM:`#F59E0B`,LOW:`#10B981`};

function dV(){return
  jsxDEV(`div`,{className:`p-6 max-w-5xl mx-auto space-y-5`,children:[
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1`,children:`Passenger Intelligence`},
  // {fileName:sV,lineNumber:35,columnNumber:9},this),
  jsxDEV(`h1`,{className:`font-display text-2xl font-bold text-white`,children:`Connection Risk`},
  // {fileName:sV,lineNumber:36,columnNumber:9},this),
  jsxDEV(`p`,{className:`text-sm text-[#4A6080] mt-1`,children:`Forecast-based connection reliability assessment. Not a booking or rebooking system.`},
  // {fileName:sV,lineNumber:37,columnNumber:9},this)]},
  // {fileName:sV,lineNumber:34,columnNumber:7},this),
  jsxDEV(`div`,{className:`space-y-4`,children:lV.map((e,t)=>
  jsxDEV(cV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`flex items-center justify-between mb-4`,children:[
  jsxDEV(`div`,{className:`font-display font-semibold text-white`,children:[`Connection Scenario `,t+1]},
  // {fileName:sV,lineNumber:44,columnNumber:15},this),
  jsxDEV(`span`,{className:`text-xs font-data font-bold px-3 py-1 rounded border`,style:{color:uV[e.risk],borderColor:uV[e.risk]+`40`,backgroundColor:uV[e.risk]+`10`},children:[e.risk,` RISK`]},
  // {fileName:sV,lineNumber:45,columnNumber:15},this)]},
  // {fileName:sV,lineNumber:43,columnNumber:13},this),
  jsxDEV(`div`,{className:`flex items-stretch gap-0 mb-5`,children:[
  jsxDEV(`div`,{className:`flex-1 bg-[#112035] rounded-l-lg p-4`,children:[
  jsxDEV(`div`,{className:`text-[10px] font-data text-[#4A6080] uppercase mb-2`,children:`Arriving Train`},
  // {fileName:sV,lineNumber:55,columnNumber:17},this),
  jsxDEV(`div`,{className:`font-data text-[#3B82F6] font-semibold`,children:e.trainA.num},
  // {fileName:sV,lineNumber:56,columnNumber:17},this),
  jsxDEV(`div`,{className:`text-sm text-[#B8D0E8] mb-3`,children:e.trainA.name},
  // {fileName:sV,lineNumber:57,columnNumber:17},this),
  jsxDEV(`div`,{className:`font-display text-2xl text-white font-bold`,children:e.trainA.arrival},
  // {fileName:sV,lineNumber:58,columnNumber:17},this),
  jsxDEV(`div`,{className:`text-xs text-[#4A6080] mt-1`,children:`Predicted arrival`},
  // {fileName:sV,lineNumber:59,columnNumber:17},this),
  jsxDEV(`div`,{className:`mt-2 text-[10px] font-data text-[#3B5E8C]`,children:[`P10: `,e.trainA.p10,` · P90: `,e.trainA.p90]},
  // {fileName:sV,lineNumber:60,columnNumber:17},this)]},
  // {fileName:sV,lineNumber:54,columnNumber:15},this),
  jsxDEV(`div`,{className:`flex flex-col items-center justify-center bg-[#0A1220] px-4 py-4 border-y border-[#1A2840]`,children:[
  jsxDEV(`div`,{className:`text-[10px] font-data text-[#4A6080] mb-1 whitespace-nowrap`,children:`Transfer Buffer`},
  // {fileName:sV,lineNumber:67,columnNumber:17},this),
  jsxDEV(`div`,{className:`font-data text-xl font-bold`,style:{color:uV[e.risk]},children:[e.buffer,` min`]},
  // {fileName:sV,lineNumber:68,columnNumber:17},this),
  jsxDEV(`div`,{className:`text-[10px] font-data text-[#3B5E8C] mt-1 whitespace-nowrap`,children:[`Plat. `,e.platform.from,` → `,e.platform.to]},
  // {fileName:sV,lineNumber:71,columnNumber:17},this),
  jsxDEV(`div`,{className:`mt-2 text-[#2A4470] text-lg`,children:`→`},
  // {fileName:sV,lineNumber:75,columnNumber:17},this)]},
  // {fileName:sV,lineNumber:66,columnNumber:15},this),
  jsxDEV(`div`,{className:`flex-1 bg-[#112035] rounded-r-lg p-4`,children:[
  jsxDEV(`div`,{className:`text-[10px] font-data text-[#4A6080] uppercase mb-2`,children:`Departing Train`},
  // {fileName:sV,lineNumber:80,columnNumber:17},this),
  jsxDEV(`div`,{className:`font-data text-[#10B981] font-semibold`,children:e.trainB.num},
  // {fileName:sV,lineNumber:81,columnNumber:17},this),
  jsxDEV(`div`,{className:`text-sm text-[#B8D0E8] mb-3`,children:e.trainB.name},
  // {fileName:sV,lineNumber:82,columnNumber:17},this),
  jsxDEV(`div`,{className:`font-display text-2xl text-white font-bold`,children:e.trainB.departure},
  // {fileName:sV,lineNumber:83,columnNumber:17},this),
  jsxDEV(`div`,{className:`text-xs text-[#4A6080] mt-1`,children:`Scheduled departure`},
  // {fileName:sV,lineNumber:84,columnNumber:17},this)]},
  // {fileName:sV,lineNumber:79,columnNumber:15},this)]},
  // {fileName:sV,lineNumber:52,columnNumber:13},this),
  jsxDEV(`div`,{className:`grid grid-cols-3 gap-3`,children:[{label:`Arrival Uncertainty`,detail:`${e.trainA.p90} worst case`,risk:e.risk===`HIGH`?`High`:e.risk===`MEDIUM`?`Moderate`:`Low`,color:uV[e.risk]},{label:`Platform Transfer`,detail:`${Math.abs(e.platform.to-e.platform.from)} platform(s) apart`,risk:Math.abs(e.platform.to-e.platform.from)>2?`Moderate`:`Low`,color:Math.abs(e.platform.to-e.platform.from)>2?`#F59E0B`:`#10B981`},{label:`Buffer Adequacy`,detail:`${e.buffer} min available`,risk:e.buffer<20?`Tight`:e.buffer<30?`Moderate`:`Comfortable`,color:e.buffer<20?`#EF4444`:e.buffer<30?`#F59E0B`:`#10B981`}].map(e=>
  jsxDEV(`div`,{className:`bg-[#080F1E] rounded p-3`,children:[
  jsxDEV(`div`,{className:`text-[10px] font-data text-[#4A6080] mb-1`,children:e.label},
  // {fileName:sV,lineNumber:111,columnNumber:19},this),
  jsxDEV(`div`,{className:`text-xs font-semibold mb-1`,style:{color:e.color},children:e.risk},
  // {fileName:sV,lineNumber:112,columnNumber:19},this),
  jsxDEV(`div`,{className:`text-[10px] text-[#3B5E8C]`,children:e.detail},
  // {fileName:sV,lineNumber:113,columnNumber:19},this)]},e.label,!0,{fileName:sV,lineNumber:110,columnNumber:17},this))},
  // {fileName:sV,lineNumber:89,columnNumber:13},this),e.risk!==`LOW`&&
  jsxDEV(`div`,{className:`mt-3 p-3 rounded border text-xs`,style:{borderColor:uV[e.risk]+`30`,backgroundColor:uV[e.risk]+`08`,color:uV[e.risk]},children:e.risk===`HIGH`?`Connection may be at risk. Passenger should plan for alternative options. RailPredict does not automatically rebook.`:`Connection is possible but buffer is limited. Monitor predicted arrival for updates.`},
  // {fileName:sV,lineNumber:120,columnNumber:15},this)]},t,!0,{fileName:sV,lineNumber:42,columnNumber:11},this))},
  // {fileName:sV,lineNumber:40,columnNumber:7},this),
  jsxDEV(`div`,{className:`text-[11px] font-data text-[#2A4470] text-center pt-2`,children:`RailPredict does not automatically rebook tickets or make operational decisions. All assessments are decision support.`},
  // {fileName:sV,lineNumber:131,columnNumber:7},this)]},
  // {fileName:sV,lineNumber:33,columnNumber:5},this)}
var Q=`/workspaces/default/.publishing/src/