import*as THREE from"three";import{GLSL3}from"./v3/look3.js";import{CLOUDS}from"./v17/clouds17.js";import{WATER_SKY}from"./v16/water16.js";import{AURORA_SKY,EQ_HEAD,SKY_H}from"./v17/aurora17.js";const M=2,TOP=.033*M;function soup(){const P=[],N=[],e1=new THREE.Vector3,e2=new THREE.Vector3,n=new THREE.Vector3;const put=(p,q)=>{P.push(p.x,p.y,p.z);N.push(q.x,q.y,q.z)};return{tri(a,b,c,out){e1.subVectors(b,a);e2.subVectors(c,a);n.crossVectors(e1,e2).normalize();if(n.dot(out)<0){n.negate();[b,c]=[c,b]}put(a,n);put(b,n);put(c,n)},quad(a,b,c,d,out){this.tri(a,b,c,out);this.tri(a,c,d,out)},geo(){const g=new THREE.BufferGeometry;g.setAttribute("position",new THREE.Float32BufferAttribute(P,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(N,3));g.computeBoundingSphere();return g}}}const ring=(r,y,n,off=0)=>Array.from({length:n},(_,i)=>{const a=(i+off)/n*Math.PI*2;return new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a))});const CR=1*M;function crystalGeo(){const S=soup(),up=new THREE.Vector3(0,1,0),yG=.004*M;const rT=.84*CR,rA=.93*CR,rm=rA*Math.cos(Math.PI/16),yA=TOP+(yG-TOP)*(rm-rT)/(CR-rT);const T=ring(rT,TOP,16),A=ring(rA,yA,16,.5),G=ring(CR,yG,32),G0=ring(CR,0,32),O=new THREE.Vector3(0,TOP,0);const out=p=>new THREE.Vector3(p.x,0,p.z).normalize().multiplyScalar(.6).add(up);for(let i=0;i<16;i++){const j=(i+1)%16;S.tri(O,T[i],T[j],up);S.tri(T[i],T[j],A[i],out(A[i]));S.quad(A[i],T[j],A[j],G[2*i+2&31],out(T[j]));S.tri(A[i],G[2*i+1],G[2*i+2&31],out(G[2*i+1]));S.tri(A[j],G[2*i+2&31],G[2*i+3&31],out(G[2*i+3&31]))}for(let i=0;i<32;i++){const j=(i+1)%32,mid=G[i].clone().add(G[j]).setY(0);S.quad(G[i],G[j],G0[j],G0[i],mid)}return S.geo()}const CORE=CR-.03*M;const VS=`varying vec3 vP, vN, vL;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vL = position;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;const FS=`varying vec3 vP, vN, vL; ${GLSL3} ${CLOUDS} ${WATER_SKY} ${EQ_HEAD} ${AURORA_SKY}
  vec3 skyLite(vec3 d) {
    float az = atan(d.x, -d.z), v = clamp(asin(clamp(d.y, -1.0, 1.0)) / 1.5707963, 0.0, 1.0);
    if (skyOn < 0.5) return a1pal(0.4) * (0.04 + 0.1 * aLit) * (1.0 - v);
    vec4 F = texture2D(skyF, vec2(az / 6.2831853 + 0.5, v));
    return texture2D(skyA, vec2(az / 6.2831853 + 0.5, (0.5 + v * ${SKY_H-1}.0) / ${SKY_H}.0)).rgb * (1.0 - 0.5 * min(F.a, 1.0)) + F.rgb; }
  void main() {
    vec3 P = vP, N = normalize(vN), C = cameraPosition;
    #ifdef MIRROR
      P.y = -P.y; N.y = -N.y; C.y = -C.y;
    #endif
    vec3 V = normalize(C - P), R = reflect(-V, N);
    float fv = 1.0 - max(dot(N, V), 0.0), f5 = fv * fv * fv * fv * fv, edge = clamp(length(fwidth(N)) * 3.0 - 0.15, 0.0, 1.0);
    vec3 c;
    vec3 rr = refract(-V, N, 0.66);
    float dn = max(-rr.y, 0.2), dd = (vL.y + ${(.17*M).toFixed(3)}) / dn;
    vec2 pb = vL.xz + rr.xz * dd, p2 = pb + rr.xz * ${(.17*M+TOP).toFixed(3)} / dn;
    float rb = length(pb) / ${CR.toFixed(3)}, rt = length(p2) / ${CR.toFixed(3)};
    vec3 smoke = exp(-vec3(1.3, 1.1, 0.9) * dd * length(rr) * 2.4);
    float ri = rb < 0.3 ? 0.0 : rb < 0.55 ? 1.0 : rb < 0.78 ? 2.0 : 3.0, nf = ri < 0.5 ? 16.0 : ri < 1.5 ? 32.0 : 48.0;
    float pa = (atan(pb.y, pb.x) / 6.2831853 + 0.5) * nf + 0.5 * mod(ri, 2.0), pi = floor(pa) + ri * 64.0, ph = fract(sin(pi * 91.7 + 3.1) * 43758.5453);
    float th = (floor(pa) + 0.5) / nf * 6.2831853 + (ph - 0.5) * 1.2;
    vec3 r2 = reflect(rr, normalize(vec3(cos(th) * 0.62, 0.78, sin(th) * 0.62)));
    float pw = 0.5 + 0.5 * sin(pi * 2.39996 + dot(rr, vec3(9.0, 7.0, 3.0)) * 1.2); pw *= pw * pw;
    float seam = max(1.0 - smoothstep(0.0, 0.06, min(fract(pa), 1.0 - fract(pa))), 1.0 - smoothstep(0.0, 0.01, min(min(abs(rb - 0.3), abs(rb - 0.55)), abs(rb - 0.78))));
    vec3 pav = skyLite(normalize(vec3(r2.x, 0.12 + 0.35 * abs(r2.y), r2.z))) * (0.04 + 0.45 * pw) * (1.0 - 0.35 * seam) * (0.2 + 0.8 * smoothstep(0.15, 0.65, rb));
    vec3 carried = skyLite(normalize(vec3(pb.x, 0.35 * length(pb) + 1e-3, pb.y))) * smoothstep(0.55, 1.0, rb) * 0.3;
    float fa = (atan(p2.y, p2.x) / 6.2831853 + 0.5) * 32.0, sp = 0.5 + 0.5 * sin(floor(fa) * 2.39996 + dot(rr, vec3(9.0, 7.0, 3.0)) * 1.2);
    float band = smoothstep(0.83, 0.87, rt) * (1.0 - smoothstep(0.96, 1.0, rt)) * (0.35 + 0.65 * smoothstep(0.0, 0.12, min(fract(fa), 1.0 - fract(fa))));
    vec3 echo = skyLite(normalize(vec3(p2.x, 0.3 * length(p2) + 1e-3, p2.y))) * band * (0.08 + 1.3 * sp * sp * sp);
    c = (vec3(0.006, 0.008, 0.012) + pav + carried + echo) * smoke;
    float fh = fract(sin(dot(N, vec3(127.1, 311.7, 74.7))) * 43758.5453), sc = 0.5 + 0.5 * sin(fh * 40.0 + dot(V, vec3(9.0, 7.0, 3.0)) * 1.5);
    c += skyLite(normalize(vec3(N.x, 0.25, N.z) + 1e-4)) * (1.0 - step(0.999, N.y)) * (0.2 + 1.1 * sc * sc * sc) * 1.25;
    float fr = 0.04 + 0.96 * f5;
    c = c * (1.0 - fr) + auroraSky(R, 0.0) * fr + (skyLite(normalize(vec3(R.x, 0.08 + 0.3 * abs(R.y), R.z))) * 3.4 + vec3(0.07, 0.08, 0.1)) * edge;
    #ifdef MIRROR
      float g = 1.0 - abs(normalize(cameraPosition - vP).y);
      gl_FragColor = vec4(c, 0.7 + 0.3 * g * g * g);
    #else
      gl_FragColor = vec4(c, 1.0);
    #endif
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;export function createPlatform(group,FU){const geo=crystalGeo();const mat=mirror=>new THREE.ShaderMaterial({uniforms:FU,vertexShader:VS,fragmentShader:FS,defines:mirror?{MIRROR:1}:{},transparent:mirror,depthWrite:true});const real=new THREE.Mesh(geo,mat(false)),copy=new THREE.Mesh(geo,mat(true));copy.scale.y=-1;copy.renderOrder=0;const root=new THREE.Group;root.add(real,copy);group.add(root);return{core:CORE,dispose(){geo.dispose();real.material.dispose();copy.material.dispose();group.remove(root)}}}
