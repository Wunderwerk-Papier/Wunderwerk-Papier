export const categories = ["Karten", "Leinwände", "Junk Journals"] as const;
export const statuses = ["Verfügbar", "Reserviert", "Verkauft"] as const;
export type Category = typeof categories[number];
export type Status = typeof statuses[number];
export type Work = {
  id: string; title: string; category: Category; status: Status; price: number | null;
  description: string; photo: string; version: number; demo?: boolean;
};
export function money(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
export const examples: Work[] = [
  {id:"bluetengruss", title:"Ein Blütengruß", category:"Karten", status:"Verfügbar",price:650,description:"Eine rosa Papierblüte wirft kleine Schatten auf den Karton. Gerissene Kanten und ein zart getönter Umschlag greifen die Farbe der Blütenblätter auf."},
  {id:"sommerwiese",title:"Blüten im Abendlicht",category:"Leinwände",status:"Reserviert",price:null,description:"Blüten in Ocker, Rosé und Rostrot auf hellem Grund. Der pastose Farbauftrag lässt einzelne Blütenblätter aus der Leinwand hervortreten."},
  {id:"fundstuecke",title:"Gesammelte Fundstücke",category:"Junk Journals",status:"Verkauft",price:null,description:"Spitze, Papier und Stoffbänder halten kleine Erinnerungen fest. Zwischen den handgebundenen Seiten ist Platz für Fundstücke und persönliche Notizen."}
].map(w=>({...w,category:w.category as Category,status:w.status as Status,photo:"/atelier/"+w.id+".webp",version:0,demo:true}));
export function galleryWorks(real:Work[]) {
  return [...real, ...examples.filter(e=>!real.some(r=>r.category===e.category))];
}
