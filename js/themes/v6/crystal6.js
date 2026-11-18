import*as THREE from"three";import{GLSL3}from"../v3/look3.js";export function prismGeometry(sides=6,{tip=.7,cut=0}={}){const pos=[],ring=y=>[...Array(sides)].map((_,k)=>{const a=(k+.5)/sides*Math.PI*2+Math.PI/2;return[Math.cos(a)*.5,y,Math.sin(a)*.5]});const b=ring(0),t=ring(1),tri=(p,q,r)=>pos.push(...p,...q,...r);for(let k=0;k<sides;k++){const k2=(k+1)%sides;tri(b[k],t[k],t[k2]);tri(b[k],t[k2],b[k2]);tri([0,0,0],b[k2],b[k])}if(tip>0){const apexY=2,top=cut>0?[...Array(sides)].map((_,k)=>{const[x,,z]=t[k];return[x*cut,1+(1-cut),z*cut]}):null;for(let k=0;k<sides;k++){const k2=(k+1)%sides;if(top){tri(t[k],top[k],top[k2]);tri(t[k],top[k2],t[k2]);tri([0,1+(1-cut),0],top[k2],top[k])}else tri(t[k],[0,apexY,0],t[k2])}}else for(let k=0;k<sides;k++)tri([0,1,0],t[k],t[(k+1)%sides]);const g=new THREE.BufferGeometry;g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g}const VS=`attribute vec3 aSize; attribute vec4 aGlow; varying vec3 vL, vC, vP, vS; varying vec4 vG;
  uniform float hk, rk;
  void main() {
    vec3 sz = aSize;
    #ifdef SHAPE
      sz.y *= hk;
    #endif
    float tipLen = TIPK * min(sz.x, sz.z);
    vec3 lp = vec3(position.x * sz.x, position.y <= 1.0001 ? position.y * sz.y : sz.y + (position.y - 1.0) * tipLen, position.z * sz.z);
    vL = lp; vS = vec3(sz.x, sz.y, sz.z); vG = aGlow;
    mat4 M = modelMatrix * instanceMatrix; vec4 w = M * vec4(lp, 1.0);
    float k = 1.0;
    #ifdef SHAPE
      k = rk; w.xz *= rk;
    #endif
    vP = w.xyz;
    vC = (inverse(M) * vec4(cameraPosition.x / k, cameraPosition.y, cameraPosition.z / k, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;const FS=`varying vec3 vL, vC, vP, vS; varying vec4 vG; ${GLSL3}
  #ifdef ENV
    uniform samplerCube envMap; uniform float envOn;
  #endif
  float lineAA(float d, float w) { float f = fwidth(d) * 1.2; return 1.0 - smoothstep(w - f, w + f, d); }
  void main() {
    vec3 V = normalize(eye - vP), N = normalize(cross(dFdx(vP), dFdy(vP))); if (dot(N, V) < 0.0) N = -N;
    vec3 toC = vC - vL, Nl = normalize(cross(dFdx(vL), dFdy(vL))); if (dot(Nl, toC) < 0.0) Nl = -Nl;
    float ndv = clamp(dot(N, V), 0.0, 1.0), fv = 1.0 - ndv, f2 = fv * fv, F = 0.03 + 0.97 * f2 * f2 * fv;
    float w = vS.x, h = vS.y, t = vS.z, R = 0.5 * min(w, t), dist = length(vP - eye);
    vec3 dir = -V; float calm = 1.0 - 0.85 * calmAt(dir);
    float sa = atan(vL.z / t, vL.x / w) * SIDES / 6.2831853 + SIDES * 0.25 - 0.5;
    float ea = abs(fract(sa + 0.5) - 0.5) * 6.2831853 * R / SIDES;
    #ifdef SLAB
      ea = max(0.5 * w - abs(vL.x), 0.0) + max(0.5 * t - abs(vL.z), 0.0);
    #endif
    float edge = lineAA(ea, 0.018 + 0.0012 * dist) + lineAA(abs(vL.y - h), 0.014 + 0.001 * dist) * step(vL.y, h + 0.6 * R);
    edge = clamp(edge, 0.0, 1.0);
    vec3 K = normalize(vec3(-0.2, 1.0, 0.45)), Rf = reflect(-V, N);
    float lam = 0.5 + 0.5 * dot(N, K), glint = smoothstep(0.988, 0.999, dot(Rf, K));
    vec3 refl = rimCol * (0.02 + 0.1 * exp(-abs(Rf.y) * 5.0)) + chord * bassL * 0.25 * exp(-abs(Rf.y - 0.02) * 12.0);
    #ifdef ENV
      if (envOn > 0.5) refl = textureCube(envMap, Rf).rgb;
    #endif
    vec3 rr = refract(normalize(vL - vC), Nl, 0.66);
    vec2 p = vL.xz, q = rr.xz; float A = max(dot(q, q), 1e-4), B = dot(p, q), C = dot(p, p) - R * R;
    float tx = (-B + sqrt(max(B * B - A * C, 0.0))) / A;
    if (rr.y > 1e-3) tx = min(tx, (h + R - vL.y) / rr.y); if (rr.y < -1e-3) tx = min(tx, -vL.y / rr.y);
    tx = clamp(tx, 0.0, 4.0 * R + h);
    float tc = clamp(-B / A, 0.0, tx); vec2 cp = p + q * tc; float dc = length(cp) / R, yc = clamp(vL.y + rr.y * tc, 0.0, h);
    vec3 X = vL + rr * tx; float sx = atan(X.z / t, X.x / w) * SIDES / 6.2831853 + SIDES * 0.25 - 0.5;
    float fx = floor(sx + SIDES), fy = floor(X.y / max(R * 1.6, 0.1));
    float ebd = abs(fract(sx + 0.5) - 0.5) * 6.2831853 * R / SIDES;
    #ifdef SLAB
      ebd = max(0.5 * w - abs(X.x), 0.0) + max(0.5 * t - abs(X.z), 0.0);
    #endif
    float eb = lineAA(ebd, 0.012 + 0.001 * dist) * step(X.y, h);
    float spark = hash(vec2(fx, fy) + floor(dot(rr, vec3(5.0, 3.0, 7.0)) * 1.5)); spark = spark * spark * spark;
    float core = exp(-dc * dc * 5.0), body = 0.22 + 0.78 * core;
    #ifdef SLAB
      core = 0.8 + 0.2 * core; body = 0.75 + 0.25 * clamp(tx / max(t, 0.05) - 1.0, 0.0, 1.0);
    #endif
    vec3 g = vG.rgb * calm; float I;
    I = (0.18 + 0.82 * exp(-yc / (0.34 * h))) * body;
    #ifdef SLAB
      spark = 0.5;
    #endif
    vec3 c = g * I * (0.75 + 0.9 * spark) + g * (edge * 1.1 + eb * 0.45);
    float gm = max(max(g.r, g.g), g.b), lv = gm * I;
    vec3 hue = g / max(gm, 1e-3), base = mix(vec3(0.13, 0.15, 0.21), hue, smoothstep(0.02, 0.25, gm));
    float fs = max(0.6 * w, 0.25); vec2 dq = vec2(X.x + X.z, X.y * 0.55) / fs;
    vec2 dc2 = vec2(floor(dq.x + dq.y), floor(dq.y - dq.x));
    float gb = hash(dc2 + fx * 7.0 + floor(dot(rr, vec3(5.0, 3.0, 7.0)) * 1.5)); gb = gb * gb;
    vec2 df = vec2(fract(dq.x + dq.y), fract(dq.y - dq.x)); float gtri = 1.0 - 2.0 * max(abs(df.x - 0.5), abs(df.y - 0.5));
    vec3 deep = exp(-(1.0 - base) * (tx / max(R, 0.05)) * 0.6);
    c = base * deep * (0.07 + (0.12 + 0.5 * gb) * (0.55 + 0.45 * gtri)) * (0.35 + 2.2 * lv) + base * (edge * 0.9 + eb * 0.35) * (0.15 + lv) + hue * lv * (0.35 + 0.65 * core) * 0.9;
    float front = kickAge * 16.0, b = (yc - front) / 0.8, be = (vL.y - front) / 0.6;
    float reachK = (1.0 - smoothstep(reach - 1.5, reach + 1.5, yc)) * kickK * exp(-kickAge * 3.0);
    c += chord * calm * reachK * (exp(-b * b) * core * 0.9 * mix(0.15, 1.0, smoothstep(1.05, 1.28, hk)) + exp(-be * be) * edge * 0.8 * mix(0.5, 1.0, smoothstep(1.05, 1.28, hk)));
    vec3 rc = rimCol;
    #ifdef SHAPE
      rc = mix(rimCol, prismCol(vL.y / max(h, 0.1) * 0.5 + atan(vP.x, -vP.z) * 0.25 + time * 0.12) * 0.9, prism) * (1.0 + 0.8 * prism);
    #endif
    float facetK = 0.5 + 0.5 * sin(dot(floor(sa + 0.5) + vec2(0.0), vec2(2.3)) + floor(vL.y / max(h, 0.1) + 0.0001) * 1.7);
    c += rc * (0.008 + (0.03 + 0.03 * facetK) * lam * lam + edge * (0.03 + 0.12 * lam * lam) + eb * 0.03) + (rc * 0.5 + 0.25) * glint * lam * 0.6 + refl * (0.03 + 0.8 * F);
    float a = clamp(0.2 + 0.08 * tx / max(R, 0.05) + 0.65 * F, 0.0, 0.92);
    a = clamp(mix(0.3, 0.5, smoothstep(0.02, 0.25, lv)) + 0.1 * tx / max(R, 0.05) + 0.35 * F, 0.0, 0.9);
    float fog = exp(-dist * 0.006); c *= fog; a *= mix(0.6, 1.0, fog);
    #ifdef MIRROR
      c *= exp(vP.y * 0.3) * 0.4; a *= 0.45;
    #endif
    gl_FragColor = vec4(c, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;export function crystalMaterial(U,{sides=6,tip=.7,mirror=false,shape=false,slab=false}={}){const defines={SIDES:sides.toFixed(1),TIPK:tip.toFixed(3),...mirror?{MIRROR:1}:{},...shape?{SHAPE:1}:{},...slab?{SLAB:1}:{},...U.envMap?{ENV:1}:{}};return new THREE.ShaderMaterial({uniforms:U,defines,vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,side:THREE.FrontSide})}const m4=new THREE.Matrix4,q4=new THREE.Quaternion,p4=new THREE.Vector3,one=new THREE.Vector3(1,1,1),Y=new THREE.Vector3(0,1,0);export function standAt(mesh,i,deg,r,turn=0){const a=deg*Math.PI/180;p4.set(Math.sin(a)*r,0,-Math.cos(a)*r);q4.setFromAxisAngle(Y,-a+turn);m4.compose(p4,q4,one);mesh.setMatrixAt(i,m4)}
