import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Globe} from './Globe';
import {defaults,type Visual,type Palette} from './encoding';
import {FrameCache,framePosition,getJson,ids,loadFrame,lodAt,runSchema,valueAt,windFrom,celsius,fahrenheit,mmHour,type Loaded,type Run,type Scale} from './fields';
import './style.css';

function Slider({label,value,onChange,min=0,max=1,step=0.05}:{label:string;value:number;onChange:(n:number)=>void;min?:number;max?:number;step?:number}){return <label className="slider"><span>{label}<output>{value.toFixed(step<1?2:0)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)}/></label>;}
const utc=(date:number|string)=>new Date(date).toLocaleString('en-GB',{timeZone:'UTC',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC';
const display=(v:number,unit:string)=>Number.isFinite(v)?`${v.toFixed(1)} ${unit}`:'Missing data';
function App(){
  const [visual,setVisual]=useState<Visual>(defaults);
  const [source,setSource]=useState<'fixture'|'gfs'>('fixture'),[scenario,setScenario]=useState('mixed'),[runs,setRuns]=useState<Run[]>([]),[run,setRun]=useState<Run>();
  const [hour,setHour]=useState(0),[playing,setPlaying]=useState(false),[rate,setRate]=useState(1);
  const [navigation,setNavigation]=useState<{scale:Scale;lon:number;lat:number;altitudeContext:{kind:'height_above_ground';value:number};viewMode:'plan'}>({scale:'planetary',lon:-70,lat:20,altitudeContext:{kind:'height_above_ground',value:0},viewMode:'plan'});
  const [point,setPoint]=useState<[number,number]>([-83.25,42.75]),[zoom,setZoom]=useState(0),[fps,setFps]=useState(0);
  const [pair,setPair]=useState<{a:Loaded;b:Loaded;key:string}>(),[status,setStatus]=useState('Loading synthetic laboratory…'),[error,setError]=useState('');
  const [renderError,setRenderError]=useState('');
  const [retry,setRetry]=useState(0);const cache=useRef(new FrameCache(4));
  const lod=lodAt(navigation.scale);
  // Quantize and bound regional requests. Dateline-centered views retain global 0.5° coverage.
  const cx=Math.round(navigation.lon/5)*5,cy=Math.round(navigation.lat/5)*5;
  const effectiveLod=lod===2&&Math.abs(cx)>150?1:lod;
  const bbox=effectiveLod===2?`${Math.max(-180,cx-30)},${Math.max(-90,cy-30)},${Math.min(180,cx+30)},${Math.min(90,cy+30)}`:undefined;
  const {low,high,fraction}=framePosition(hour);
  const dataKey=`${source}:${run?.runId}:${scenario}:${effectiveLod}:${bbox??''}:${low}:${high}`;
  useEffect(()=>{
    const ctrl=new AbortController();setError('');setStatus('Finding available runs…');setRun(undefined);setPair(undefined);setPlaying(false);setHour(0);
    getJson(`/api/runs?source=${source}`,ctrl.signal).then(data=>{const items=(data.runs as unknown[]).map(r=>runSchema.parse(r));setRuns(items);setRun(items[0]);}).catch(e=>{if(!ctrl.signal.aborted){setError(String(e.message));setStatus('Source unavailable');}});
    return()=>ctrl.abort();
  },[source,retry]);
  useEffect(()=>{
    if(!run)return;
    const ctrl=new AbortController();setError('');setStatus('Loading atmospheric fields…');
    const query=(lead:number)=>new URLSearchParams({source,run:run.runId,scenario,lead:String(lead),lod:String(effectiveLod),...(bbox?{bbox}:{})}).toString();
    const load=async(lead:number)=>{const q=query(lead),hit=cache.current.get(q);if(hit)return hit;const value=await loadFrame(q,ctrl.signal);cache.current.set(q,value);return value;};
    Promise.all([load(low),load(high)]).then(([a,b])=>{if(ctrl.signal.aborted)return;setPair({a,b,key:dataKey});setStatus(a.manifest.sourceState==='synthetic'?'Synthetic fixtures':a.manifest.sourceState==='cached'?'Cached GFS forecast':'Live GFS forecast');
      if(high<24)void load(high+3).catch(()=>{/* adjacent prefetch never blocks the current frame */});
    }).catch(e=>{if(!ctrl.signal.aborted){setError(String(e.message));setStatus('Field unavailable');setPlaying(false);}});
    return()=>ctrl.abort();
  },[run,source,scenario,effectiveLod,bbox,low,high,dataKey,retry]);
  const ready=pair?.key===dataKey;
  useEffect(()=>{if(!playing||!ready)return;let previous=performance.now();const timer=window.setInterval(()=>{const now=performance.now(),delta=Math.min((now-previous)/1000,0.3);previous=now;setHour(h=>{const next=h+delta*rate*0.75;return next%24;});},150);return()=>clearInterval(timer);},[playing,rate,ready]);
  function setting<K extends keyof Visual>(group:K,key:keyof Visual[K],value:Visual[K][keyof Visual[K]]){setVisual(v=>({...v,[group]:{...v[group],[key]:value}}));}
  const a=ready?pair?.a:undefined,b=ready?pair?.b:undefined;
  const get=(id:string)=>valueAt(a,b,id,...point,fraction);
  const u=get(ids.u),v=get(ids.v),valid=run?Date.parse(run.initializedAt)+hour*3600000:0;
  const converted=visual.temperature.unit==='C'?celsius:fahrenheit;
  return <div className="app">
    <header><div className="brand"><span className="brandmark">◉</span><div><strong>WEATHER</strong><span>VISUAL LAB / PHASE 0</span></div></div><div className="header-right"><span className="source-tag">{status}</span><span className="small">{navigation.scale} · LOD {effectiveLod}</span></div></header>
    <main><aside className="controls"><div className="section-label">ATMOSPHERIC FIELDS</div>
      <section><h2><span><i className="swatch thermal"/>Temperature</span><input aria-label="Temperature visible" type="checkbox" checked={visual.temperature.enabled} onChange={e=>setting('temperature','enabled',e.target.checked)}/></h2>
      <label>Palette<select aria-label="Temperature palette" value={visual.temperature.palette} onChange={e=>setting('temperature','palette',e.target.value as Palette)}><option value="thermal">Thermal spectrum</option><option value="icefire">Ice / fire</option><option value="mono">Monochrome</option><option value="custom">Custom endpoints</option></select></label>
      {visual.temperature.palette==='custom'&&<div className="row"><label>Cold<input aria-label="Low color" type="color" value={visual.temperature.lowColor} onChange={e=>setting('temperature','lowColor',e.target.value)}/></label><label>Hot<input aria-label="High color" type="color" value={visual.temperature.highColor} onChange={e=>setting('temperature','highColor',e.target.value)}/></label></div>}
      <div className="row"><label>Low (K)<input aria-label="Temperature low" type="number" min="180" max={visual.temperature.high-1} value={visual.temperature.low} onChange={e=>{const n=+e.target.value;if(n>=180&&n<visual.temperature.high)setting('temperature','low',n);}}/></label><label>High (K)<input aria-label="Temperature high" type="number" min={visual.temperature.low+1} max="350" value={visual.temperature.high} onChange={e=>{const n=+e.target.value;if(n>visual.temperature.low&&n<=350)setting('temperature','high',n);}}/></label></div>
      <Slider label="Temperature opacity" value={visual.temperature.opacity} onChange={n=>setting('temperature','opacity',n)}/>
      <label>Readout units<select value={visual.temperature.unit} onChange={e=>setting('temperature','unit',e.target.value as 'C'|'F')}><option value="C">Celsius · °C</option><option value="F">Fahrenheit · °F</option></select></label></section>
      <section><h2><span><i className="swatch rain"/>Precipitation</span><input aria-label="Precipitation visible" type="checkbox" checked={visual.rain.enabled} onChange={e=>setting('rain','enabled',e.target.checked)}/></h2>
      <label>Style<select aria-label="Precipitation style" value={visual.rain.palette} onChange={e=>setting('rain','palette',e.target.value as 'mint'|'violet')}><option value="mint">Mint texture</option><option value="violet">Violet texture</option></select></label>
      <Slider label="Precipitation intensity" max={3} value={visual.rain.intensity} onChange={n=>setting('rain','intensity',n)}/><Slider label="Precipitation opacity" value={visual.rain.opacity} onChange={n=>setting('rain','opacity',n)}/><Slider label="Texture amount" value={visual.rain.texture} onChange={n=>setting('rain','texture',n)}/></section>
      <section><h2><span><i className="swatch wind"/>Wind filaments</span><input aria-label="Wind visible" type="checkbox" checked={visual.wind.enabled} onChange={e=>setting('wind','enabled',e.target.checked)}/></h2>
      <Slider label="Filament density" min={0.2} max={1.5} value={visual.wind.density} onChange={n=>setting('wind','density',n)}/><Slider label="Length sensitivity" min={0.2} max={3} value={visual.wind.length} onChange={n=>setting('wind','length',n)}/><Slider label="Wind opacity" value={visual.wind.opacity} onChange={n=>setting('wind','opacity',n)}/>
      <details><summary>Experimental controls</summary><Slider label="Base brightness" value={visual.wind.brightness} onChange={n=>setting('wind','brightness',n)}/><Slider label="Pulse brightness" value={visual.wind.pulse} onChange={n=>setting('wind','pulse',n)}/><Slider label="Pulse animation" max={3} value={visual.wind.animation} onChange={n=>setting('wind','animation',n)}/><p className="small">Pulses show flow direction. Their animation speed is a visual setting.</p></details></section>
    </aside><div className="world">
      <Globe a={a} b={b} fraction={fraction} visual={visual} onPick={(lon,lat)=>setPoint([lon,lat])} onScale={(scale,lon,lat)=>setNavigation(n=>({...n,scale,lon,lat}))} onError={setRenderError} onFps={setFps} zoom={zoom}/>
      <div className="world-caption"><span className="section-label">{source==='fixture'?'DEMO · SYNTHETIC ATMOSPHERE':'NOAA / GFS FORECAST'}</span><p>{source==='fixture'?'Demonstration data. Choose Recent NOAA GFS under Source for real forecasts.':'Rotate to explore. Click to inspect.'}</p></div>
      {(!ready||error||renderError)&&<div className="notice" role="status">{renderError&&<p>{renderError}</p>}{error&&<p>{error}</p>}{!renderError&&!error&&'Loading fields…'}{error&&<button onClick={()=>setRetry(n=>n+1)}>Retry source</button>}{source==='gfs'&&error&&<button onClick={()=>setSource('fixture')}>Use synthetic fixtures</button>}</div>}
      <div className="zoom"><button aria-label="Zoom in" onClick={()=>setZoom(n=>n+1)}>+</button><button aria-label="Zoom out" onClick={()=>setZoom(n=>n-1)}>−</button></div>
      <div className="legend"><span>{display(converted(visual.temperature.low),'°'+visual.temperature.unit)}</span><div style={{background:`linear-gradient(90deg,${visual.temperature.palette==='custom'?visual.temperature.lowColor+', '+visual.temperature.highColor:visual.temperature.palette==='mono'?'#15252e,#d7f2f5':visual.temperature.palette==='icefire'?'#13225c,#65baf5,#faf3d4,#b8203f':'#152c78,#1ad2ca,#fbe27a,#ff603c'})`}}/><span>{display(converted(visual.temperature.high),'°'+visual.temperature.unit)}</span></div>
    </div><aside className="information"><div className="section-label">LOCATION INSPECTOR</div><h2 className="coordinates">{point[1].toFixed(2)}°<br/>{point[0].toFixed(2)}°</h2><div className="small">Latitude / longitude</div>
      <dl><dt>Temperature</dt><dd data-testid="temperature-value">{ready?display(converted(get(ids.temperature)),'°'+visual.temperature.unit):'Loading…'}</dd><dt>Precipitation</dt><dd>{ready?display(mmHour(get(ids.rain)),'mm/h'):'Loading…'}</dd><dt>Wind speed</dt><dd>{ready?display(Math.hypot(u,v),'m/s'):'Loading…'}</dd><dt>Wind from</dt><dd>{ready?Math.hypot(u,v)<0.05?'Calm':display(windFrom(u,v),'°'):'Loading…'}</dd></dl>
      <p className="time-state" data-testid="time-state">{fraction<0.001?'Model timestep':'Visual interpolation'}</p><p className="small">{source==='fixture'?'Synthetic values for visual experiments.': 'Forecast values, not observations.'} Missing samples remain masked.</p>
      <section><h2>Source</h2><label>Data source<select aria-label="Data source" value={source} onChange={e=>setSource(e.target.value as 'fixture'|'gfs')}><option value="fixture">Synthetic laboratory</option><option value="gfs">Recent NOAA GFS</option></select></label>
      {source==='fixture'?<label>Fixture<select aria-label="Fixture" value={scenario} onChange={e=>setScenario(e.target.value)}><option value="mixed">Evolving atmosphere</option><option value="cardinal">Cardinal winds</option><option value="rotational">Rotational winds</option><option value="gradient">Temperature gradient</option></select></label>:<label>Model run<select aria-label="Model run" value={run?.runId??''} onChange={e=>{setHour(0);setRun(runs.find(r=>r.runId===e.target.value));}}>{runs.map(r=><option key={r.runId} value={r.runId}>{utc(r.initializedAt)}</option>)}</select></label>}
      <details><summary>Source / details</summary><p className="small">Initialized: {run?utc(run.initializedAt):'—'}<br/>Valid: {valid?utc(valid):'—'}<br/>Lead: +{hour.toFixed(2)} h<br/>Native spacing: {run?.nativeResolution}°<br/>Loaded state: {a?.manifest.sourceState??'loading'}</p>
      {a?.manifest.fields.map(f=><p className="small" key={f.id}><strong>{f.displayName}</strong><br/>{f.sourceVariable} · {f.canonicalUnit}<br/>{f.verticalCoordinate.kind} {f.verticalCoordinate.value} {f.verticalCoordinate.unit}<br/>{f.horizontalGrid.dx}° render grid<br/>{f.temporalKind}{f.intervalStart&&` (${utc(f.intervalStart)} – ${utc(f.intervalEnd!)})`}<br/>Retrieved {utc(f.provenance.retrievedAt)}<br/>{f.provenance.transformations.join('; ')}</p>)}
      {!!a?.manifest.unavailableFields.length&&<p className="small">Unavailable: {a.manifest.unavailableFields.join(', ')}</p>}</details></section>
      <div className="performance">{fps} FPS <span>· experimental mappings</span></div>
    </aside></main>
    <footer><div className="timeline-top"><div className="transport"><button aria-label="Previous model frame" onClick={()=>{setPlaying(false);setHour(h=>Math.max(0,(Math.ceil(h/3)-1)*3));}}>‹</button><button className="play" aria-label={playing?'Pause':'Play'} disabled={!playing&&!ready} onClick={()=>{if(hour>=24)setHour(0);setPlaying(p=>!p);}}>{playing?'Ⅱ':'▶'}</button><button aria-label="Next model frame" onClick={()=>{setPlaying(false);setHour(h=>Math.min(24,(Math.floor(h/3)+1)*3));}}>›</button><select aria-label="Playback speed" value={rate} onChange={e=>setRate(+e.target.value)}>{[0.25,0.5,1,2,4].map(n=><option key={n} value={n}>{n}×</option>)}</select></div><div><strong data-testid="valid-time">{valid?utc(valid):'Loading timeline'}</strong><span className="small"> +{hour.toFixed(1)} h · {fraction<0.001?'model timestep':'visual interpolation'}</span></div></div>
    <input className="timeline" aria-label="Forecast time" type="range" min="0" max="24" step="0.05" value={hour} onPointerDown={()=>setPlaying(false)} onKeyDown={()=>setPlaying(false)} onChange={e=>{setPlaying(false);setHour(+e.target.value);}}/><div className="ticks">{[0,3,6,9,12,15,18,21,24].map(n=><span key={n}>+{n}h</span>)}</div></footer>
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
