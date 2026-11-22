export function Sprig({className=""}:{className?:string}) {
  return <svg viewBox="0 0 64 72" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 67C21 55 33 38 48 9M19 55 12 43M25 48 44 39M30 39 23 26M36 32 50 23M41 22 37 14"/>
    <path d="M14 47Q6 43 6 31Q15 34 14 47ZM20 53Q11 49 10 38Q20 42 20 53ZM24 46Q25 35 17 27Q15 38 24 46ZM28 44Q36 34 46 35Q39 44 28 44ZM34 34Q34 22 27 16Q24 26 34 34ZM38 29Q45 19 55 18Q53 27 38 29ZM42 21Q44 10 38 4Q33 13 42 21ZM46 15Q47 4 57 2Q55 11 46 15Z"/></svg>;
}
export function Icon({name}:{name:"grid"|"key"|"close"|"menu"|"upload"|"plus"|"photo"}){
 const paths={grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,key:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,close:<path d="m5 5 14 14M19 5 5 19"/>,menu:<path d="M3 6h18M3 12h18M3 18h18"/>,upload:<><path d="M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4"/></>,plus:<path d="M12 4v16M4 12h16"/>,photo:<><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="9" r="1.4"/><path d="m4 18 6-6 3 3 3-4 5 6"/></>};
 return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{paths[name]}</svg>;
}
