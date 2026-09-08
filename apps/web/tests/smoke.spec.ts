import {test,expect} from '@playwright/test';

// Deterministic transport double: production always requests NOAA; tests avoid external downloads.
test.beforeEach(async({page})=>{
 await page.route('**/api/runs?source=gfs',async route=>{
   const response=await route.fetch({url:route.request().url().replace('source=gfs','source=fixture')});
   const data=await response.json(),run=data.runs[0];
   const times=[0,3,9,24].map(h=>new Date(Date.parse(run.initializedAt)+h*3600000).toISOString());
   await route.fulfill({json:{runs:[{...run,availableValidTimes:times},{...run,runId:'short-run',availableValidTimes:times.slice(1,2)}]}});
 });
 await page.route('**/api/frame?**',async route=>{
   const url=new URL(route.request().url());
   expect(url.searchParams.get('source')).toBe('gfs');
   expect([0,3,9,24]).toContain(Number(url.searchParams.get('lead')));
   url.searchParams.set('source','fixture');url.searchParams.set('run','fixture');
   const response=await route.fetch({url:url.toString()});await route.fulfill({response});
 });
});

test('NOAA interface with test fields: globe, mappings, time, inspection and LOD',async({page})=>{
 test.setTimeout(150000); // Software-WebGL screenshots are slow on CI runners.
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.getByTestId('temperature-value')).not.toHaveText('Loading…',{timeout:30000});
 await expect(page.getByTestId('globe').locator('canvas')).toBeVisible();
 await expect(page.getByText(/Rendering failure/)).toHaveCount(0);
 await expect.poll(()=>page.locator('.performance').innerText()).toMatch(/[1-9][0-9]* FPS/);
 let dataRequests=0;page.on('request',r=>{if(r.url().includes('/api/'))dataRequests++;});
 await page.getByLabel('Wind visible',{exact:true}).uncheck();
 await page.getByLabel('Precipitation visible',{exact:true}).uncheck();
 const globeCanvas=page.getByTestId('globe').locator('canvas');
 const bounds=(await globeCanvas.boundingBox())!;
 const clip={x:bounds.x+bounds.width*0.35,y:bounds.y+bounds.height*0.35,width:bounds.width*0.3,height:bounds.height*0.3};
 const thermalImage=await page.screenshot({clip,path:'test-results/thermal.png'});
 await page.getByLabel('Temperature palette').selectOption('icefire');
 const icefireImage=await page.screenshot({clip,path:'test-results/icefire.png'});
 expect(icefireImage.equals(thermalImage)).toBe(false);
 await page.getByLabel('Precipitation visible',{exact:true}).uncheck();
 await page.getByLabel('Precipitation visible',{exact:true}).check();
 await page.getByLabel('Wind visible',{exact:true}).uncheck();
 await page.getByLabel('Wind visible',{exact:true}).check();
 expect(dataRequests).toBe(0);
 // Freeze decorative motion: any pixel change must now come from forecast time.
 await page.getByLabel('Wind visible',{exact:true}).uncheck();
 await page.getByLabel('Precipitation visible',{exact:true}).uncheck();
 const initialValue=await page.getByTestId('temperature-value').innerText();
 await page.getByLabel('Forecast time',{exact:true}).fill('2');
 await expect(page.getByTestId('temperature-value')).not.toHaveText('Loading…');
 await expect(page.getByTestId('temperature-value')).not.toHaveText(initialValue);
 const laterImage=await page.screenshot({clip,path:'test-results/later-time.png'});
 expect(laterImage.equals(icefireImage)).toBe(false);
 await page.getByLabel('Forecast time',{exact:true}).fill('0');
 await expect(page.getByRole('button',{name:'Play',exact:true})).toBeEnabled();

 await page.getByRole('button',{name:'Play',exact:true}).click();
 await expect.poll(async()=>Number(await page.getByLabel('Forecast time',{exact:true}).inputValue())).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByLabel('Forecast time',{exact:true}).fill('1');
 await expect(page.getByTestId('time-state')).toHaveText('Model timestep');
 await expect(page.getByTestId('temperature-value')).not.toHaveText('Loading…');
 const before=await page.locator('.coordinates').innerText();
 await page.getByTestId('globe').locator('canvas').click();
 await expect(page.locator('.coordinates')).not.toHaveText(before);
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 await expect(page.locator('.header-right')).toContainText('LOD 1');
 await expect(page.getByTestId('temperature-value')).not.toHaveText('Loading…');
 await page.getByText('Source / details',{exact:true}).click();
 await expect(page.getByText(/Analytic fixture sampled/).first()).toBeVisible();
 await page.screenshot({path:'test-results/laboratory.png',fullPage:true});
 await expect(page.getByText(/Rendering failure/)).toHaveCount(0);
 expect(errors).toEqual([]);
});

