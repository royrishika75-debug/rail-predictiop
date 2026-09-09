pages/DataPipeline.tsx`;

function OV({children:e,className:t=``}){return
  jsxDEV(`div`,{className:`bg-[#0C1526] border border-[#1A2840] rounded-lg ${t}`,children:e},
  // {fileName:DV,lineNumber:2,columnNumber:10},this)}
var kV=[{id:`input`,label:`Live Train Data`,icon:`◉`,status:`active`,latency:`120ms`,description:`GPS, Signal Aspects, Station Reports`},{id:`validate`,label:`Data Validation`,icon:`▣`,status:`active`,latency:`18ms`,description:`Schema checks, outlier detection, completeness`},{id:`features`,label:`Feature Engineering`,icon:`⚙`,status:`active`,latency:`45ms`,description:`Section running time, lag features, congestion index`},{id:`ml`,label:`ML ETA Forecast`,icon:`▲`,status:`active`,latency:`28ms`,description:`XGBoost + Neural ensemble — Model V2`},{id:`network`,label:`Network Intelligence`,icon:`⬡`,status:`active`,latency:`35ms`,description:`Graph-based propagation analysis`},{id:`uncertainty`,label:`Uncertainty Layer`,icon:`◷`,status:`active`,latency:`12ms`,description:`Quantile regression — P10/P50/P90`},{id:`explain`,label:`Explainability`,icon:`◬`,status:`active`,latency:`8ms`,description:`SHAP feature attribution`},{id:`api`,label:`Prediction API`,icon:`⟶`,status:`active`,latency:`31ms p95`,description:`REST / gRPC — authenticated endpoints`},{id:`dashboards`,label:`Passenger + Railway Dashboards`,icon:`⊟`,status:`active`,latency:null,description:`Real-time display, alerts, decision support`}],AV=[{label:`GPS / Location`,status:`active`,rate:`1 Hz per train`},{label:`Signal Aspects`,status:`active`,rate:`Event-driven`},{label:`Historical Delay`,status:`active`,rate:`Hourly batch`},{label:`Section Running Time`,status:`active`,rate:`Trip-level`},{label:`Weather`,status:`active`,rate:`15 min refresh`},{label:`Congestion Index`,status:`active`,rate:`5 min refresh`},{label:`Operational Restrictions`,status:`active`,rate:`Event-driven`}],jV=[{label:`Completeness`,value:98.4,color:`#10B981`},{label:`Timeliness`,value:96.1,color:`#10B981`},{label:`Validity`,value:99.2,color:`#10B981`},{label:`GPS Coverage`,value:91.8,color:`#F59E0B`}];

function MV(){return
  jsxDEV(`div`,{className:`p-6 max-w-7xl mx-auto space-y-5`,children:[
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1`,children:`System Architecture`},
  // {fileName:DV,lineNumber:38,columnNumber:9},this),
  jsxDEV(`h1`,{className:`font-display text-2xl font-bold text-white`,children:`Data Pipeline`},
  // {fileName:DV,lineNumber:39,columnNumber:9},this)]},
  // {fileName:DV,lineNumber:37,columnNumber:7},this),
  jsxDEV(`div`,{className:`grid grid-cols-1 lg:grid-cols-3 gap-5`,children:[
  jsxDEV(OV,{className:`lg:col-span-2 p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-5`,children:`Processing Pipeline`},
  // {fileName:DV,lineNumber:45,columnNumber:11},this),
  jsxDEV(`div`,{className:`space-y-0`,children:kV.map((e,t)=>
  jsxDEV(`div`,{children:
  jsxDEV(`div`,{className:`flex items-start gap-4 py-3 group`,children:[
  jsxDEV(`div`,{className:`flex flex-col items-center flex-shrink-0`,children:[
  jsxDEV(`div`,{className:`w-9 h-9 rounded-lg bg-[#112035] border border-[#1A2840] group-hover:border-[#3B82F6] transition-colors flex items-center justify-center text-[#3B82F6] text-sm`,children:e.icon},
  // {fileName:DV,lineNumber:52,columnNumber:21},this),t<kV.length-1&&
  jsxDEV(`div`,{className:`w-px flex-1 bg-[#1A2840] mt-1`,style:{height:20}},
  // {fileName:DV,lineNumber:56,columnNumber:23},this)]},
  // {fileName:DV,lineNumber:51,columnNumber:19},this),
  jsxDEV(`div`,{className:`flex-1 pb-2`,children:[
  jsxDEV(`div`,{className:`flex items-center justify-between`,children:[
  jsxDEV(`div`,{className:`flex items-center gap-2`,children:[
  jsxDEV(`span`,{className:`font-medium text-sm text-white`,children:e.label},
  // {fileName:DV,lineNumber:64,columnNumber:25},this),
  jsxDEV(`span`,{className:`w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot inline-block`},
  // {fileName:DV,lineNumber:65,columnNumber:25},this)]},
  // {fileName:DV,lineNumber:63,columnNumber:23},this),e.latency&&
  jsxDEV(`span`,{className:`font-data text-xs text-[#4A6080]`,children:e.latency},
  // {fileName:DV,lineNumber:68,columnNumber:25},this)]},
  // {fileName:DV,lineNumber:62,columnNumber:21},this),
  jsxDEV(`div`,{className:`text-xs text-[#4A6080] mt-0.5`,children:e.description},
  // {fileName:DV,lineNumber:71,columnNumber:21},this)]},
  // {fileName:DV,lineNumber:61,columnNumber:19},this)]},
  // {fileName:DV,lineNumber:49,columnNumber:17},this)},e.id,!1,{fileName:DV,lineNumber:48,columnNumber:15},this))},
  // {fileName:DV,lineNumber:46,columnNumber:11},this)]},
  // {fileName:DV,lineNumber:44,columnNumber:9},this),
  jsxDEV(`div`,{className:`space-y-4`,children:[
  jsxDEV(OV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3`,children:`Input Data Sources`},
  // {fileName:DV,lineNumber:83,columnNumber:13},this),
  jsxDEV(`div`,{className:`space-y-2`,children:AV.map(e=>
  jsxDEV(`div`,{className:`flex items-center justify-between py-1.5 border-b border-[#112035] last:border-0`,children:[
  jsxDEV(`div`,{className:`flex items-center gap-2`,children:[
  jsxDEV(`span`,{className:`w-1.5 h-1.5 rounded-full bg-[#10B981]`},
  // {fileName:DV,lineNumber:88,columnNumber:21},this),
  jsxDEV(`span`,{className:`text-xs text-[#B8D0E8]`,children:e.label},
  // {fileName:DV,lineNumber:89,columnNumber:21},this)]},
  // {fileName:DV,lineNumber:87,columnNumber:19},this),
  jsxDEV(`span`,{className:`font-data text-[10px] text-[#4A6080]`,children:e.rate},
  // {fileName:DV,lineNumber:91,columnNumber:19},this)]},e.label,!0,{fileName:DV,lineNumber:86,columnNumber:17},this))},
  // {fileName:DV,lineNumber:84,columnNumber:13},this)]},
  // {fileName:DV,lineNumber:82,columnNumber:11},this),
  jsxDEV(OV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3`,children:`Data Quality Indicators`},
  // {fileName:DV,lineNumber:99,columnNumber:13},this),
  jsxDEV(`div`,{className:`space-y-3`,children:jV.map(e=>
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`flex items-center justify-between mb-1`,children:[
  jsxDEV(`span`,{className:`text-xs text-[#7A95B0]`,children:e.label},
  // {fileName:DV,lineNumber:104,columnNumber:21},this),
  jsxDEV(`span`,{className:`font-data text-xs font-semibold`,style:{color:e.color},children:[e.value,`%`]},
  // {fileName:DV,lineNumber:105,columnNumber:21},this)]},
  // {fileName:DV,lineNumber:103,columnNumber:19},this),
  jsxDEV(`div`,{className:`bg-[#112035] rounded-full h-1`,children:
  jsxDEV(`div`,{className:`h-1 rounded-full`,style:{width:`${e.value}%`,backgroundColor:e.color}},
  // {fileName:DV,lineNumber:108,columnNumber:21},this)},
  // {fileName:DV,lineNumber:107,columnNumber:19},this)]},e.label,!0,{fileName:DV,lineNumber:102,columnNumber:17},this))},
  // {fileName:DV,lineNumber:100,columnNumber:13},this)]},
  // {fileName:DV,lineNumber:98,columnNumber:11},this),
  jsxDEV(OV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3`,children:`System Notes`},
  // {fileName:DV,lineNumber:117,columnNumber:13},this),
  jsxDEV(`div`,{className:`space-y-2 text-[11px] text-[#4A6080] leading-relaxed font-data`,children:[
  jsxDEV(`div`,{children:`• Designed for scalable multi-train prediction`},
  // {fileName:DV,lineNumber:119,columnNumber:15},this),
  jsxDEV(`div`,{children:`• Horizontal scaling via stateless microservices`},
  // {fileName:DV,lineNumber:120,columnNumber:15},this),
  jsxDEV(`div`,{children:`• Feature store shared across model versions`},
  // {fileName:DV,lineNumber:121,columnNumber:15},this),
  jsxDEV(`div`,{children:`• Event-driven architecture with Kafka-like messaging`},
  // {fileName:DV,lineNumber:122,columnNumber:15},this)]},
  // {fileName:DV,lineNumber:118,columnNumber:13},this)]},
  // {fileName:DV,lineNumber:116,columnNumber:11},this)]},
  // {fileName:DV,lineNumber:80,columnNumber:9},this)]},
  // {fileName:DV,lineNumber:42,columnNumber:7},this)]},
  // {fileName:DV,lineNumber:36,columnNumber:5},this)}
var NV=`/workspaces/default/.publishing/src/