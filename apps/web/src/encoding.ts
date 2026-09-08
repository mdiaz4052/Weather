import { ids } from './fields';
export type Mapping={id:string;sourceField:string;normalization:{low:number;high:number};transform:'linear'|'sqrt'|'smoothstep';targetChannel:'hue'|'opacity'|'filamentLength';representation:'scalar'|'texture'|'filament';experimental:true};
export const mappings:Mapping[]=[
  {id:'temperature',sourceField:ids.temperature,normalization:{low:240,high:315},transform:'linear',targetChannel:'hue',representation:'scalar',experimental:true},
  {id:'rain',sourceField:ids.rain,normalization:{low:0,high:0.005},transform:'sqrt',targetChannel:'opacity',representation:'texture',experimental:true},
  {id:'wind',sourceField:'wind_speed_10m',normalization:{low:0,high:60},transform:'sqrt',targetChannel:'filamentLength',representation:'filament',experimental:true}
];
export const registry=new Map(mappings.map(m=>[m.id,m]));
export function normalize(value:number,low:number,high:number){return !Number.isFinite(value)||high<=low?NaN:Math.max(0,Math.min(1,(value-low)/(high-low)));}
export function transform(t:number,kind:Mapping['transform']){return kind==='sqrt'?Math.sqrt(t):kind==='smoothstep'?t*t*(3-2*t):t;}
export function encode(mapping:Mapping,value:number){return transform(normalize(value,mapping.normalization.low,mapping.normalization.high),mapping.transform);}
export const palettes={thermal:['#152c78','#1ad2ca','#fbe27a','#ff603c'],icefire:['#13225c','#65baf5','#faf3d4','#b8203f'],mono:['#15252e','#d7f2f5']} as const;
export type Palette=keyof typeof palettes|'custom';
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
// Interpolate in linear-light RGB rather than gamma-encoded sRGB.
const linear=(v:number)=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
const srgb=(v:number)=>v<=0.0031308?12.92*v:1.055*v**(1/2.4)-0.055;
export function color(t:number,stops:readonly string[]){const p=Math.max(0,Math.min(1,t))*(stops.length-1),i=Math.min(stops.length-2,Math.floor(p)),f=p-i;const a=rgb(stops[i]),b=rgb(stops[i+1]);return a.map((v,j)=>Math.round(255*srgb(linear(v)+(linear(b[j])-linear(v))*f)));}
export type Visual={temperature:{enabled:boolean;palette:Palette;lowColor:string;highColor:string;low:number;high:number;opacity:number;unit:'C'|'F'},rain:{enabled:boolean;intensity:number;opacity:number;texture:number;palette:'mint'|'violet'},wind:{enabled:boolean;density:number;length:number;opacity:number;brightness:number;pulse:number;animation:number}};
export const defaults:Visual={temperature:{enabled:true,palette:'thermal',lowColor:'#152c78',highColor:'#ff603c',low:240,high:315,opacity:0.67,unit:'C'},rain:{enabled:true,intensity:1,opacity:0.8,texture:0.3,palette:'mint'},wind:{enabled:true,density:0.6,length:1,opacity:0.8,brightness:0.5,pulse:1,animation:1}};
export function filamentLength(speed:number,sensitivity:number,scaleFactor:number){return speed<0.05?0:encode(registry.get('wind')!,speed)*3*sensitivity*scaleFactor;}
/** Tail to head follows the east/north vector; geodesic destinations avoid polar singularities. */
export function filament(lon:number,lat:number,u:number,v:number,length:number):[number,number][] {
  if(!Number.isFinite(u+v)||Math.hypot(u,v)<0.05||length<=0)return [];
  const bearing=Math.atan2(u,v),phi=lat*Math.PI/180,lambda=lon*Math.PI/180;
  return [-0.5,-0.25,0,0.25,0.5].map(t=>{const d=t*length*Math.PI/180;const p=Math.asin(Math.sin(phi)*Math.cos(d)+Math.cos(phi)*Math.sin(d)*Math.cos(bearing));const l=lambda+Math.atan2(Math.sin(bearing)*Math.sin(d)*Math.cos(phi),Math.cos(d)-Math.sin(phi)*Math.sin(p));return [l*180/Math.PI,p*180/Math.PI];});
}
