import {test,expect} from '@playwright/test';

test('fixture laboratory: globe, mappings, time, inspection and LOD',async({page})=>{
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
 const thermalImage=await globeCanvas.screenshot({path:'test-results/thermal.png'});
 await page.getByLabel('Temperature palette').selectOption('icefire');
 const icefireImage=await globeCanvas.screenshot({path:'test-results/icefire.png'});
 expect(icefireImage.equals(thermalImage)).toBe(false);
 await page.getByLabel('Precipitation visible',{exact:true}).uncheck();
 await page.getByLabel('Precipitation visible',{exact:true}).check();
 await page.getByLabel('Wind visible',{exact:true}).uncheck();
 await page.getByLabel('Wind visible',{exact:true}).check();
 expect(dataRequests).toBe(0);
 await page.getByRole('button',{name:'Play',exact:true}).click();
 await expect(page.getByTestId('time-state')).toHaveText('Visual interpolation');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByLabel('Forecast time',{exact:true}).fill('6');
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

test('source outage offers synthetic fallback',async({page})=>{
 await page.route('**/api/runs?source=gfs',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'NOAA test outage'})}));
 await page.goto('/');
 await expect(page.getByTestId('temperature-value')).not.toHaveText('Loading…');
 await page.getByLabel('Data source',{exact:true}).selectOption('gfs');
 await expect(page.getByText('NOAA test outage')).toBeVisible();
 await page.getByRole('button',{name:'Use synthetic fixtures'}).click();
 await expect(page.getByTestId('temperature-value')).not.toHaveText('Loading…');
});
