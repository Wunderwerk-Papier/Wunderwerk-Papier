"use client";
import {useEffect,useState} from "react";
import {categories,statuses, type Work} from "../lib/atelier";
import {Modal,type Access} from "./atelier";
import {Icon} from "./art";

async function preparePhoto(file:File){
 if(file.size>50_000_000) throw Error("Bitte wähle ein Foto unter 50 MB.");
 const url=URL.createObjectURL(file);
 try{
   const img=new Image();img.src=url;
   try{await img.decode();}catch{throw Error("Dieses Foto lässt sich nicht öffnen. Bitte wähle ein JPEG-, PNG- oder WebP-Bild.");}
   const scale=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const ctx=canvas.getContext("2d");if(!ctx) throw Error("Das Foto konnte nicht verarbeitet werden.");
   ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Foto konnte nicht gespeichert werden.")),"image/jpeg",.88));
 }finally{URL.revokeObjectURL(url);}
}
const blank=():Work=>({id:crypto.randomUUID(),title:"",category:"Karten",status:"Verfügbar",price:null,description:"",photo:"",version:0});
async function saveRequest(url:string,body:FormData|string){
 const headers:Record<string,string>={"x-atelier-request":"1"};
 if(typeof body==="string")headers["Content-Type"]="application/json";
 const r=await fetch(url,{method:"POST",body,headers});
 if(!r.ok){const data=await r.json().catch(()=>({})) as {error?:string};throw Error(data.error||"Speichern fehlgeschlagen. Bitte versuche es erneut.");}
}
export default function Management({access,works,loaded,loadError,refresh,close}:{access:Access;works:Work[];loaded:boolean;loadError:string;refresh:()=>Promise<void>;close:()=>void}){
 const [draft,setDraft]=useState<Work|null>(null),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[err,setErr]=useState(""),[askArchive,setAskArchive]=useState(false);

 useEffect(()=>{if(!file){setPreview("");return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 function edit(w:Work|null){setDraft(w);setFile(null);setPreview("");setMsg("");setErr("");setAskArchive(false);}
 async function perform(action:()=>Promise<void>){setBusy(true);setMsg("");setErr("");try{await action();}catch(e){setErr(e instanceof Error?e.message:"Die Verbindung wurde unterbrochen.");}finally{setBusy(false);}}
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!draft || busy)return;const data=new FormData(e.currentTarget);
  await perform(async()=>{const raw=String(data.get("price")||"").trim().replace(",",".");if(raw && !/^\d{1,6}(\.\d{1,2})?$/.test(raw)) throw Error("Bitte gib den Preis in Euro an, zum Beispiel 6,50.");
   data.set("price",raw?String(Math.round(Number(raw)*100)):"");data.set("id",draft.id);data.set("version",String(draft.version));
   if(file){const photo=await preparePhoto(file);if(photo.size>3500000)throw Error("Bitte wähle ein kleineres Foto.");data.set("photo",photo,"werk.jpg");}
   await saveRequest("/api/atelier",data);await refresh();edit(null);setMsg("Dein Werk wurde gespeichert.");
  });
 }
 async function archive(){if(!draft)return;await perform(async()=>{const data=new FormData();data.set("id",draft.id);data.set("version",String(draft.version));data.set("action","archive");await saveRequest("/api/atelier",data);await refresh();edit(null);setMsg("Das Werk wurde aus der Galerie genommen.");});}
 const feedback=<>{err&&<p role="alert" className="error">{err}</p>}{msg&&<p role="status" className="success">{msg}</p>}</>;
 return <Modal title="Werkverwaltung" close={()=>{if(!busy)close();}}><div className="manage"><p className="eyebrow">Atelierverwaltung</p><h2>{draft?(draft.version?"Werk bearbeiten":"Neues Werk"):"Werke verwalten"}</h2>
 {loadError?<p className="error">{loadError} <button className="textBtn" onClick={refresh}>Erneut laden</button></p>:!loaded?<p>Die Verwaltung wird geladen …</p>:!access.edit?<form onSubmit={e=>{
   e.preventDefault();
   const form=e.currentTarget;
   const data=new FormData(form);
   void perform(async()=>{
     await saveRequest("/api/zugang",JSON.stringify(Object.fromEntries(data)));
     form.reset();
     await refresh();
   });
 }}><fieldset disabled={busy}>
 <label>E-Mail-Adresse<input type="email" name="email" autoComplete="username" required/></label>
 <label>Passwort<input type="password" name="password" autoComplete="current-password" required/></label>
 {feedback}<button className="goldButton" type="submit">Anmelden</button>
 </fieldset></form>:draft?<form key={draft.id} onSubmit={submit}><fieldset disabled={busy}><label>Titel<input name="title" maxLength={100} required defaultValue={draft.title} placeholder="Wie heißt dein Werk?"/></label><div className="pair"><label>Bereich<select name="category" defaultValue={draft.category}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Verfügbarkeit<select name="status" defaultValue={draft.status}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label></div>
 <label>Preis in Euro <small>(optional)</small><input name="price" inputMode="decimal" defaultValue={draft.price===null?"":(draft.price/100).toFixed(2).replace(".",",")} placeholder="z. B. 6,50"/></label>
 <label>Foto<input type="file" accept="image/*" required={!draft.version} onChange={e=>setFile(e.target.files?.[0]||null)}/></label>{(preview||draft.photo)&&<img className="uploadPreview" src={preview||draft.photo} alt="Vorschau des Werkfotos"/>}
 <label>Beschreibung <small>(optional)</small><textarea name="description" maxLength={2000} defaultValue={draft.description} rows={3}/></label>{feedback}
 <div className="formActions"><button className="goldButton" type="submit"><Icon name="upload"/>{busy?"Wird gespeichert …":"Werk speichern"}</button><button type="button" className="textBtn" onClick={()=>edit(null)}>Zurück</button></div>
 {draft.version>0&&<div className="archive">{askArchive?<><p>Dieses Werk aus der Galerie nehmen?</p><button type="button" className="textBtn" onClick={archive}>Ja, ausblenden</button> <button className="textBtn" type="button" onClick={()=>setAskArchive(false)}>Abbrechen</button></>:<button className="textBtn" type="button" onClick={()=>setAskArchive(true)}>Aus Galerie nehmen</button>}</div>}</fieldset></form>:<>
 <button className="goldButton" onClick={()=>edit(blank())}><Icon name="plus"/>Neues Werk</button>{feedback}
 {works.length===0?<p className="manageEmpty">Dein erstes Werk ersetzt das Beispielmotiv in seinem Bereich.</p>:<ul className="manageList">{works.map(w=><li key={w.id}><img src={w.photo} alt=""/><div><strong>{w.title}</strong><small>{w.category} · {w.status}</small></div><button className="textBtn" onClick={()=>edit(w)}>Bearbeiten</button></li>)}</ul>}
 <button className="textBtn" disabled={busy} onClick={()=>void perform(async()=>{
   const result=await fetch("/api/zugang",{method:"DELETE",headers:{"x-atelier-request":"1"}});
   if(!result.ok) throw Error("Abmelden fehlgeschlagen.");
   await refresh();
 })}>Abmelden</button></>}</div></Modal>;
}
