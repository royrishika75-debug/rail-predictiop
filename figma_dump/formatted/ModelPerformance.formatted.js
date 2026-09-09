pages/ModelPerformance.tsx`;

function gV({children:e,className:t=``}){return
  jsxDEV(`div`,{className:`bg-[#0C1526] border border-[#1A2840] rounded-lg ${t}`,children:e},
  // {fileName:$,lineNumber:4,columnNumber:10},this)}
var _V=[{name:`Baseline`,mae:12.4,rmse:16.8,accuracy:`52%`,inference:`4 ms`,badge:null},{name:`Random Forest`,mae:7.2,rmse:9.6,accuracy:`71%`,inference:`18 ms`,badge:null},{name:`XGBoost`,mae:5.8,rmse:7.9,accuracy:`78%`,inference:`12 ms`,badge:null},{name:`RailPredict V2`,mae:3.9,rmse:5.4,accuracy:`87%`,inference:`28 ms`,badge:`ACTIVE`}],vV=Array.from({length:28},(e,t)=>{
let n=Math.floor(Math.random()*35)+2,r=(Math.random()-.5)*8;return{actual:n,predicted:Math.max(0,Math.round(n+r))}}),yV=[{date:`Aug 1`,mae:4.8},{date:`Aug 8`,mae:4.5},{date:`Aug 15`,mae:4.1},{date:`Aug 22`,mae:3.9},{date:`Aug 29`,mae:3.9},{date:`Sep 1`,mae:3.9}];

function bV(){return _V[_V.length-1],
  jsxDEV(`div`,{className:`p-6 max-w-7xl mx-auto space-y-5`,children:[
  jsxDEV(`div`,{className:`flex items-start justify-between`,children:[
  jsxDEV(`div`,{children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1`,children:`Analysis`},
  // {fileName:$,lineNumber:33,columnNumber:11},this),
  jsxDEV(`h1`,{className:`font-display text-2xl font-bold text-white`,children:`Model Performance`},
  // {fileName:$,lineNumber:34,columnNumber:11},this),
  jsxDEV(`p`,{className:`text-sm text-[#4A6080] mt-1`,children:`Comparison across model versions — Demo Data only.`},
  // {fileName:$,lineNumber:35,columnNumber:11},this)]},
  // {fileName:$,lineNumber:32,columnNumber:9},this),
  jsxDEV(`div`,{className:`text-right text-[10px] font-data text-[#4A6080]`,children:[
  jsxDEV(`div`,{className:`text-[#F59E0B] font-semibold mb-1`,children:`⚠ DEMO DATA`},
  // {fileName:$,lineNumber:38,columnNumber:11},this),`Values require validation against production traffic`]},
  // {fileName:$,lineNumber:37,columnNumber:9},this)]},
  // {fileName:$,lineNumber:31,columnNumber:7},this),
  jsxDEV(gV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4`,children:`Model Comparison — Demo Data`},
  // {fileName:$,lineNumber:45,columnNumber:9},this),
  jsxDEV(`div`,{className:`overflow-x-auto`,children:
  jsxDEV(`table`,{className:`w-full`,children:[
  jsxDEV(`thead`,{children:
  jsxDEV(`tr`,{className:`border-b border-[#1A2840]`,children:[`Model`,`MAE (min)`,`RMSE (min)`,`Prediction Accuracy`,`Inference Time`,`Status`].map(e=>
  jsxDEV(`th`,{className:`text-left py-2 px-4 text-[11px] font-data text-[#4A6080] uppercase tracking-wider font-medium`,children:e},e,!1,{fileName:$,lineNumber:51,columnNumber:19},this))},
  // {fileName:$,lineNumber:49,columnNumber:15},this)},
  // {fileName:$,lineNumber:48,columnNumber:13},this),
  jsxDEV(`tbody`,{children:_V.map((e,t)=>{
let n=e.badge===`ACTIVE`;return
  jsxDEV(`tr`,{className:`border-b border-[#112035] hover:bg-[#112035] transition-colors ${n?`bg-[#0F1E38]`:``}`,children:[
  jsxDEV(`td`,{className:`py-3 px-4`,children:
  jsxDEV(`div`,{className:`flex items-center gap-2`,children:[
  jsxDEV(`span`,{className:`font-medium text-sm ${n?`text-[#3B82F6]`:`text-[#7A95B0]`}`,children:e.name},
  // {fileName:$,lineNumber:62,columnNumber:25},this),n&&
  jsxDEV(`span`,{className:`text-[9px] font-data bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 px-1.5 py-0.5 rounded`,children:`ACTIVE`},
  // {fileName:$,lineNumber:63,columnNumber:38},this)]},
  // {fileName:$,lineNumber:61,columnNumber:23},this)},
  // {fileName:$,lineNumber:60,columnNumber:21},this),
  jsxDEV(`td`,{className:`py-3 px-4 font-data text-sm`,style:{color:t===_V.length-1?`#10B981`:`#7A95B0`},children:e.mae},
  // {fileName:$,lineNumber:66,columnNumber:21},this),
  jsxDEV(`td`,{className:`py-3 px-4 font-data text-sm`,style:{color:t===_V.length-1?`#10B981`:`#7A95B0`},children:e.rmse},
  // {fileName:$,lineNumber:67,columnNumber:21},this),
  jsxDEV(`td`,{className:`py-3 px-4`,children:
  jsxDEV(`div`,{className:`flex items-center gap-2`,children:[
  jsxDEV(`div`,{className:`flex-1 max-w-[80px] bg-[#112035] rounded-full h-1.5`,children:
  jsxDEV(`div`,{className:`h-1.5 rounded-full bg-[#3B82F6]`,style:{width:e.accuracy}},
  // {fileName:$,lineNumber:71,columnNumber:27},this)},
  // {fileName:$,lineNumber:70,columnNumber:25},this),
  jsxDEV(`span`,{className:`font-data text-xs text-[#B8D0E8]`,children:e.accuracy},
  // {fileName:$,lineNumber:73,columnNumber:25},this)]},
  // {fileName:$,lineNumber:69,columnNumber:23},this)},
  // {fileName:$,lineNumber:68,columnNumber:21},this),
  jsxDEV(`td`,{className:`py-3 px-4 font-data text-xs text-[#7A95B0]`,children:e.inference},
  // {fileName:$,lineNumber:76,columnNumber:21},this),
  jsxDEV(`td`,{className:`py-3 px-4`,children:
  jsxDEV(`span`,{className:`text-[10px] font-data`,style:{color:t<_V.length-1?`#3B5E8C`:`#10B981`},children:t<_V.length-1?`Archived`:`● Active`},
  // {fileName:$,lineNumber:78,columnNumber:23},this)},
  // {fileName:$,lineNumber:77,columnNumber:21},this)]},e.name,!0,{fileName:$,lineNumber:59,columnNumber:19},this)})},
  // {fileName:$,lineNumber:55,columnNumber:13},this)]},
  // {fileName:$,lineNumber:47,columnNumber:11},this)},
  // {fileName:$,lineNumber:46,columnNumber:9},this)]},
  // {fileName:$,lineNumber:44,columnNumber:7},this),
  jsxDEV(`div`,{className:`grid grid-cols-1 lg:grid-cols-2 gap-5`,children:[
  jsxDEV(gV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1`,children:`Predicted vs. Actual Arrival Delay`},
  // {fileName:$,lineNumber:94,columnNumber:11},this),
  jsxDEV(`div`,{className:`text-[10px] text-[#3B5E8C] mb-4 font-data`,children:`RailPredict V2 · Demo Data · Historical Replay Sample`},
  // {fileName:$,lineNumber:95,columnNumber:11},this),
  jsxDEV(vu,{width:`100%`,height:220,children:
  jsxDEV(wB,{margin:{top:4,right:8,left:-20,bottom:0},children:[
  jsxDEV(sP,{strokeDasharray:`3 3`,stroke:`#112035`},
  // {fileName:$,lineNumber:98,columnNumber:15},this),
  jsxDEV(mR,{dataKey:`actual`,name:`Actual`,tick:{fontSize:10,fill:`#4A6080`,fontFamily:`JetBrains Mono`},axisLine:!1,tickLine:!1,label:{value:`Actual (min)`,position:`insideBottom`,offset:-2,fill:`#4A6080`,fontSize:10}},
  // {fileName:$,lineNumber:99,columnNumber:15},this),
  jsxDEV(kR,{dataKey:`predicted`,name:`Predicted`,tick:{fontSize:10,fill:`#4A6080`,fontFamily:`JetBrains Mono`},axisLine:!1,tickLine:!1,label:{value:`Predicted`,angle:-90,position:`insideLeft`,fill:`#4A6080`,fontSize:10}},
  // {fileName:$,lineNumber:100,columnNumber:15},this),
  jsxDEV(LD,{contentStyle:{backgroundColor:`#0C1526`,border:`1px solid #1A2840`,borderRadius:4,fontFamily:`JetBrains Mono`,fontSize:11},cursor:{strokeDasharray:`3 3`,stroke:`#2A4470`}},
  // {fileName:$,lineNumber:101,columnNumber:15},this),
  jsxDEV(RM,{stroke:`#2A4470`,segment:[{x:0,y:0},{x:40,y:40}],strokeDasharray:`4 2`,label:{value:`Perfect`,fill:`#3B5E8C`,fontSize:9}},
  // {fileName:$,lineNumber:105,columnNumber:15},this),
  jsxDEV(qL,{data:vV,fill:`#3B82F6`,opacity:.7,r:3},
  // {fileName:$,lineNumber:106,columnNumber:15},this)]},
  // {fileName:$,lineNumber:97,columnNumber:13},this)},
  // {fileName:$,lineNumber:96,columnNumber:11},this)]},
  // {fileName:$,lineNumber:93,columnNumber:9},this),
  jsxDEV(gV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1`,children:`MAE Trend — V2 Training History`},
  // {fileName:$,lineNumber:113,columnNumber:11},this),
  jsxDEV(`div`,{className:`text-[10px] text-[#3B5E8C] mb-4 font-data`,children:`Demo Data`},
  // {fileName:$,lineNumber:114,columnNumber:11},this),
  jsxDEV(vu,{width:`100%`,height:220,children:
  jsxDEV(bB,{data:yV,margin:{top:4,right:8,left:-20,bottom:0},children:[
  jsxDEV(sP,{strokeDasharray:`3 3`,stroke:`#112035`},
  // {fileName:$,lineNumber:117,columnNumber:15},this),
  jsxDEV(mR,{dataKey:`date`,tick:{fontSize:10,fill:`#4A6080`,fontFamily:`JetBrains Mono`},axisLine:!1,tickLine:!1},
  // {fileName:$,lineNumber:118,columnNumber:15},this),
  jsxDEV(kR,{tick:{fontSize:10,fill:`#4A6080`,fontFamily:`JetBrains Mono`},axisLine:!1,tickLine:!1,unit:` min`,domain:[3,5.5]},
  // {fileName:$,lineNumber:119,columnNumber:15},this),
  jsxDEV(LD,{contentStyle:{backgroundColor:`#0C1526`,border:`1px solid #1A2840`,borderRadius:4,fontFamily:`JetBrains Mono`,fontSize:11},labelStyle:{color:`#7A95B0`}},
  // {fileName:$,lineNumber:120,columnNumber:15},this),
  jsxDEV(dF,{type:`monotone`,dataKey:`mae`,stroke:`#10B981`,strokeWidth:2.5,dot:{fill:`#10B981`,r:4},name:`MAE`},
  // {fileName:$,lineNumber:124,columnNumber:15},this)]},
  // {fileName:$,lineNumber:116,columnNumber:13},this)},
  // {fileName:$,lineNumber:115,columnNumber:11},this)]},
  // {fileName:$,lineNumber:112,columnNumber:9},this)]},
  // {fileName:$,lineNumber:91,columnNumber:7},this),
  jsxDEV(gV,{className:`p-5`,children:[
  jsxDEV(`div`,{className:`text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4`,children:`Validation Strategy`},
  // {fileName:$,lineNumber:132,columnNumber:9},this),
  jsxDEV(`div`,{className:`grid grid-cols-1 md:grid-cols-3 gap-4`,children:[{title:`Chronological / Time-Based Split`,desc:`Training on earlier periods, testing on later periods. No future information leaks into the training set.`,icon:`◷`,color:`#3B82F6`},{title:`No Future Information`,desc:`Feature engineering and model training use only data available at prediction time. No look-ahead bias.`,icon:`▣`,color:`#10B981`},{title:`Continuous Drift Monitoring`,desc:`Ongoing monitoring for feature drift and prediction distribution shift. Retraining triggered by threshold breaches.`,icon:`⬡`,color:`#F59E0B`}].map(e=>
  jsxDEV(`div`,{className:`bg-[#112035] rounded-lg p-4`,children:[
  jsxDEV(`div`,{className:`text-lg mb-3`,style:{color:e.color},children:e.icon},
  // {fileName:$,lineNumber:155,columnNumber:15},this),
  jsxDEV(`div`,{className:`font-medium text-sm text-white mb-2`,children:e.title},
  // {fileName:$,lineNumber:156,columnNumber:15},this),
  jsxDEV(`div`,{className:`text-xs text-[#4A6080] leading-relaxed`,children:e.desc},
  // {fileName:$,lineNumber:157,columnNumber:15},this)]},e.title,!0,{fileName:$,lineNumber:154,columnNumber:13},this))},
  // {fileName:$,lineNumber:133,columnNumber:9},this)]},
  // {fileName:$,lineNumber:131,columnNumber:7},this)]},
  // {fileName:$,lineNumber:30,columnNumber:5},this)}
var xV=`/workspaces/default/.publishing/src/