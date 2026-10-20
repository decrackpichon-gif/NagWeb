// Genera un GLB propio y reproducible (sin recursos privados): un anillo (toro) con
// agujero central. Sirve para comprobar que un hueco del modelo deja ver lo que hay detrás.
// Uso: node tools/make-acceptance-glb.mjs [salida.glb]
import fs from 'node:fs';
const out=process.argv[2]||'acceptance/NagWeb-Anillo-Aceptacion.glb';
const R=1,r=.3,U=64,Vn=28;           // radio mayor, radio del tubo, segmentos
const pos=[],nor=[],idx=[];
for(let i=0;i<=U;i++){const u=i/U*Math.PI*2,cu=Math.cos(u),su=Math.sin(u);
 for(let j=0;j<=Vn;j++){const v=j/Vn*Math.PI*2,cv=Math.cos(v),sv=Math.sin(v);
  pos.push((R+r*cv)*cu,(R+r*cv)*su,r*sv);nor.push(cv*cu,cv*su,sv);}}
for(let i=0;i<U;i++)for(let j=0;j<Vn;j++){const a=i*(Vn+1)+j,b=(i+1)*(Vn+1)+j,c=b+1,d=a+1;idx.push(a,b,d,b,c,d);}
const P=new Float32Array(pos),N=new Float32Array(nor),I=new Uint16Array(idx);
const pad=n=>(4-n%4)%4;
const bin=Buffer.concat([Buffer.from(P.buffer),Buffer.from(N.buffer),Buffer.from(I.buffer),Buffer.alloc(pad(I.byteLength))]);
const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
for(let k=0;k<pos.length;k+=3)for(let a=0;a<3;a++){min[a]=Math.min(min[a],pos[k+a]);max[a]=Math.max(max[a],pos[k+a]);}
const json={asset:{version:'2.0',generator:'NagWeb Cámara 2.0 · acceptance generator'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:'Anillo',rotation:[0,0.5,0,0.8660254]}],
 meshes:[{name:'Anillo',primitives:[{attributes:{POSITION:0,NORMAL:1},indices:2,material:0}]}],
 materials:[{name:'Oro',pbrMetallicRoughness:{baseColorFactor:[1,.72,.18,1],metallicFactor:.85,roughnessFactor:.28}}],
 buffers:[{byteLength:bin.length}],
 bufferViews:[{buffer:0,byteOffset:0,byteLength:P.byteLength,target:34962},{buffer:0,byteOffset:P.byteLength,byteLength:N.byteLength,target:34962},{buffer:0,byteOffset:P.byteLength+N.byteLength,byteLength:I.byteLength,target:34963}],
 accessors:[{bufferView:0,componentType:5126,count:pos.length/3,type:'VEC3',min,max},{bufferView:1,componentType:5126,count:nor.length/3,type:'VEC3'},{bufferView:2,componentType:5123,count:idx.length,type:'SCALAR'}]};
let js=Buffer.from(JSON.stringify(json));js=Buffer.concat([js,Buffer.alloc(pad(js.length),0x20)]);
const total=12+8+js.length+8+bin.length,h=Buffer.alloc(12);h.writeUInt32LE(0x46546C67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(total,8);
const c1=Buffer.alloc(8);c1.writeUInt32LE(js.length,0);c1.writeUInt32LE(0x4E4F534A,4);
const c2=Buffer.alloc(8);c2.writeUInt32LE(bin.length,0);c2.writeUInt32LE(0x004E4942,4);
fs.mkdirSync(out.replace(/[^/\\]*$/,'')||'.',{recursive:true});
fs.writeFileSync(out,Buffer.concat([h,c1,js,c2,bin]));
console.log('GLB escrito:',out,total,'bytes · triángulos:',idx.length/3);
