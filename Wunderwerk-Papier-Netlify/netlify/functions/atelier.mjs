import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";

const statuses = ["Verfügbar", "Reserviert", "Nicht mehr verfügbar"];
const maxPhoto = 3500000;
const cookieName = "__Host-atelier_editor";
const eightHours = 28800;
const editorVersion = () => digest((process.env.ATELIER_ADMIN_EMAIL ?? "")+"\0"+(process.env.ATELIER_ADMIN_PASSWORD ?? ""));
const digest = text => createHash("sha256").update(text).digest("hex");
const store = name => getStore({name, consistency:"strong"});
function json(body,status=200,headers={}){
  return Response.json(body,{status,headers:{"Cache-Control":"no-store",...headers}});
}
function error(message,status){return json({error:message},status);}
function token(req){
  const value=req.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(cookieName+"="))?.slice(cookieName.length+1);
  return /^[a-f0-9]{64}$/.test(value ?? "")?digest(editorVersion()+value):null;
}
function cookie(value,age){return cookieName+"="+value+"; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age="+age;}
async function editor(req){
  const hash=token(req);
  if (!hash) return false;
  const session = await store("atelier-sessions").get(hash,{type:"json"});
  return session?.expires > Date.now();
}
async function editingPresence(req){
  const design=store("atelier-design");
  const sessions=store("atelier-sessions");
  if(req.method==="POST"){
    if(!await editor(req))return error("Bitte in der Verwaltung anmelden.",403);
    const expires=Date.now()+90000;
    await design.setJSON("bearbeitung",{session:token(req),expires});
    return json({active:true});
  }
  const presence=await design.get("bearbeitung",{type:"json"});
  if(!presence || presence.expires<=Date.now())return json({active:false});
  const session=await sessions.get(presence.session,{type:"json"});
  return json({active:(session?.expires ?? 0)>Date.now()});
}
async function rate(scope,context,max){
  const limits = store("atelier-limits");
  const key = scope+"/"+digest(context.ip || "unknown");
  const slot = Math.floor(Date.now()/600000);
  for(let attempt=0;attempt<8;attempt++){
    const previous=await limits.getWithMetadata(key,{type:"json"});
    const count=previous?.data.slot===slot ? previous.data.count : 0;
    if(count>=max)return false;
    const result=await limits.setJSON(key,{slot,count:count+1},previous ? {onlyIfMatch:previous.etag} : {onlyIfNew:true});
    if(result.modified)return true;
  }
  return false;
}
async function login(req,context){
  if(req.method==="DELETE"){
    const hash=token(req);
    if(hash) await store("atelier-sessions").delete(hash);
    return json({ok:true},200,{"Set-Cookie":cookie("",0)});
  }
  const email=process.env.ATELIER_ADMIN_EMAIL?.trim().toLowerCase();
  const password=process.env.ATELIER_ADMIN_PASSWORD;
  if(!email || !password || password.length<12) return error("Der Verwaltungszugang ist noch nicht eingerichtet.",503);
  const data=await req.json().catch(()=>null);
  if(typeof data?.email!=="string" || typeof data.password!=="string" || data.password.length>512 || data.email.length>254)
    return error("Bitte E-Mail-Adresse und Passwort eingeben.",400);
  if(!await rate("login",context,8)) return error("Zu viele Versuche. Bitte später erneut probieren.",429);
  const valid=timingSafeEqual(Buffer.from(digest(data.password),"hex"),Buffer.from(digest(password),"hex"));
  if(!valid || data.email.trim().toLowerCase()!==email) return error("E-Mail-Adresse oder Passwort stimmt nicht.",401);
  const value=randomBytes(32).toString("hex");
  const sessions=store("atelier-sessions");
  const previous=token(req);
  if(previous) await sessions.delete(previous);
  await sessions.setJSON(digest(editorVersion()+value),{expires:Date.now()+eightHours*1000});
  return json({ok:true},200,{"Set-Cookie":cookie(value,eightHours)});
}

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function works(req){
  const gallery=store("atelier-works");
  if(req.method==="GET"){
    const [{blobs},edit,hero]=await Promise.all([
      gallery.list(),editor(req),store("atelier-design").getMetadata("titelbild")
    ]);
    const rows=await Promise.all(blobs.map(({key})=>gallery.getMetadata(key)));
    const works=rows.flatMap(row=>{
      if(!row || row.metadata.archived)return [];
      const {id,title,category,status,price,description,version,updated}=row.metadata;
      const photo="/api/foto/"+id+"?v="+version;
      const photos=(row.metadata.photoLengths ?? [0]).map((_,index)=>photo+"&bild="+index);
      return [{id,title,category,status:statuses.includes(status)?status:"Nicht mehr verfügbar",price,description,version,updated,photo,photos}];
    }).sort((a,b)=>b.updated-a.updated || a.id.localeCompare(b.id));
    return json({access:{edit},works,heroUrl:hero?"/api/titelbild?v="+encodeURIComponent(hero.etag):""});
  }
  if(!await editor(req)) return error("Bitte in der Verwaltung anmelden.",403);
  const data=await req.formData().catch(()=>null);
  if(!data) return error("Ungültige Formulardaten.",400);
  const field=key=>String(data.get(key)??"").trim();
  const id=field("id"), version=Number(field("version"));
  if(!uuid.test(id) || !Number.isSafeInteger(version) || version<0 || version>2147483646)
    return error("Ungültige Werkdaten.",400);
  const conflict=()=>error("Das Werk wurde inzwischen geändert. Öffne es erneut.",409);
  const previous=version ? await gallery.getWithMetadata(id,{type:"arrayBuffer"}) : null;
  if(version && (!previous || previous.metadata.archived || previous.metadata.version!==version))return conflict();
  if(field("action")==="archive"){
    if(!previous)return conflict();
    const result=await gallery.set(id,previous.data,{metadata:{...previous.metadata,archived:true,version:version+1},onlyIfMatch:previous.etag});
    return result.modified?json({ok:true}):conflict();
  }
  const title=field("title"),category=field("category"),status=field("status"),description=field("description");
  const rawPrice=field("price");
  const price=rawPrice?Number(rawPrice):null;
  if(!title || title.length>100 || description.length>2000 ||
     !["Karten","Leinwände","Junk Journals"].includes(category) ||
     !statuses.includes(status) ||
     (rawPrice && !/^\d{1,8}$/.test(rawPrice))) return error("Bitte Titel, Bereich, Status und Preis prüfen.",400);
  const files=data.getAll("photo").filter(file=>typeof file!=="string" && file.size);
  if(files.length>6 || files.reduce((sum,file)=>sum+file.size,0)>maxPhoto)
    return error("Erlaubt sind bis zu 6 Fotos mit insgesamt 3,5 MB.",413);
  const images=await Promise.all(files.map(async file=>Buffer.from(await file.arrayBuffer())));
  if(images.some(photo=>photo.length<4 || photo[0]!==255 || photo[1]!==216 || photo[2]!==255))
    return error("Bitte lesbare JPEG-Fotos auswählen.",400);
  if(!previous && !images.length) return error("Wähle mindestens ein Foto für dein Werk.",400);
  const photoLengths=images.length ? images.map(photo=>photo.length) : previous.metadata.photoLengths;
  const metadata={id,title,category,status,price,description,version:version+1,updated:Date.now(),archived:false,
    ...(photoLengths?{photoLengths}:{})};
  const conditions=previous ? {onlyIfMatch:previous.etag} : {onlyIfNew:true};
  const result=await gallery.set(id,images.length ? Buffer.concat(images) : previous.data,{metadata,...conditions});
  return result.modified?json({ok:true,id}):conflict();
}
async function image(id,index){
  if(!uuid.test(id))return new Response(null,{status:404});
  const entry=await store("atelier-works").getWithMetadata(id,{type:"arrayBuffer"});
  if(!entry || entry.metadata.archived)return new Response(null,{status:404});
  const lengths=entry.metadata.photoLengths ?? [entry.data.byteLength];
  if(!Number.isInteger(index) || index<0 || index>=lengths.length)return new Response(null,{status:404});
  const start=lengths.slice(0,index).reduce((sum,length)=>sum+length,0);
  return new Response(entry.data.slice(start,start+lengths[index]),{headers:{"Content-Type":"image/jpeg","X-Content-Type-Options":"nosniff","Cache-Control":"no-cache"}});
}
async function heroImage(req){
  const design=store("atelier-design");
  if(req.method==="GET"){
    const image=await design.get("titelbild",{type:"arrayBuffer"});
    if(!image)return new Response(null,{status:404});
    return new Response(image,{headers:{"Content-Type":"image/jpeg","X-Content-Type-Options":"nosniff","Cache-Control":"no-cache"}});
  }
  if(!await editor(req))return error("Bitte in der Verwaltung anmelden.",403);
  const data=await req.formData().catch(()=>null);
  const file=data?.get("photo");
  if(!file || typeof file==="string" || file.size<4)return error("Bitte wähle ein Foto aus.",400);
  if(file.size>maxPhoto)return error("Das Titelbild ist zu groß.",413);
  const photo=Buffer.from(await file.arrayBuffer());
  if(photo[0]!==255 || photo[1]!==216 || photo[2]!==255)return error("Bitte ein lesbares JPEG-Foto auswählen.",400);
  await design.set("titelbild",photo);
  return json({ok:true});
}
async function contact(req,context){
  const {RESEND_API_KEY,ATELIER_MAIL_FROM,ATELIER_CONTACT_TO}=process.env;
  if(!RESEND_API_KEY || !ATELIER_MAIL_FROM || !ATELIER_CONTACT_TO)
    return error("Der E-Mail-Versand ist noch nicht eingerichtet. Bitte nutze Instagram für deine Anfrage.",503);
  const data=await req.json().catch(()=>null);
  const read=key=>typeof data?.[key]==="string"?data[key].trim():"";
  const name=read("name"), email=read("email"), message=read("message");
  if(!name || name.length>100 || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message || message.length>3000)
    return error("Bitte prüfe Name, E-Mail-Adresse und Nachricht.",400);
  if(!await rate("contact",context,5)) return error("Bitte versuche es später erneut.",429);
  const result=await fetch("https://api.resend.com/emails",{
    method:"POST",signal:AbortSignal.timeout(8000),
    headers:{Authorization:"Bearer "+RESEND_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({from:ATELIER_MAIL_FROM,to:[ATELIER_CONTACT_TO],reply_to:email,subject:"Kontaktanfrage an Wunderwerk Papier",text:name+" ("+email+")\n\n"+message})
  }).catch(()=>null);
  return result?.ok?json({ok:true}):error("Die Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.",502);
}

export default async function handler(req,context){
  const url=new URL(req.url);
  const path=url.pathname.replace(/^\/(?:api|\.netlify\/functions\/atelier)\//,"");
  try{
    const method=req.method;
    if(method!=="GET"){
      if(req.headers.get("x-atelier-request")!=="1" ||
         req.headers.get("sec-fetch-site")==="cross-site" ||
         (req.headers.has("origin") && req.headers.get("origin")!==url.origin))
        return error("Anfrage nicht zugelassen.",403);
      const max=["atelier","titelbild"].includes(path)?3700000:18000;
      if(Number(req.headers.get("content-length"))>max) return error("Die Anfrage ist zu groß.",413);
    }
    if(path==="atelier" && ["GET","POST"].includes(method)) return await works(req);
    if(path==="zugang" && ["POST","DELETE"].includes(method)) return await login(req,context);
    if(path==="titelbild" && ["GET","POST"].includes(method)) return await heroImage(req);
    if(path==="bearbeitung" && ["GET","POST"].includes(method)) return await editingPresence(req);
    if(path==="kontakt" && method==="POST") return await contact(req,context);
    if(path.startsWith("foto/") && method==="GET") return await image(path.slice(5),Number(url.searchParams.get("bild") ?? 0));
    return error("Nicht gefunden.",404);
  }catch(err){
    console.error("Atelier-Anfrage fehlgeschlagen",err?.code || err?.name);
    return error("Der Dienst ist vorübergehend nicht verfügbar.",503);
  }
}