test('NOAA outage offers retry without synthetic fallback',async({page})=>{
 let fail=true;
 await page.route('**/api/runs?source=gfs',async route=>{
   if(fail)await route.fulfill({status:503,json:{detail:'NOAA test outage'}});
   else await route.fallback();
 });
 await page.goto('/');
 await expect(page.getByText('NOAA test outage')).toBeVisible();
 await expect(page.getByRole('button',{name:'Use synthetic fixtures'})).toHaveCount(0);
 await expect(page.getByLabel('Forecast time',{exact:true})).toBeDisabled();
 fail=false;await page.getByRole('button',{name:'Retry source'}).click();
 await expect(page.getByTestId('temperature-value')).not.toHaveText('Loading…');
});

test('timeline can pause while buffering, drag during play, and loop',async({page})=>{
 await page.goto('/');
 const timeline=page.getByLabel('Forecast time',{exact:true});
 const play=page.getByRole('button',{name:'Play',exact:true});
 await expect(play).toBeEnabled();
 await play.click();
 await expect.poll(async()=>Number(await page.getByLabel('Forecast time',{exact:true}).inputValue())).toBeGreaterThan(0);
 // Grab the actual thumb while the timer is advancing, then drag it.
 const box=(await timeline.boundingBox())!;
 const hour=Number(await timeline.inputValue());
 await page.mouse.move(box.x+8+(box.width-16)*hour/3,box.y+box.height/2);
 await page.mouse.down();
 await page.mouse.move(box.x+box.width*0.5,box.y+box.height/2,{steps:8});
 await page.mouse.up();
 await expect(play).toBeVisible();
 await expect.poll(async()=>Number(await timeline.inputValue())).toBeGreaterThan(0);
 await expect.poll(async()=>Number(await timeline.inputValue())).toBeLessThan(3);
 // Park immediately before the final boundary and verify automatic wrap.
 await timeline.fill('3');
 await expect(play).toBeEnabled();
 await play.click();
 await expect.poll(async()=>Number(await timeline.inputValue())).toBeLessThan(3);
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 // Reload so the bounded cache cannot hide the blocked network transition.
 await page.reload();
 await expect(play).toBeEnabled();
 let release!:()=>void;
 const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/frame?**',async route=>{await gate;await route.fallback();});
 await page.getByLabel('Playback speed').selectOption('4');
 await play.click();
 await expect(page.getByText('Loading fields…',{exact:true})).toBeVisible({timeout:15000});
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 const stopped=await timeline.inputValue();
 release();
 await expect(play).toBeEnabled();
 expect(await timeline.inputValue()).toBe(stopped);
});


test('timeline follows uneven run times and resets for a single-frame run',async({page})=>{
 await page.goto('/');
 const timeline=page.getByLabel('Forecast time',{exact:true});
 await expect(page.getByRole('button',{name:'Play',exact:true})).toBeEnabled();
 await expect(page.getByLabel('Data source',{exact:true})).toHaveValue('gfs');
 await expect(page.getByLabel('Fixture',{exact:true})).toHaveCount(0);
 await expect(timeline).toHaveAttribute('max','3');
 await expect(timeline).toHaveAttribute('step','1');
 await expect(page.locator('.ticks span')).toHaveText(['+0h','+3h','+9h','+24h']);
 await page.getByRole('button',{name:'Next model frame'}).click();
 await page.getByRole('button',{name:'Next model frame'}).click();
 await expect(timeline).toHaveValue('2');
 await expect(timeline).toHaveAttribute('aria-valuetext',/\+9 hours/);
 await expect(page.getByTestId('temperature-value')).not.toHaveText('Loading…');
 await page.getByRole('button',{name:'Previous model frame'}).click();
 await expect(timeline).toHaveValue('1');
 await page.getByLabel('Model run',{exact:true}).selectOption('short-run');
 await expect(timeline).toHaveValue('0');
 await expect(timeline).toBeDisabled();
 await expect(page.locator('.ticks span')).toHaveText(['+3h']);
 await expect(page.getByRole('button',{name:'Play',exact:true})).toBeDisabled();
 await expect(page.getByTestId('temperature-value')).not.toHaveText('Loading…');
});
