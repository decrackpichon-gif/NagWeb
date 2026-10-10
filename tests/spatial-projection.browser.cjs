'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const vendor=process.env.NAGWEB_TEST_VENDOR_DIR,three=fs.readFileSync(vendor?path.join(vendor,'three.cjs'):require.resolve('three/build/three.js'),'utf8');
  // Real CSS layout and GPU points are independent references. This fixture
  // isolates the exported camera factory, with no Director/progress simulation.
  const source=fs.readFileSync('js/nagweb-scroll-camera.js','utf8'),factory=source.slice(0,source.indexOf('window.NAGWEB_CREATE_SCROLL_CAMERA='))+'window.cameraAPI=createCamera();})();';
  await page.setContent('<style>body{margin:0}.stage{position:absolute;left:80px;top:70px;width:800px;height:600px}.inner{position:absolute;inset:0;transform-style:preserve-3d}.point{position:absolute;width:0;height:0;transform-style:preserve-3d}canvas{position:absolute;inset:0;pointer-events:none}</style><div class="stage"><div class="inner"></div></div>');
  await page.addScriptTag({content:three});await page.addScriptTag({content:factory});
  await page.evaluate(()=>{
   const stage=document.querySelector('.stage'),world=stage.firstElementChild,C=window.cameraAPI,renderer=new THREE.WebGLRenderer({alpha:true}),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();stage.appendChild(renderer.domElement);
   const paint=C.attach(stage,{containers:[]},950),unbind=C.bindThreeCamera(stage,camera),points=[[.40,.35,0],[.58,.42,100],[.48,.66,-120]].map(p=>{
    const node=document.createElement('div');node.className='point';world.appendChild(node);const mesh=new THREE.Mesh(new THREE.SphereGeometry(3,12,8),new THREE.MeshBasicMaterial({color:0xffffff}));scene.add(mesh);return{node,mesh,p};
   });
   window.fixture={stage,world,C,renderer,scene,camera,paint,unbind,points};
  });
  const neutral={x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0};
  const cases=[
   {name:'neutral',pose:neutral},
   {name:'translation/depth',pose:{...neutral,x:50,y:-30,z:100}},
   {name:'roll only',pose:{...neutral,rotate:37}},
   {name:'pitch',pose:{...neutral,rotateX:8}},
   {name:'yaw',pose:{...neutral,rotateY:-12}},
   {name:'combined rotations',pose:{...neutral,x:35,y:15,z:-40,rotateX:8,rotateY:-12,rotate:24}},
   {name:'lookAt point',focus:true,pose:{...neutral,x:35,y:15,z:65,rotate:16}},
   {name:'offset inner',offset:true,pose:{...neutral,x:-20,y:10,z:65,rotateX:-7,rotateY:10,rotate:-18}},
   {name:'responsive',width:500,height:650,factor:.5,offset:true,pose:{...neutral,x:70,y:-30,z:100,rotateX:5,rotateY:-8,rotate:14}},
   {name:'resize same pose',width:700,height:500,factor:.7,pose:{...neutral,x:70,y:-30,z:100,rotateX:5,rotateY:-8,rotate:14}},
   {name:'neutral reset',pose:neutral}
  ];
  let comparisons=0,maxError=0;
  for(const test of cases){
   const rows=await page.evaluate(t=>{
    const f=window.fixture,{stage,world,C,renderer,camera,paint}=f,width=t.width||800,height=t.height||600,factor=t.factor||1,depth=950*factor;
    stage.style.width=width+'px';stage.style.height=height+'px';world.style.left=t.offset?'25px':'0px';world.style.top=t.offset?'35px':'0px';world.style.right=t.offset?'45px':'0px';world.style.bottom=t.offset?'55px':'0px';
    renderer.setSize(width,height);for(const {node,mesh,p} of f.points){const x=p[0]*width,y=p[1]*height,z=p[2]*factor;node.style.left=x-world.offsetLeft+'px';node.style.top=y-world.offsetTop+'px';node.style.transform='translateZ('+z+'px)';mesh.position.set(x-width/2,height/2-y,-depth+z);}
    const pose={...t.pose};if(t.focus){const p=f.points[1].p;Object.assign(pose,C.lookAngles(pose,{x:(p[0]-.5)*width,y:(p[1]-.5)*height,z:950-p[2]}));}
    paint(C.scalePose(pose,factor),factor);renderer.render(f.scene,camera);const rect=stage.getBoundingClientRect(),gl=renderer.getContext();
    return f.points.map(({node,mesh})=>{const r=node.getBoundingClientRect(),p=mesh.position.clone().project(camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2,pixel=new Uint8Array(4);gl.readPixels(Math.floor(x),Math.floor(height-y-1),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return{dom:[r.left,r.top],three:[rect.left+x,rect.top+y],pixel:pixel[3],inView:x>=0&&x<width&&y>=0&&y<height&&p.z>=-1&&p.z<=1};});
   },test);
   for(const row of rows){for(let axis=0;axis<2;axis++){const error=Math.abs(row.dom[axis]-row.three[axis]);maxError=Math.max(maxError,error);assert.ok(error<.05,test.name+' projection differs by '+error+'px');comparisons++;}assert.ok(row.inView,test.name+' fixture must remain inside the visible camera');assert.ok(row.pixel>0,test.name+' projected point must contain a real WebGL pixel');}
   if(test.focus){assert.ok(Math.abs(rows[1].three[0]-480)<.001);assert.ok(Math.abs(rows[1].three[1]-370)<.001,'The focused point must be at the actual camera centre');}
   console.log('PASS projection '+test.name+': CSS centres, Three projection and GPU pixels');
  }
  await page.evaluate(()=>{const f=window.fixture;f.unbind();f.renderer.dispose();for(const {mesh} of f.points){mesh.geometry.dispose();mesh.material.dispose();}});
  assert.deepEqual(errors,[]);console.log('PASS '+comparisons+' independent CSS/Three coordinate comparisons; maximum error '+maxError.toFixed(6)+'px');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
