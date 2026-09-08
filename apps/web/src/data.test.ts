import {describe,it,expect} from 'vitest';
import {decodeBinary,sample,temporal,windFrom,speed,scaleAt,lodAt,celsius,fahrenheit,mmHour,FrameCache,framePosition,forecastSteps,type Run,type Loaded,type Descriptor} from './fields';
import {normalize,color,filament,filamentLength,encode,registry} from './encoding';
const grid={width:4,height:2,west:-180,south:-90,dx:90,dy:180,periodic:true,order:'south_to_north_rows_eastward_columns' as const};
describe('physical and visual boundaries',()=>{
 it('decodes little endian and rejects truncated payloads',()=>{const b=new ArrayBuffer(8);new DataView(b).setFloat32(0,280,true);new DataView(b).setFloat32(4,NaN,true);expect(decodeBinary(b,2)[0]).toBe(280);expect(decodeBinary(b,2)[1]).toBeNaN();expect(()=>decodeBinary(b,3)).toThrow();});
 it('wraps longitude and preserves missing samples',()=>{const values=new Float32Array([0,10,20,30,0,10,20,30]);const f={values,descriptor:{horizontalGrid:grid} as Descriptor};expect(sample(f,180,0)).toBe(0);expect(sample(f,135,0)).toBe(15);values[1]=NaN;expect(sample(f,-135,-90)).toBeNaN();expect(sample(f,-180,-90)).toBe(0);});
 it('interpolates components through reversal rather than angles',()=>{expect(speed(temporal(10,-10,.5),0)).toBe(0);expect(windFrom(0,0)).toBeNaN();expect(temporal(NaN,5,.5)).toBeNaN();expect(temporal(5,NaN,0)).toBe(5);});
 it.each([[10,0,270],[-10,0,90],[0,10,180],[0,-10,0],[10,10,225]])('meteorological from direction %s,%s',(u,v,d)=>expect(windFrom(u,v)).toBe(d));
 it.each([[10,0,1,0],[-10,0,-1,0],[0,10,0,1],[0,-10,0,-1],[10,10,1,1]])('filament tail-to-head %s,%s',(u,v,x,y)=>{const p=filament(0,0,u,v,2);expect(Math.abs(p[4][0]-p[0][0])<1e-8?0:Math.sign(p[4][0]-p[0][0])).toBe(x);expect(Math.abs(p[4][1]-p[0][1])<1e-8?0:Math.sign(p[4][1]-p[0][1])).toBe(y);});
 it('masks calm and missing wind; bounds extreme length',()=>{expect(filament(0,0,0,0,1)).toEqual([]);expect(filament(0,0,NaN,1,1)).toEqual([]);expect(filamentLength(1000,1,1)).toBe(3);expect(filamentLength(30,1,1)).toBeGreaterThan(filamentLength(3,1,1));const p=filament(179.9,0,10,0,2);expect(p[4][0]).toBeGreaterThan(180);});
 it('uses fixed domains, conversions and linear-light color',()=>{expect(normalize(273,233,313)).toBe(.5);expect(normalize(NaN,0,1)).toBeNaN();expect(color(.5,['#000000','#ffffff'])[0]).toBe(188);expect(celsius(273.15)).toBe(0);expect(fahrenheit(273.15)).toBe(32);expect(mmHour(.001)).toBe(3.6);expect(encode(registry.get('rain')!,0)).toBe(0);});
 it('classifies scale and bounds frame-cache size',()=>{expect(scaleAt(9e6)).toBe('planetary');expect(lodAt(scaleAt(1e5))).toBe(2);const cache=new FrameCache(2);cache.set('1',{} as Loaded);cache.set('2',{} as Loaded);cache.get('1');cache.set('3',{} as Loaded);expect(cache.get('2')).toBeUndefined();expect(cache.size).toBe(2);expect(framePosition(1.5)).toEqual({low:0,high:3,fraction:.5});});
});

 it('derives sorted unique forecast steps from the run without inventing intervals',()=>{
   const initializedAt='2026-01-01T00:00:00Z';
   const run={initializedAt,availableValidTimes:['2026-01-02T00:00:00Z','2026-01-01T03:00:00Z','2026-01-01T09:00:00Z','2026-01-01T03:00:00Z']} as Run;
   expect(forecastSteps(run).map(step=>step.lead)).toEqual([3,9,24]);
   expect(forecastSteps(undefined)).toEqual([]);
   expect(forecastSteps({...run,availableValidTimes:[initializedAt]})).toEqual([{valid:Date.parse(initializedAt),lead:0}]);
 });
