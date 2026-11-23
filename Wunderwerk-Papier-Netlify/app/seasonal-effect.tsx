import type { CSSProperties } from "react";
import type { Season } from "../lib/atelier";

const colors = ["#d99e52", "#ab632f", "#ca7040", "#eed19a"];

export default function SeasonalEffect({season}: {season:Season}) {
  if(season==="aus")return null;
  const snow=season==="schnee";
  return <div className="seasonalEffect" aria-hidden="true">
    {Array.from({length:snow?28:18},(_,index)=>{
      const duration=11+(index*7)%11;
      const style={
        left:(index*37)%100+"%",
        "--duration":duration+"s",
        "--delay":-(index*13%duration)+"s",
        "--drift":(index%2===0?1:-1)*(24+(index*9)%64)+"px",
        "--size":(snow?7+(index*7)%12:10+(index*3)%10)+"px",
        "--leaf":colors[index%colors.length],
      } as CSSProperties;
      return <span key={season+index} className={snow?"snowParticle":"leafParticle"} style={style}>{snow?"❄":""}</span>;
    })}
  </div>;
}
