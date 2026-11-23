import {useEffect,useState,type CSSProperties} from "react";
import type {Season} from "../lib/atelier";

const autumnColors = ["#d99e52", "#ab632f", "#ca7040", "#eed19a"];
const bulbs = ["#ff626d", "#ffd66b", "#75dcb8", "#8dbbff", "#ff92d1"];
const ornaments = [[50,29],[44,41],[59,46],[35,57],[51,62],[71,67],[27,78],[46,79],[64,80],[77,82]];

function ChristmasTree({side}:{side:"left"|"right"}){
  return <div className={"christmasTree seasonalEdge "+side}>
    <div className="treeTrunk"/>
    <div className="treeBranch treeBase"/><div className="treeBranch treeMiddle"/><div className="treeBranch treeTop"/>
    <div className="treeStar">★</div>
    {ornaments.map(([x,y],index)=><div key={index} className="treeOrnament" style={{
      left:x+"%",top:y+"%","--bulb":bulbs[(index+1)%bulbs.length],
    } as CSSProperties}/>)}
    {Array.from({length:17},(_,index)=>{
      const row = index<4?0:index<10?1:2;
      const position = index-[0,4,10][row];
      const fraction = position/[3,5,6][row];
      return <div key={index} className="treeBulb" style={{
        left:(50+(fraction-.5)*[26,44,67][row])+"%",
        top:([36,54,73][row]+Math.sin(fraction*Math.PI)*3)+"%",
        "--bulb":bulbs[index%bulbs.length],"--twinkleDelay":-(index%7)*.3+"s",
      } as CSSProperties}/>;
    })}
  </div>;
}

function Snowman({side}:{side:"left"|"right"}){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    let timer:number;
    function waitForSnowman(){
      timer=window.setTimeout(()=>{
        setVisible(true);
        timer=window.setTimeout(()=>{
          setVisible(false);
          waitForSnowman();
        },7800);
      },2500+Math.random()*12500);
    }
    waitForSnowman();
    return ()=>window.clearTimeout(timer);
  },[]);
  return visible ? <div className={"seasonalSnowman seasonalEdge "+side}>⛄</div> : null;
}

function Sleigh(){
  return <div className="sleighFlight">
    <div className="sleighTeam">
      <div className="sleighDeer">🦌 🦌</div>
      <div className="sleighRope"/>
      <div className="sleighCarriage"><div className="sleighSanta">🎅</div><div className="sleighGifts">🎁</div></div>
    </div>
  </div>;
}

export default function SeasonalEffect({season}:{season:Season}){
  if(season==="aus")return null;
  const christmas=season==="weihnachten";
  const snow=season!=="herbst";
  return <div className={"seasonalEffect"+(christmas?" christmasEffect":"")} aria-hidden="true">
    {christmas&&<div className="christmasLights">{Array.from({length:28},(_,index)=>
      <div key={index} className="borderBulb" style={{"--bulb":bulbs[index%bulbs.length],"--twinkleDelay":-(index%7)*.3+"s"} as CSSProperties}/>)}
    </div>}
    {Array.from({length:christmas?38:snow?28:18},(_,index)=>{
      const duration=11+(index*7)%11;
      const style={
        left:(index*37)%100+"%",
        "--duration":duration+"s",
        "--delay":-(index*13%duration)+"s",
        "--drift":(index%2===0?1:-1)*(24+(index*9)%64)+"px",
        "--size":(snow?7+(index*7)%12:10+(index*3)%10)+"px",
        "--leaf":autumnColors[index%autumnColors.length],
      } as CSSProperties;
      return <span key={season+index} className={snow?"snowParticle":"leafParticle"} style={style}>{snow?"❄":""}</span>;
    })}
    {snow&&<><Snowman side="left"/><Snowman side="right"/></>}
    {christmas&&<><ChristmasTree side="left"/><ChristmasTree side="right"/><Sleigh/></>}
  </div>;
}
