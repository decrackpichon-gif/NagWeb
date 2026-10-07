import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const S=require('../js/nagweb-scene-composer-v1.js');

assert.equal(S.version,'1.0.0-alpha.1');
assert.equal(S.schema,'nagweb-scene-composer');

let scene=S.createScene({stage:{width:1000,height:700},character:{size:420,preset:'character'}});
assert.equal(scene.stage.width,1000);
assert.equal(scene.character.size,420);
assert.equal(scene.elements.length,0);

scene=S.addElement(scene,'text',{x:100,y:120,content:'Hola'});
scene=S.addElement(scene,'button',{x:340,y:260,content:'Entrar'});
scene=S.addElement(scene,'shape',{x:600,y:380});
scene=S.addElement(scene,'background',{style:{background:'#123456'}});
assert.equal(scene.elements.length,4);
assert.equal(new Set(scene.elements.map(e=>e.id)).size,4);

const text=scene.elements.find(e=>e.type==='text');
assert.equal(text.content,'Hola');
assert.equal(text.interaction.enabled,true);
assert.equal(text.interaction.radiusScale,1);

scene=S.updateElement(scene,text.id,{
  content:'Texto editado',
  width:420,
  rotation:18,
  style:{color:'#ffcc00',fontSize:64},
  interaction:{weight:1.4,radiusScale:1.8,move:.9,rotate:.15,scale:.05,returnSpeed:1.5}
});
const edited=scene.elements.find(e=>e.id===text.id);
assert.equal(edited.content,'Texto editado');
assert.equal(edited.width,420);
assert.equal(edited.rotation,18);
assert.equal(edited.style.color,'#ffcc00');
assert.equal(edited.style.fontSize,64);
assert.equal(edited.interaction.weight,1.4);
assert.equal(edited.interaction.radiusScale,1.8);
assert.equal(edited.interaction.returnSpeed,1.5);

const attrs=S.interactionAttributes(edited);
assert.equal(attrs['data-nw-target-id'],edited.id);
assert.equal(attrs['data-nw-influence-radius'],'1.8');
assert.equal(attrs['data-nw-influence-move'],'0.9');

const beforeIds=new Set(scene.elements.map(e=>e.id));
scene=S.duplicateElement(scene,edited.id);
assert.equal(scene.elements.length,5);
const duplicate=scene.elements.find(e=>!beforeIds.has(e.id));
assert.ok(duplicate);
assert.equal(duplicate.content,'Texto editado');
assert.equal(duplicate.x,edited.x+24);
assert.equal(duplicate.y,edited.y+24);

scene=S.removeElement(scene,duplicate.id);
assert.equal(scene.elements.length,4);
assert.ok(!scene.elements.some(e=>e.id===duplicate.id));

scene=S.setCharacter(scene,{preset:'creature',size:500,influenceRadius:240,influenceStrength:1.3});
assert.equal(scene.character.preset,'creature');
assert.equal(scene.character.size,500);
assert.equal(scene.character.influenceRadius,240);

scene=S.setStage(scene,{width:1440,height:900,background:'#09090d'});
assert.equal(scene.stage.width,1440);
assert.equal(scene.stage.height,900);
const bg=scene.elements.find(e=>e.type==='background');
assert.equal(bg.width,1440);
assert.equal(bg.height,900);
assert.equal(bg.x,0);
assert.equal(bg.y,0);
assert.equal(bg.interaction.enabled,false);

const json=S.serialize(scene);
const round=S.deserialize(json);
assert.deepEqual(round,scene);

assert.equal(S.normalizeInteraction({radiusScale:99}).radiusScale,3);
assert.equal(S.normalizeInteraction({radiusScale:0}).radiusScale,.25);
assert.equal(S.normalizeInteraction({returnSpeed:99}).returnSpeed,2);
assert.equal(S.normalizeInteraction({returnSpeed:0}).returnSpeed,.25);
assert.equal(S.normalizeInteraction({move:99,rotate:-2,scale:4}).move,2);
assert.equal(S.normalizeInteraction({move:99,rotate:-2,scale:4}).rotate,0);
assert.equal(S.normalizeInteraction({move:99,rotate:-2,scale:4}).scale,2);

assert.throws(()=>S.deserialize('{"schema":"other","version":1}'),/invalid scene document/i);

console.log('NagWeb Scene Composer V1 model tests: PASS');
