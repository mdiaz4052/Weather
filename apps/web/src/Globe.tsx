import { useEffect, useRef } from 'react';
import * as C from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { ids, valueAt, scaleAt, type Loaded, type Scale } from './fields';
import { color, palettes, encode, registry, filament, filamentLength, type Visual } from './encoding';

type Props={a?:Loaded;b?:Loaded;fraction:number;visual:Visual;onPick:(lon:number,lat:number)=>void;onScale:(scale:Scale,lon:number,lat:number)=>void;onError:(error:string)=>void;onFps:(fps:number)=>void;zoom:number};
function scalarCanvas(props:Props,kind:'temperature'|'rain'){
  const field=props.a?.fields.get(kind==='temperature'?ids.temperature:ids.rain);
  const g=field?.descriptor.horizontalGrid;
  const canvas=document.createElement('canvas');canvas.width=g?g.width+(g.periodic?1:0):2;canvas.height=g?.height??2;
  const ctx=canvas.getContext('2d')!,image=ctx.createImageData(canvas.width,canvas.height);
  const settings=props.visual[kind];
  if(!g||!settings.enabled)return canvas;
  const mapping=registry.get(kind)!;
  const t=props.visual.temperature;
  const temperatureMapping={...mapping,normalization:{low:t.low,high:t.high}};
  const colors=Array.from({length:256},(_,i)=>color(i/255,t.palette==='custom'?[t.lowColor,t.highColor]:palettes[t.palette]));
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const lon=g.west+x*g.dx,lat=g.south+(g.height-1-y)*g.dy,index=(y*canvas.width+x)*4;
    const v=valueAt(props.a,props.b,kind==='temperature'?ids.temperature:ids.rain,lon,lat,props.fraction);
    if(!settings.enabled||!Number.isFinite(v))continue;
    let rgb:number[],alpha:number;
    if(kind==='temperature'){
      rgb=colors[Math.round(encode(temperatureMapping,v)*255)];alpha=t.opacity;
    }else{
      const r=props.visual.rain,amount=encode(mapping,v)*r.intensity;
      const noise=((x*73+y*139)%101)/100;
      rgb=r.palette==='mint'?[153,255,205]:[210,175,255];
      alpha=Math.min(1,amount)*r.opacity*(1-r.texture+r.texture*noise);
    }
    image.data.set([...rgb,Math.round(alpha*255)],index);
  }
  ctx.putImageData(image,0,0);return canvas;
}
export function Globe(props:Props){
  const container=useRef<HTMLDivElement>(null),viewer=useRef<C.Viewer|null>(null),latest=useRef(props);
  latest.current=props;
  const layers=useRef<{temp:C.Primitive;rain:C.Primitive;wind:C.PolylineCollection;material:C.Material;gridKey:string;scalar:(height:number,rectangle?:C.Rectangle)=>C.Primitive}|null>(null);
  useEffect(()=>{
    if(!container.current)return;
    let v:C.Viewer|undefined;
    try{
      v=new C.Viewer(container.current,{baseLayer:false,baseLayerPicker:false,animation:false,timeline:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,skyBox:false,skyAtmosphere:new C.SkyAtmosphere(),contextOptions:{webgl:{alpha:false}},requestRenderMode:false});
      viewer.current=v;
      v.scene.globe.baseColor=C.Color.fromCssColorString('#142732');
      v.scene.backgroundColor=C.Color.fromCssColorString('#060d16');
      v.scene.globe.enableLighting=false;
      v.scene.globe.showGroundAtmosphere=true;
      v.scene.camera.setView({destination:C.Cartesian3.fromDegrees(-70,20,18000000)});
      v.resolutionScale=Math.min(window.devicePixelRatio,1.5)/window.devicePixelRatio;
      const currentViewer=v;
      void C.TileMapServiceImageryProvider.fromUrl(C.buildModuleUrl('Assets/Textures/NaturalEarthII')).then(provider=>{if(!currentViewer.isDestroyed())currentViewer.imageryLayers.addImageryProvider(provider);}).catch(error=>latest.current.onError(`Base imagery unavailable: ${String(error)}`));
      function scalar(height:number,rectangle=C.Rectangle.fromDegrees(-180,-90,180,90)){
        const empty=document.createElement('canvas');empty.width=2;empty.height=2;
        const material=new C.Material({fabric:{type:'WeatherScalar',uniforms:{image:C.Material.DefaultImageId},components:{diffuse:'texture(image, clamp(materialInput.st, 0.001, 0.999)).rgb',alpha:'texture(image, clamp(materialInput.st, 0.001, 0.999)).a'}},translucent:true});
        material.uniforms.image=empty;
        return v!.scene.primitives.add(new C.Primitive({geometryInstances:new C.GeometryInstance({geometry:new C.RectangleGeometry({rectangle,height,granularity:C.Math.toRadians(2),vertexFormat:C.EllipsoidSurfaceAppearance.VERTEX_FORMAT})}),appearance:new C.EllipsoidSurfaceAppearance({aboveGround:true,material,translucent:true,renderState:{depthTest:{enabled:true},depthMask:false,blending:C.BlendingState.ALPHA_BLEND}}),asynchronous:false}));
      }
      const material=new C.Material({fabric:{type:'WeatherPulse',uniforms:{clock:0,base:0.3,pulse:1,opacity:0.8},source:`czm_material czm_getMaterial(czm_materialInput materialInput) {
        czm_material m=czm_getDefaultMaterial(materialInput);
        float d=fract(materialInput.st.s-clock);
        float light=exp(-pow((d-0.5)*9.0,2.0));
        m.diffuse=vec3(0.83,0.98,1.0);m.emission=vec3(0.45,0.7,0.8)*light*pulse;
        m.alpha=opacity*(base+(1.0-base)*light*pulse);return m;
      }`},translucent:true});
      layers.current={temp:scalar(1200),rain:scalar(2200),wind:v.scene.primitives.add(new C.PolylineCollection()),material,scalar,gridKey:''};
      const handler=new C.ScreenSpaceEventHandler(v.scene.canvas);
      handler.setInputAction((event:{position:C.Cartesian2})=>{const pos=v!.camera.pickEllipsoid(event.position,v!.scene.globe.ellipsoid);if(pos){const cart=C.Cartographic.fromCartesian(pos);latest.current.onPick(C.Math.toDegrees(cart.longitude),C.Math.toDegrees(cart.latitude));}},C.ScreenSpaceEventType.LEFT_CLICK);
      const updateScale=()=>{const p=v!.camera.positionCartographic;const center=v!.camera.pickEllipsoid(new C.Cartesian2(v!.scene.canvas.clientWidth/2,v!.scene.canvas.clientHeight/2));const point=center?C.Cartographic.fromCartesian(center):p;latest.current.onScale(scaleAt(p.height),C.Math.toDegrees(point.longitude),C.Math.toDegrees(point.latitude));};
      const removeMove=v.camera.moveEnd.addEventListener(updateScale);
      const removeError=v.scene.renderError.addEventListener((_scene,error)=>latest.current.onError(`Rendering failure: ${String(error)}`));
      let start=performance.now(),frames=0;
      const removeTick=v.scene.preRender.addEventListener(()=>{const now=performance.now();material.uniforms.clock=now/1200*latest.current.visual.wind.animation;
        const wind=layers.current?.wind;if(wind)for(let i=0;i<wind.length;i++)wind.get(i).material.uniforms.clock=material.uniforms.clock;frames++;if(now-start>1500){latest.current.onFps(Math.round(frames*1000/(now-start)));frames=0;start=now;}});
      updateScale();
      return()=>{removeMove();removeTick();removeError();handler.destroy();material.destroy();layers.current=null;viewer.current=null;v?.destroy();};
    }catch(error){latest.current.onError(`Rendering failure: ${String(error)}`);v?.destroy();}
  },[]);
  useEffect(()=>{
    const l=layers.current;if(!l||!props.a)return;
    const grid=props.a.manifest.fields[0]?.horizontalGrid;if(!grid)return;
    const gridKey=JSON.stringify(grid);
    if(l.gridKey!==gridKey){
      const rectangle=C.Rectangle.fromDegrees(grid.west,grid.south,grid.periodic?180:grid.west+(grid.width-1)*grid.dx,grid.south+(grid.height-1)*grid.dy);
      viewer.current!.scene.primitives.remove(l.temp);viewer.current!.scene.primitives.remove(l.rain);
      l.temp=l.scalar(1200,rectangle);l.rain=l.scalar(2200,rectangle);l.gridKey=gridKey;
    }
    (l.temp.appearance as C.EllipsoidSurfaceAppearance).material.uniforms.image=scalarCanvas(props,'temperature');
    (l.rain.appearance as C.EllipsoidSurfaceAppearance).material.uniforms.image=scalarCanvas(props,'rain');
    l.temp.show=props.visual.temperature.enabled;l.rain.show=props.visual.rain.enabled;
    l.wind.removeAll();const w=props.visual.wind;l.wind.show=w.enabled;
    l.material.uniforms.base=w.brightness;l.material.uniforms.pulse=w.pulse;l.material.uniforms.opacity=w.opacity;
    if(!w.enabled)return;
    const scale=scaleAt(viewer.current?.camera.positionCartographic.height??18e6);
    const factor=scale==='planetary'?1:scale==='synoptic'?0.7:0.3;
    const field=props.a.fields.get(ids.u);if(!field)return;
    const g=field.descriptor.horizontalGrid;
    const step=(scale==='planetary'?11:scale==='synoptic'?7:2)/Math.max(0.2,w.density);
    for(let lat=Math.max(-84,g.south);lat<=Math.min(84,g.south+(g.height-1)*g.dy);lat+=step){
      for(let lon=g.west;lon<g.west+g.width*g.dx;lon+=step/Math.max(0.3,Math.cos(C.Math.toRadians(lat)))){
        const u=valueAt(props.a,props.b,ids.u,lon,lat,props.fraction),v=valueAt(props.a,props.b,ids.v,lon,lat,props.fraction);
        const points=filament(lon,lat,u,v,filamentLength(Math.hypot(u,v),w.length,factor));
        if(points.length)l.wind.add({positions:points.map(([x,y])=>C.Cartesian3.fromDegrees(x,y,12000)),width:2,material:new C.Material({fabric:{type:'WeatherPulse',uniforms:{...l.material.uniforms}},translucent:true})});
      }
    }
  },[props.a,props.b,props.fraction,props.visual]);
  const lastZoom=useRef(0);
  useEffect(()=>{const v=viewer.current;if(v&&props.zoom!==lastZoom.current){const d=props.zoom-lastZoom.current;v.camera.zoomIn(d*v.camera.positionCartographic.height*0.48);lastZoom.current=props.zoom;}},[props.zoom]);
  return <div ref={container} className="globe" aria-label="Interactive atmospheric globe" data-testid="globe"/>;
}
