import fs from 'fs';
import path from 'path';

const filePath = path.resolve('c:/Users/ayush/OneDrive/Desktop/theal/frontend/.aistudio/src/components/AdminPortal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Loading screen
content = content.replace(
  `bg-darknavy text-white`,
  `bg-warmwhite text-midnight`
);
content = content.replace(
  `Authenticating Portal Credentials...`,
  `Authenticating Portal Credentials...`
);

// 2. Sidebar and Main Layout
content = content.replace(
  `bg-slate-950 text-white flex flex-col md:flex-row relative`,
  `bg-warmwhite text-midnight flex flex-col md:flex-row relative`
);
content = content.replace(
  `bg-slate-900 border-r border-white/5 flex flex-col justify-between p-6 shrink-0 md:min-h-screen`,
  `bg-white/95 border-r border-slate-200/60 flex flex-col justify-between p-6 shrink-0 md:min-h-screen shadow-sm`
);
content = content.replace(
  `text-white leading-none">Art Ledger Desk`,
  `text-midnight leading-none">Art Ledger Desk`
);
content = content.replace(
  `text-[8px] font-mono text-slate-400 tracking-wider uppercase block mt-1">CURATOR PORTAL`,
  `text-[8px] font-mono text-slate-500 tracking-wider uppercase block mt-1">CURATOR PORTAL`
);

// 3. Tab Buttons in Sidebar
content = content.replaceAll(
  `bg-turquoise text-white shadow-md`,
  `bg-midnight text-white shadow-md shadow-midnight/15`
);
content = content.replaceAll(
  `text-slate-400 hover:bg-slate-800 hover:text-white`,
  `text-slate-600 hover:bg-[#EAE5D8]/50 hover:text-midnight`
);

// 4. Sidebar footer buttons
content = content.replace(
  `border-t border-white/5 space-y-4`,
  `border-t border-[#EAE5D8] space-y-4`
);
content = content.replace(
  `bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer`,
  `bg-slate-100 hover:bg-slate-200 text-midnight text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer`
);
content = content.replace(
  `bg-red-950/40 hover:bg-red-900 border border-red-500/10 text-red-400 text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer`,
  `bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer`
);

// 5. Main content panel
content = content.replace(
  `className="flex-1 p-8 md:p-12 overflow-y-auto max-h-screen"`,
  `className="flex-1 p-8 md:p-12 overflow-y-auto max-h-screen bg-warmwhite text-midnight"`
);

// 6. Header borders
content = content.replaceAll(
  `border-b border-white/5`,
  `border-b border-slate-200/60`
);
content = content.replaceAll(
  `text-3xl font-serif font-bold tracking-tight text-white`,
  `text-3xl font-serif font-bold tracking-tight text-midnight`
);

// 7. General grid, table cards, lists
content = content.replaceAll(
  `bg-slate-900 border border-white/5 rounded-2xl overflow-hidden`,
  `bg-white border border-[#EAE5D8] rounded-2xl overflow-hidden shadow-sm`
);
content = content.replaceAll(
  `bg-slate-900 border border-white/5 rounded-2xl space-y-2`,
  `bg-white border border-[#EAE5D8] rounded-2xl space-y-2 shadow-sm text-midnight`
);
content = content.replaceAll(
  `bg-slate-900 border border-white/5 rounded-[24px] space-y-4`,
  `bg-white border border-[#EAE5D8] rounded-[24px] space-y-4 shadow-sm text-midnight`
);
content = content.replaceAll(
  `text-white font-serif`,
  `text-midnight font-serif`
);
content = content.replaceAll(
  `text-white truncate`,
  `text-midnight truncate`
);
content = content.replaceAll(
  `text-white capitalize`,
  `text-midnight capitalize`
);
content = content.replaceAll(
  `text-white">{s.email}`,
  `text-midnight font-semibold">{s.email}`
);
content = content.replaceAll(
  `text-slate-300 font-mono`,
  `text-slate-600 font-mono`
);
content = content.replaceAll(
  `text-slate-300 font-serif`,
  `text-slate-700 font-serif`
);
content = content.replaceAll(
  `text-slate-400 font-mono`,
  `text-slate-600 font-mono`
);
content = content.replaceAll(
  `text-slate-400 font-serif`,
  `text-slate-600 font-serif`
);
content = content.replaceAll(
  `text-slate-500 font-mono`,
  `text-slate-500 font-mono`
);
content = content.replaceAll(
  `text-slate-400 uppercase font-mono`,
  `text-slate-500 uppercase font-mono`
);
content = content.replaceAll(
  `text-slate-300 font-sans`,
  `text-slate-600 font-sans`
);
content = content.replaceAll(
  `bg-slate-900/50`,
  `bg-slate-50/50`
);
content = content.replaceAll(
  `text-white flex items-center`,
  `text-midnight flex items-center`
);

// Buttons in manage table titles
content = content.replaceAll(
  `bg-turquoise hover:bg-turquoise/90`,
  `bg-midnight hover:bg-[#0B2545]`
);
content = content.replaceAll(
  `shadow-turquoise/10`,
  `shadow-midnight/10`
);
content = content.replaceAll(
  `shadow-turquoise/15`,
  `shadow-midnight/15`
);

// Tip box
content = content.replace(
  `text-slate-400 leading-relaxed">`,
  `text-slate-600 leading-relaxed font-medium">`
);

// 8. Tables
content = content.replaceAll(
  `divide-white/5`,
  `divide-slate-100`
);
content = content.replaceAll(
  `hover:bg-slate-800/40`,
  `hover:bg-slate-50/60`
);
content = content.replaceAll(
  `text-white max-w-sm truncate`,
  `text-midnight font-bold max-w-sm truncate`
);
content = content.replaceAll(
  `text-slate-300 border-b border-white/5`,
  `text-slate-600 border-b border-slate-100`
);
content = content.replaceAll(
  `text-slate-300`,
  `text-slate-600`
);
content = content.replaceAll(
  `bg-emerald-950 text-emerald-400 rounded-full font-mono text-[9px] uppercase font-bold border border-emerald-500/10`,
  `bg-emerald-50 text-emerald-700 rounded-full font-mono text-[9px] uppercase font-bold border border-emerald-200`
);
content = content.replaceAll(
  `bg-emerald-950 text-emerald-400`,
  `bg-emerald-50 text-emerald-700 border border-emerald-200`
);

// 9. Action buttons
content = content.replaceAll(
  `p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex`,
  `p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-midnight transition-colors cursor-pointer inline-flex`
);
content = content.replaceAll(
  `p-1.5 bg-red-950/40 hover:bg-red-900 border border-red-500/10 rounded-lg text-red-400 transition-colors cursor-pointer inline-flex`,
  `p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition-colors cursor-pointer inline-flex`
);

// 10. Form Modal overlay
content = content.replaceAll(
  `bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl z-10 text-white max-h-[90vh] flex flex-col`,
  `bg-white border border-[#EAE5D8] rounded-3xl overflow-hidden shadow-2xl z-10 text-midnight max-h-[90vh] flex flex-col`
);
content = content.replaceAll(
  `px-8 py-5 border-b border-white/5 flex justify-between items-center bg-slate-900`,
  `px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white`
);
content = content.replaceAll(
  `p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white`,
  `p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-midnight`
);
content = content.replaceAll(
  `px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest text-slate-300 hover:text-white cursor-pointer`,
  `px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest text-slate-600 hover:text-midnight cursor-pointer`
);
content = content.replaceAll(
  `bg-slate-950 border border-white/10 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-white outline-none`,
  `bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none`
);
content = content.replaceAll(
  `text-slate-400 font-bold uppercase block`,
  `text-slate-600 font-bold uppercase block`
);
content = content.replaceAll(
  `bg-slate-800`,
  `bg-slate-100`
);
content = content.replaceAll(
  `pt-6 border-t border-white/5 flex justify-end gap-3 bg-slate-900 sticky bottom-0`,
  `pt-6 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0`
);

// 11. Magazines Status badge
content = content.replaceAll(
  `bg-[#0B2545] text-turquoise border border-turquoise/20`,
  `bg-[#0B2545]/10 text-[#0B2545] border border-[#0B2545]/20`
);

// 12. Save Toast
content = content.replaceAll(
  `bg-turquoise text-white px-5 py-3.5 rounded-xl shadow-xl border border-white/10 text-xs font-mono font-bold`,
  `bg-midnight text-white px-5 py-3.5 rounded-xl shadow-xl border border-white/10 text-xs font-mono font-bold`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Admin portal styling updated successfully.');
