"use client";
import { useState } from "react";
import { Modal } from "./atelier";

export default function Contact({close}:{close:()=>void}) {
  const [busy,setBusy]=useState(false), [sent,setSent]=useState(false), [error,setError]=useState("");
  return <Modal title="Kontakt" close={()=>{if(!busy)close();}}>
    <div className="manage"><h2>Kontakt</h2>
      {sent?<p role="status">Deine Nachricht wurde gesendet.</p>:<form onSubmit={async event=>{
        event.preventDefault();
        const data=new FormData(event.currentTarget);
        setBusy(true);setError("");
        try {
          const result=await fetch("/api/kontakt",{method:"POST",headers:{"Content-Type":"application/json","x-atelier-request":"1"},body:JSON.stringify(Object.fromEntries(data))});
          const reply=await result.json() as {error?:string};
          if(!result.ok)throw Error(reply.error || "Versand fehlgeschlagen.");
          setSent(true);
        } catch(err) {
          setError(err instanceof Error ? err.message : "Versand fehlgeschlagen.");
        } finally {setBusy(false);}
      }}><fieldset disabled={busy}>
        <label>Name<input name="name" required maxLength={100} autoComplete="name"/></label>
        <label>Deine E-Mail-Adresse<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>
        <label>Nachricht<textarea name="message" required maxLength={3000} rows={5}/></label>
        {error&&<p className="error" role="alert">{error}</p>}
        <button className="goldButton" type="submit">{busy?"Wird gesendet …":"Nachricht senden"}</button>
      </fieldset></form>}
    </div>
  </Modal>;
}
