import { z } from 'zod';
export const ids = {temperature:'air_temperature_2m',rain:'precipitation_rate_surface',u:'eastward_wind_10m',v:'northward_wind_10m'} as const;
const stamp=z.string().datetime({offset:true});
const provenance=z.object({source:z.string(),synthetic:z.boolean(),retrievedAt:stamp,sourceResolution:z.number().positive(),transformations:z.array(z.string()),sourceUrl:z.string().nullable()});
const grid=z.object({width:z.number().int().min(2).max(1440),height:z.number().int().min(2).max(721),west:z.number(),south:z.number(),dx:z.number().positive(),dy:z.number().positive(),periodic:z.boolean(),order:z.literal('south_to_north_rows_eastward_columns')});
const descriptor=z.object({id:z.string(),displayName:z.string(),physicalQuantity:z.string(),canonicalUnit:z.string(),sourceProvider:z.string(),sourceModel:z.string(),sourceVariable:z.string(),runTime:stamp,validTime:stamp,forecastLead:z.number(),horizontalGrid:grid,verticalCoordinate:z.object({kind:z.enum(['surface','height_above_ground','pressure_level','altitude']),value:z.number().nullable(),unit:z.string().nullable()}),missingValuePolicy:z.literal('NaN_mask'),encoding:z.literal('float32-le'),temporalKind:z.enum(['instant','interval_mean','derived']),intervalStart:stamp.nullable(),intervalEnd:stamp.nullable(),provenance,payload:z.string().regex(/^\/api\/payload\/[a-f0-9]{64}$/)});
export const runSchema=z.object({provider:z.string(),model:z.string(),runId:z.string(),initializedAt:stamp,availableValidTimes:z.array(stamp).min(1),availableFields:z.array(z.string()),nativeResolution:z.number().positive(),provenance});
export const frameSchema=z.object({schemaVersion:z.literal(1),run:runSchema,fields:z.array(descriptor),unavailableFields:z.array(z.string()),sourceState:z.enum(['live','cached','synthetic']),lod:z.number().int().min(0).max(2)});
export type Run=z.infer<typeof runSchema>;
export type Descriptor=z.infer<typeof descriptor>;
export type Grid=z.infer<typeof grid>;
export type Loaded={manifest:z.infer<typeof frameSchema>;fields:Map<string,{descriptor:Descriptor;values:Float32Array}>};
export const wrap=(x:number)=>((x+180)%360+360)%360-180;
export function decodeBinary(buffer:ArrayBuffer,count:number){
  if(buffer.byteLength!==count*4)throw new Error('Field payload size does not match its grid');
  const view=new DataView(buffer), result=new Float32Array(count);
  for(let i=0;i<count;i++) result[i]=view.getFloat32(i*4,true);
  return result;
}
export async function getJson(url:string,signal?:AbortSignal){
  const response=await fetch(url,{signal});
  if(!response.ok){const detail=await response.json().catch(()=>({detail:'Data service unavailable'}));throw new Error(detail.detail??'Data request failed');}
  return response.json();
}
export async function loadFrame(query:string,signal?:AbortSignal):Promise<Loaded>{
  const manifest=frameSchema.parse(await getJson(`/api/frame?${query}`,signal));
  const fields=new Map<string,{descriptor:Descriptor;values:Float32Array}>();
  await Promise.all(manifest.fields.map(async descriptor=>{
    const response=await fetch(descriptor.payload,{signal});
    if(!response.ok)throw new Error('Field unavailable; reload this frame');
    const g=descriptor.horizontalGrid;
    fields.set(descriptor.id,{descriptor,values:decodeBinary(await response.arrayBuffer(),g.width*g.height)});
  }));
  return {manifest,fields};
}
/** Strict bilinear interpolation: any contributing missing sample masks the result. */
export function sample(field:Loaded['fields'] extends Map<string,infer V>?V:never,lon:number,lat:number){
  const g=field.descriptor.horizontalGrid;
  let x=(wrap(lon)-g.west)/g.dx;
  const y=(lat-g.south)/g.dy;
  if(g.periodic)x=((x%g.width)+g.width)%g.width;
  if(y<0||y>g.height-1||x<0||(!g.periodic&&x>g.width-1))return NaN;
  const x0=Math.floor(x),y0=Math.floor(y),x1=g.periodic?(x0+1)%g.width:Math.min(x0+1,g.width-1),y1=Math.min(y0+1,g.height-1);
  const tx=x-x0,ty=y-y0;
  let value=0;
  for(const [xx,yy,w] of [[x0,y0,(1-tx)*(1-ty)],[x1,y0,tx*(1-ty)],[x0,y1,(1-tx)*ty],[x1,y1,tx*ty]]){
    if(w===0)continue;
    const v=field.values[yy*g.width+xx];if(!Number.isFinite(v))return NaN;value+=w*v;
  }
  return value;
}
export function temporal(a:number,b:number,t:number){return t===0?a:t===1?b:Number.isFinite(a)&&Number.isFinite(b)?a+(b-a)*t:NaN;}
export function valueAt(a:Loaded|undefined,b:Loaded|undefined,id:string,lon:number,lat:number,t:number){
  const fa=a?.fields.get(id),fb=b?.fields.get(id);
  if(!fa)return NaN;
  if(t===0)return sample(fa,lon,lat);
  if(!fb)return NaN;
  const gap=Date.parse(fb.descriptor.validTime)-Date.parse(fa.descriptor.validTime);
  if(gap>3*3600000||gap<0)return NaN;
  return temporal(sample(fa,lon,lat),sample(fb,lon,lat),t);
}
export const speed=(u:number,v:number)=>Math.hypot(u,v);
/** Meteorological direction FROM, clockwise from north. */
export const windFrom=(u:number,v:number)=>Math.hypot(u,v)<1e-8?NaN:(Math.atan2(-u,-v)*180/Math.PI+360)%360;
export const celsius=(k:number)=>k-273.15;
export const fahrenheit=(k:number)=>(k-273.15)*9/5+32;
export const mmHour=(rate:number)=>rate*3600;
export type Scale='planetary'|'synoptic'|'regional'|'local';
export const scaleAt=(height:number):Scale=>height>8e6?'planetary':height>2e6?'synoptic':height>4e5?'regional':'local';
export const lodAt=(scale:Scale)=>scale==='planetary'?0:scale==='synoptic'?1:2;
export function framePosition(hour:number){const bounded=Math.max(0,Math.min(24,hour));const low=Math.floor(bounded/3)*3;return {low,high:Math.min(24,low+3),fraction:(bounded-low)/3};}
export class FrameCache{
  private entries=new Map<string,Loaded>();
  constructor(private capacity=4){}
  get(key:string){const value=this.entries.get(key);if(value){this.entries.delete(key);this.entries.set(key,value);}return value;}
  set(key:string,value:Loaded){this.entries.delete(key);this.entries.set(key,value);while(this.entries.size>this.capacity)this.entries.delete(this.entries.keys().next().value!);}
  get size(){return this.entries.size;}
}
