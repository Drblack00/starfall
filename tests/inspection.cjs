// Actual pointer, keyboard and two-finger input on the shared live 3D ship surface.
module.exports=async function verifyInspection(browser){
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765/index.html');await page.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
 await page.locator('#scr-start [data-nav="hangar"]').click();await page.locator('#inspector-viewport').scrollIntoViewIfNeeded();await page.waitForTimeout(350);
 const box=await page.locator('#inspector-viewport').boundingBox();
 await page.evaluate(()=>window.inspectionSurface=document.getElementById('ship-preview3d'));
 await page.mouse.move(box.x+box.width*.4,box.y+box.height*.4);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.65,{steps:12});await page.mouse.up();await page.waitForTimeout(350);
 await page.evaluate(()=>{if(Math.abs(INSPECT.yaw)<.3||Math.abs(INSPECT.pitch-.3)<.2)throw Error('Drag did not rotate and tilt the selected ship');const b=SF3D.preview.batches['ship:'+LOADOUT.ship];if(Math.abs(b.records[1])<.1||Math.abs(b.records[6])<.1)throw Error('Inspector state was not applied to the real 3D matrix');});
 await page.locator('#inspect-pan').click();await page.mouse.move(box.x+box.width*.4,box.y+box.height*.4);await page.mouse.down();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5,{steps:8});await page.mouse.up();await page.waitForTimeout(350);
 await page.evaluate(()=>{if(Math.abs(INSPECT.panX)<5||Math.abs(INSPECT.panY)<5||Math.abs(SF3D.preview.offsetX-INSPECT.panX)>.001)throw Error('Pan did not move the 3D view');});
 await page.locator('#inspect-zoom-in').click();await page.waitForTimeout(350);await page.evaluate(()=>{if(INSPECT.zoom<1.1||Math.abs(SF3D.preview.zoom-INSPECT.zoom)>.001)throw Error('Zoom is not applied to the projection')});
 await page.locator('#inspect-reset').click();await page.waitForFunction(()=>Math.abs(INSPECT.yaw)<.01&&Math.abs(INSPECT.pitch-.3)<.01&&Math.abs(INSPECT.panX)<.01&&Math.abs(INSPECT.zoom-1)<.01,{timeout:2000});
 await page.locator('#inspector-viewport').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowDown');await page.keyboard.press('Alt+ArrowLeft');await page.keyboard.press('+');await page.waitForTimeout(350);await page.evaluate(()=>{if(INSPECT.yaw<=0||INSPECT.pitch<=.3||INSPECT.panX>=0||INSPECT.zoom<=1)throw Error('Keyboard inspection controls failed')});
 await page.keyboard.press('0');await page.locator('#inspect-rotate').click();await page.waitForTimeout(350);
 const cdp=await page.context().newCDPSession(page),x=box.x+box.width/2,y=box.y+box.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-35,y,id:1},{x:x+35,y,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-55+12,y:y+14,id:1},{x:x+55+12,y:y+14,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
 await page.evaluate(()=>{if(INSPECT.zoom<1.3||Math.abs(INSPECT.panY)<5)throw Error('Two-finger pan/pinch failed')});
 await page.locator('.opt-card[data-group="ship"][data-value="aegis"]').click();await page.waitForTimeout(350);await page.evaluate(()=>{const b=SF3D.preview.batches['ship:aegis'];if(b.source.hull!==SF3D.getGeometry('ship:aegis')||document.getElementById('ship-preview3d')!==window.inspectionSurface)throw Error('Ship selection replaced the shared renderer or actual model')});
 await page.locator('#scr-loadout .menu-head [data-nav="arsenal"]').click();await page.waitForTimeout(350);await page.evaluate(()=>{if(document.getElementById('scr-loadout').dataset.sec!=='arsenal')throw Error('Inspecting a ship blocks equipment selection')});
 await page.keyboard.press('Escape');await page.waitForTimeout(250);await page.evaluate(()=>{if(document.getElementById('scr-loadout').dataset.sec!=='hangar')throw Error('Equipment back route lost ship inspection context')});if(errors.length)throw Error(errors.join('\n'));await page.close();
 console.log('Inspection: real mesh rotation/tilt/pan/zoom, eased reset, keyboard, pinch, ship selection and equipment navigation passed');
};
