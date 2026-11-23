"use client";
import {useEffect,useRef,useState} from "react";
import {categories,defaultHeroUrl,statuses,examples,galleryWorks,money,type Work,type Category} from "../lib/atelier";
import {Icon,Sprig} from "./art";
import Management from "./management";
import Contact from "./contact";
export type Access={edit:boolean};
const initial:Access={edit:false};
export function Modal({title,close,children,wide=false}:{title:string;close:()=>void;children:React.ReactNode;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const previous=document.activeElement as HTMLElement;el.showModal();const before=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{el.close();document.body.style.overflow=before;previous?.focus();};},[]);
 return <dialog ref={ref} className={wide?"modal wide":"modal"} aria-label={title} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}><div className="modalInner"><button className="dismiss" type="button" aria-label="Schließen" onClick={close}><Icon name="close"/></button>{children}</div></dialog>;
}
export function Badge({work}:{work:Work}){return <span className={"badge state"+statuses.indexOf(work.status)}><i/>{work.status}</span>;}
export default function Atelier(){
 const [works,setWorks]=useState<Work[]>([]),[access,setAccess]=useState<Access>(initial),[loaded,setLoaded]=useState(false),[error,setError]=useState(""),[section,setSection]=useState<Category|"Alle Werke">("Alle Werke"),[only,setOnly]=useState(false),[detail,setDetail]=useState<Work|null>(null),[manage,setManage]=useState(false),[menu,setMenu]=useState(false);
 const [editingActive,setEditingActive]=useState(false);
 const [heroUrl,setHeroUrl]=useState("");
 const [photoIndex,setPhotoIndex]=useState(0);
 const [contact,setContact]=useState(()=>new URLSearchParams(window.location.search).get("kontakt")==="1");
 const menuButton = useRef<HTMLButtonElement>(null);
 function openManagement() {
   setMenu(false);
   setManage(true);
 }
 async function reload(){
   try{const r=await fetch("/api/atelier",{cache:"no-store"});if(!r.ok)throw Error();const out=await r.json() as {works:Work[];access:Access;heroUrl?:string};setWorks(out.works);setHeroUrl(out.heroUrl ?? "");setAccess(out.access);setLoaded(true);setError("");}
   catch{setError("Die Werke konnten gerade nicht geladen werden.");}
 }
 useEffect(()=>{void reload();},[]);
 useEffect(()=>{
   let current=true;
   const controller=new AbortController();
   async function updatePresence(){
     try{
       const response=await fetch("/api/bearbeitung",{
         method:access.edit?"POST":"GET",
         headers:access.edit?{"x-atelier-request":"1"}:undefined,
         cache:"no-store",
         signal:controller.signal
       });
       if(!response.ok){if(current)setEditingActive(false);return;}
       const data=await response.json() as {active:boolean};
       if(current)setEditingActive(data.active===true);
     }catch{if(current)setEditingActive(false);}
   }
   void updatePresence();
   const interval=window.setInterval(()=>void updatePresence(),30000);
   return ()=>{
     current=false;
     controller.abort();
     window.clearInterval(interval);
   };
 },[access.edit]);
 function go(cat:Category|"Alle Werke"){setSection(cat);setOnly(false);setMenu(false);document.getElementById("galerie")?.scrollIntoView();}
 const displayed=(loaded?galleryWorks(works):examples).filter(w=>(section==="Alle Werke"||w.category===section)&&(!only||w.status==="Verfügbar"));
 return <><a className="skip" href="#galerie">Zur Werkschau</a><header><div className="wrap headrow">
 <a className="brand" href="#anfang" onClick={()=>setMenu(false)}><Sprig/><span>Wunderwerk <em>Papier</em></span></a>
 <nav id="hauptnavigation" aria-label="Hauptnavigation" className={menu?"open":""}
   onKeyDown={event=>{
     if (event.key === "Escape" && menu) {
       setMenu(false);
       menuButton.current?.focus();
     }
   }}>{categories.map(c=><a href="#galerie" key={c} onClick={e=>{e.preventDefault();go(c);}}>{c}</a>)}
   <button className="navAdmin" onClick={openManagement}><Icon name="key"/>Verwaltung</button>
 </nav>
 <button className="adminLink" aria-label="Verwaltung" onClick={openManagement}><Icon name="key"/><span>Verwaltung</span></button>
 <button ref={menuButton} className="menuButton" aria-controls="hauptnavigation" aria-expanded={menu}
   onClick={()=>{
     setMenu(!menu);
     if (!menu) requestAnimationFrame(()=>document.querySelector<HTMLElement>("#hauptnavigation a")?.focus({preventScroll:true}));
   }}><Icon name={menu?"close":"menu"}/>Menü</button></div></header>
 <main id="anfang">{editingActive&&<div className="editingNotice" role="status">Hier geschieht gerade eine kreative Umgestaltung.</div>}<section className="hero"><div className="wrap heroGrid"><div className="intro">
 <p className="eyebrow"><b aria-hidden="true"/>Kreativatelier</p><h1>Papier, Farbe<br/><em>&amp; Fantasie.</em></h1>
 <p className="lead">Handgemachte Karten, bemalte Leinwände und Junk Journals voller kleiner Fundstücke.</p>
 <a className="goldButton" href="#galerie" onClick={e=>{e.preventDefault();go("Alle Werke");}}><Icon name="grid"/>Werke entdecken</a>
 <div className="contactActions">
   <button className="outlined" onClick={()=>setContact(true)}>Kontakt</button>
   <a className="outlined" href="https://www.instagram.com/wunderwerk_papier_?hvrq=MWJpZmZ2bHJteHZ3Nw==" target="_blank" rel="noopener noreferrer">Instagram</a>
 </div></div>
 <figure className="heroArt"><div className="photoFrame"><img src={heroUrl || defaultHeroUrl} className={heroUrl ? undefined : "defaultHero"} width="1172" height="1600" alt="Titelbild von Wunderwerk Papier"/></div><span className="star star1" aria-hidden="true">✦</span><span className="star star2" aria-hidden="true">✧</span></figure>
 </div></section>
 <div className="wrap divider" aria-hidden="true"><i/><span>✧</span><i/></div>
 <section id="galerie" className="wrap collection"><div className="collectionHead"><div><p className="eyebrow"><b aria-hidden="true"/>Die Kollektion</p><h2>Aus dem Atelier</h2></div><label className="filter"><input type="checkbox" checked={only} onChange={e=>setOnly(e.target.checked)}/><span className="switch"/>Nur verfügbare Werke</label></div>
 <div className="tabs" role="group" aria-label="Werke nach Bereich anzeigen">{(["Alle Werke",...categories] as const).map(c=><button key={c} aria-pressed={section===c} onClick={()=>setSection(c)}>{c}</button>)}</div>
 {error?<div className="notice" role="alert">{error} <button className="textBtn" onClick={reload}>Erneut versuchen</button></div>:<div className="cards" aria-live="polite">{displayed.map(w=><button key={w.id} className="workCard" onClick={()=>{setPhotoIndex(0);setDetail(w);}} aria-label={w.title+", "+w.category+", "+w.status}><div className="cardPhoto"><img loading="lazy" src={w.photo} alt={w.title}/><Badge work={w}/></div><div className="cardBody"><span className="meta">{w.category}{w.demo?" · Musterstück":""}</span><div className="cardTitle"><h3>{w.title}</h3>{w.price!==null&&<span>{money(w.price)}</span>}</div></div></button>)}
 {!displayed.length&&<div className="empty">In diesem Bereich ist momentan kein Werk verfügbar. <button className="textBtn" onClick={()=>setOnly(false)}>Alle Status anzeigen</button></div>}</div>}</section>
 </main><footer><div className="wrap footerRow"><a className="brand small" href="#anfang"><Sprig/><span>Wunderwerk <em>Papier</em></span></a><span>Kreativatelier</span><a href="/impressum.html">Impressum</a><a href="#anfang">Zum Seitenanfang</a></div></footer>
 {detail&&<Modal wide title={detail.title} close={()=>setDetail(null)}><div className="detail"><div className="detailImages">
 <img className="detailPhoto" src={detail.photos?.[photoIndex] ?? detail.photo} alt={detail.title+" · Foto "+(photoIndex+1)}/>
 {(detail.photos?.length ?? 0)>1&&<div className="photoOptions" aria-label="Weitere Fotos">{detail.photos!.map((src,i)=>
  <button type="button" key={src} aria-label={"Foto "+(i+1)+" anzeigen"} aria-pressed={i===photoIndex} onClick={()=>setPhotoIndex(i)}><img src={src} alt=""/></button>)}</div>}
 </div><div className="detailText"><p className="eyebrow">{detail.category}</p><h2>{detail.title}</h2><Badge work={detail}/>{detail.price!==null&&<p className="detailPrice">{money(detail.price)}</p>}{detail.description&&<p className="description">{detail.description}</p>}{detail.demo&&<p className="fineprint">Musterstück zur Vorschau. Der Status und ein eventuell angezeigter Preis dienen der Illustration.</p>}</div></div></Modal>}
 {contact&&<Contact close={()=>setContact(false)}/>}
 {manage&&<Management heroUrl={heroUrl} access={access} works={works} loaded={loaded} loadError={error} refresh={reload} close={()=>setManage(false)}/>}</>;
}
