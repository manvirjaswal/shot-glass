import*as THREE from"three";const N=384;const VS=`attribute vec3 iPos, iVel; attribute vec4 iA, iB, iCol; uniform float uTime;
  varying vec2 vUv; varying vec4 vCol; varying float vK, vShape;
  void main() {
    float age = uTime - iA.x, life = iA.y;
    if (age < 0.0 || age > life) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    float k = age / life, drag = iA.w, g = iB.x;
    float moved = drag > 0.001 ? (1.0 - exp(-drag * age)) / drag : age;
    vec3 p = iPos + iVel * moved + vec3(0.0, -0.5 * g * age * age, 0.0);
    vec3 vel = iVel * exp(-drag * age) + vec3(0.0, -g * age, 0.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec3 vv = mat3(modelViewMatrix) * vel;
    vec2 d = length(vv.xy) > 1e-5 ? normalize(vv.xy) : vec2(1.0, 0.0);
    float size = iA.z * (1.0 + iB.z * k), len = size + length(vv.xy) * iB.y;
    mv.xy += d * position.x * len + vec2(-d.y, d.x) * position.y * size;
    gl_Position = projectionMatrix * mv;
    vUv = position.xy * 2.0; vCol = iCol; vK = k; vShape = iB.w;
  }`;const FS=`varying vec2 vUv; varying vec4 vCol; varying float vK, vShape;
  void main() {
    vec2 uv = vUv; float r2 = dot(uv, uv), a;
    if (vShape < 0.5) a = (exp(-r2 * 4.0) + 0.3 * exp(-r2 * 1.2)) * (1.0 - smoothstep(0.55, 1.0, sqrt(r2)));
    else a = exp(-uv.x * uv.x * 1.6) * (1.0 - smoothstep(0.2, 1.0, abs(uv.y)));
    a *= smoothstep(0.0, 0.05, vK) * (1.0 - smoothstep(0.4, 1.0, vK)) * vCol.a;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vCol.rgb * a, 1.0);
    #include <colorspace_fragment>
  }`;export function createLight(){const U={uTime:{value:0}};const geo=new THREE.InstancedBufferGeometry;geo.copy(new THREE.PlaneGeometry(1,1));geo.instanceCount=N;const attr=(k,size)=>{const a=new THREE.InstancedBufferAttribute(new Float32Array(N*size),size);a.setUsage(THREE.DynamicDrawUsage);geo.setAttribute(k,a);return a};const A={iPos:attr("iPos",3),iVel:attr("iVel",3),iA:attr("iA",4),iB:attr("iB",4),iCol:attr("iCol",4)};for(let i=0;i<N;i++)A.iA.setXYZW(i,-99,.001,0,0);const mat=new THREE.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;mesh.renderOrder=16;let next=0,dirty=false;const tmp=new THREE.Vector3,tc=new THREE.Color,WHITE=new THREE.Color("#ffffff");function emit(shape,at,vel,col,o){const i=next;next=(next+1)%N;const b=o.bright??1;A.iPos.setXYZ(i,at.x,at.y,at.z);A.iVel.setXYZ(i,vel.x,vel.y,vel.z);A.iA.setXYZW(i,U.uTime.value,o.life,o.size,o.drag??3.5);A.iB.setXYZW(i,o.gravity??0,o.stretch??0,o.grow??0,shape);A.iCol.setXYZW(i,col.r*b,col.g*b,col.b*b,1);dirty=true}const scatter=(dir,spread,out)=>{out.randomDirection();if(!dir)return out;return out.multiplyScalar(spread).addScaledVector(dir,1-spread*.5).normalize()};const zero=new THREE.Vector3;const api={mesh,flash(at,col,size,life=.1,bright=1.6){emit(0,at,zero,col,{life,size,drag:0,grow:.6,bright})},glints(at,dir,col,n,{speed=6,spread=.7,life=.3,size=.02,gravity=4,stretch=.05,bright=2.2}={}){for(let k=0;k<n;k++)emit(1,at,scatter(dir,spread,tmp).multiplyScalar(speed*(.35+Math.random()*.9)),col,{life:life*(.6+.6*Math.random()),size,gravity,stretch,bright})},fx(kind,a){if(kind==="hit"){api.flash(a.at,tc.copy(a.col),a.R*1.4*a.big,.08,1.1);api.glints(a.at,a.dir,tc.copy(a.col).lerp(WHITE,.2),Math.round(12*a.big),{speed:6*a.big,life:.28,size:.018});return true}if(kind==="shot"){api.flash(a.at,tc.copy(a.col).lerp(WHITE,.5),.1*a.gk,.07,1.8);api.glints(a.at,a.dir,tc.copy(a.col).lerp(WHITE,.6),3,{speed:2*a.gk,life:.1,size:.0035*a.gk,stretch:.03,gravity:0,spread:.3});return true}if(kind==="sparks"){api.glints(a.at,a.dir,tc.copy(a.col).lerp(WHITE,.4),a.n,{speed:a.speed*1.6,life:.35,size:.02,gravity:3});return true}return false},update(dt){U.uTime.value+=dt;if(dirty){for(const k in A)A[k].needsUpdate=true;dirty=false}},dispose(){geo.dispose();mat.dispose()}};return api}
