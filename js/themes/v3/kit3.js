import*as THREE from"three";import{GLSL3}from"./look3.js";const ENVH=`
#ifdef ENV
  uniform samplerCube envMap; uniform float envOn;
#endif
`;const envDefs=U=>U&&U.envMap?{ENV:1}:{};export function discGeometry(R=.3){const P=[[0,-.05],[.17,-.045],[.29,-.025],[.3,-.012],[.3,.012],[.285,.035],[.255,.048],[.16,.066],[0,.066]];const g0=new THREE.LatheGeometry(P.map(([r,z])=>new THREE.Vector2(r/.3*R,z)),24);g0.rotateX(Math.PI/2);const g=g0.toNonIndexed();g0.dispose();g.deleteAttribute("normal");g.computeVertexNormals();return g}const VS=`varying vec3 vN, vP, vL; void main() { vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;const ENV=`vec3 envAt(vec3 R) { return mix(vec3(0.012, 0.013, 0.017), rimCol * 0.2, smoothstep(-0.1, 0.9, R.y)) + chord * 0.08 * exp(-abs(R.y) * 6.0); }`;export function discMaterial(col,U=null){const m=new THREE.ShaderMaterial({uniforms:{uColor:{value:col.clone()},uAlpha:{value:1},...U?.envMap?{envMap:U.envMap,envOn:U.envOn}:{}},defines:envDefs(U),vertexShader:`varying vec3 vN, vP, vL, vC, vNl; void main() { vL = position; vNl = normal; vC = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
      vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`uniform vec3 uColor; uniform float uAlpha; varying vec3 vN, vP, vL, vC, vNl; ${ENVH}
      void main() {
        vec3 base = uColor, N = normalize(vN), V = normalize(cameraPosition - vP), nl = normalize(vNl);
        vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), V)), K = normalize(V + vec3(0.0, 0.6, 0.0) - side * 0.5);
        float fv = 1.0 - max(dot(N, V), 0.0), f2 = fv * fv, f5 = f2 * f2 * fv;
        float edge = clamp(length(fwidth(N)) * 3.0 - 0.15, 0.0, 1.0);
        vec3 d = normalize(vL - vC), rr = refract(d, nl, 0.66);
        float tb = (-0.045 - vL.z) / min(rr.z, -0.08);
        vec2 p = (vL.xy + rr.xy * tb) / 0.3; float pr = length(p), ang = atan(p.y, p.x);
        float fa = ang * 1.9099 + 6.0 + step(0.55, pr) * 0.5, fi = floor(fa) + 12.0 * step(0.55, pr);
        float b = 0.5 + 0.5 * sin(fi * 2.39996 + dot(rr, vec3(9.0, 7.0, 3.0)) * 1.6); b = b * b * b;
        float tri = 1.0 - abs(fract(fa) - 0.5) * 2.0;
        float core = exp(-pr * pr * 6.0);
        float I = 0.07 + (0.12 + 1.15 * b) * (0.35 + 0.65 * tri) * (1.0 - 0.45 * min(pr, 1.0)) + 0.7 * core;
        vec3 deep = exp(-(1.0 - base) * max(tb, 0.0) * length(rr) * 9.0);
        vec3 c = base * deep * I;
        float gird = 1.0 - smoothstep(0.25, 0.6, abs(nl.z));
        c = mix(c, base * (0.75 + 0.35 * fv), gird);
        vec3 R = reflect(-V, N);
        float key = smoothstep(0.955, 0.99, dot(R, K)), fill = smoothstep(0.55, 0.95, dot(R, normalize(V - K * 0.9)));
        c = c * (1.0 - 0.5 * key) + vec3(0.8) * key * key + base * fill * 0.22 + (base * 0.8 + 0.2) * edge * 0.8 + base * f5 * 0.5;
        #ifdef ENV
          if (envOn > 0.5) c += textureCube(envMap, R).rgb * (0.025 + 0.6 * f5);
        #endif
        gl_FragColor = vec4(c, uAlpha);
        #include <colorspace_fragment>
      }`});m.userData.shared=true;return m}export function shardMaterials(U,col){const tint={value:col.clone()};const mk=edge=>{const u={tint,uA:{value:1},rimCol:U.rimCol,chord:U.chord,...U.envMap?{envMap:U.envMap,envOn:U.envOn}:{}};const m=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:VS,defines:envDefs(U),fragmentShader:`uniform vec3 tint, rimCol, chord; uniform float uA; varying vec3 vN, vP, vL; ${ENV} ${ENVH}
        void main() {
          vec3 N = normalize(vN), V = normalize(cameraPosition - vP); if (dot(N, V) < 0.0) N = -N;
          vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), V)), K = normalize(V + vec3(0.0, 0.6, 0.0) - side * 0.5);
          float fv = 1.0 - max(dot(N, V), 0.0), fres = fv * fv, key = smoothstep(0.9, 0.975, dot(reflect(-V, N), K));
          vec3 c = tint * (${edge?"0.5 + 0.5 * fv":"0.16 + 0.8 * fres"}) + tint * envAt(refract(-V, N, 0.67)) * 1.2 + vec3(0.9) * key;
          #ifdef ENV
            if (envOn > 0.5) c += textureCube(envMap, reflect(-V, N)).rgb * (0.25 + 0.75 * fres) * 0.6;
          #endif
          gl_FragColor = vec4(c, min(1.0, (${edge?"0.45 + 0.5 * fres + 0.7 * key":"0.25 + 0.6 * fres + 0.7 * key"}) * uA));
          #include <colorspace_fragment>
        }`});m.color=u.tint.value;Object.defineProperty(m,"opacity",{get:()=>u.uA.value,set:v=>{u.uA.value=v},configurable:true});return m};return[mk(false),mk(true)]}export function gunMaterial(U,key,col,shot){const kind=key==="body"?0:key==="barrel"?1:2;const m=new THREE.ShaderMaterial({uniforms:{...U,base:{value:col},sa:shot},defines:envDefs(U),vertexShader:`varying vec3 vN, vP, vL, vC, vNl; void main() { vL = position; vNl = normal; vC = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
      vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`uniform vec3 base; uniform float sa; varying vec3 vN, vP, vL, vC, vNl; ${GLSL3} ${ENV} ${ENVH}
      float boxEdge(vec3 p) { vec3 q = max(vec3(0.027 - abs(p.x), min(p.y, 0.074 - p.y), min(p.z + 0.25, 0.092 - p.z)), 0.0);
        return q.x + q.y + q.z - min(q.x, min(q.y, q.z)) - max(q.x, max(q.y, q.z)); }
      void main() {
        vec3 N = normalize(vN), V = normalize(cameraPosition - vP), side = normalize(cross(vec3(0.0, 1.0, 0.0), V));
        float fv = 1.0 - abs(dot(N, V)), f2 = fv * fv, fres = f2 * f2;
        vec3 Rf = reflect(-V, N); float key = smoothstep(0.955, 0.99, dot(Rf, normalize(V + vec3(0.0, 0.6, 0.0) - side * 0.5)));
        vec3 Rr = refract(-V, N, 0.67), seen = envAt(Rr) * 4.0;
        #ifdef ENV
          if (envOn > 0.5) seen = textureCube(envMap, Rr).rgb;
        #endif
        float thru = dot(seen, vec3(0.3, 0.55, 0.15));
        float hz = exp(-abs(Rf.y - 0.04) * 16.0) * (0.25 + 0.75 * f2);
        vec3 Ng = normalize(cross(dFdx(vP), dFdy(vP)));
        float edge = clamp(max(length(fwidth(N)) * 2.5 - 0.15, length(fwidth(Ng)) * 0.8 - 0.1), 0.0, 1.0);
        float along = clamp((0.1 - vL.z) / 0.37, 0.0, 1.0), x = (along - sa * 12.5) / 0.2;
        float run = exp(-x * x) * step(sa, 0.12) + 0.6 * exp(-sa * 10.0);
        vec3 c;
        ${kind===0?`
        vec3 d = normalize(vL - vC); vec2 p = vec2(vL.x, vL.y - 0.037), q = d.xy; float t = max(0.0, -dot(p, q) / max(dot(q, q), 1e-4));
        vec2 nr = p + q * t; float r2 = dot(nr, nr), rod = (exp(-r2 * 14000.0) + 0.05 * exp(-r2 * 1500.0)) * step(vL.z, 0.08);
        float fa = abs(fract(dot(Rr, vec3(3.1, 1.7, 2.3)) * 2.0 + dot(vL, vec3(9.0, 13.0, 5.0))) - 0.5);
        float facet = (1.0 - smoothstep(0.0, 0.07, fa)) * (0.35 + 0.65 * fv);
        vec3 rl = refract(d, normalize(vNl), 0.67) + vec3(1e-4), tt = max((vec3(-0.027, 0.0, -0.25) - vL) / rl, (vec3(0.027, 0.074, 0.092) - vL) / rl);
        float path = clamp(min(min(tt.x, tt.y), tt.z), 0.0, 0.3);
        float e1 = exp(-boxEdge(vL) / 0.0018), e2 = exp(-boxEdge(vL + rl * path) / 0.0022);
        float I = 0.02 + thru * 2.2 * exp(-path * 14.0) + 0.06 * hz + 0.5 * edge + 0.9 * e1 + 0.65 * e2 + 0.12 * fres + 0.3 * facet + rod * (1.1 + 0.9 * run) + 0.3 * run;
        c = base * min(I, 1.0) + vec3(0.8) * key + rimCol * hz * 0.03;`:kind===1?`
        c = vec3(0.6, 0.65, 0.75) * (0.025 + 0.12 * f2 + thru * 0.7) + rimCol * (0.3 * hz + 0.6 * edge) + chord * hz * 0.08 + base * run * 0.06 + vec3(0.8) * key;`:`
        c = vec3(0.007, 0.008, 0.011) * (1.0 + 3.0 * f2) + vec3(0.7, 0.75, 0.85) * thru * 0.3 + rimCol * (0.12 * hz + 0.3 * edge + 0.06 * fres) + chord * hz * 0.04 + base * run * 0.03 + vec3(0.5) * key;`}
        #ifdef ENV
          if (envOn > 0.5) { vec3 h = textureCube(envMap, Rf).rgb; c += mix(h, vec3(dot(h, vec3(0.3, 0.55, 0.15))), ${kind===2?"0.7":"0.0"}) * ${kind===0?"0.12 * f2":kind===1?"0.9":"0.4"} * (0.15 + 0.85 * f2); }
        #endif
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`});m.userData.shared=true;return m}export function gunMarkMaterial(key,col){const m=key==="white"?new THREE.MeshBasicMaterial({visible:false}):new THREE.MeshBasicMaterial({color:col.clone().multiplyScalar(.16)});m.userData.shared=true;return m}export const casingGeometry=()=>{const g=new THREE.CylinderGeometry(.0042,.0042,.02,10);g.rotateX(Math.PI/2);return g};export const casingMaterial=col=>new THREE.MeshStandardMaterial({color:"#aeb8cc",metalness:0,roughness:.05,emissive:col.clone().multiplyScalar(.18),transparent:true,opacity:.85});export function haloTexture(){const c=document.createElement("canvas");c.width=c.height=128;const x=c.getContext("2d"),gr=x.createRadialGradient(64,64,0,64,64,64);for(const[s,a]of[[0,.7],[.34,.8],[.4,.55],[.5,.24],[.68,.07],[1,0]])gr.addColorStop(s,`rgba(255,255,255,${a})`);x.fillStyle=gr;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}export class GlowMat extends THREE.ShaderMaterial{get color(){return this.uniforms?.uColor?.value}set color(v){this.uniforms?.uColor?.value.copy?.(v)}get opacity(){return this.uniforms?.uA?this.uniforms.uA.value:this._op??1}set opacity(v){if(this.uniforms?.uA)this.uniforms.uA.value=v;else this._op=v}}export function lightBandMaterial(col,{arc=null,core=.13}={}){return new GlowMat({uniforms:{uColor:{value:col},uA:{value:1},uArc:{value:new THREE.Vector2(...arc||[0,0])}},transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:`varying float vS; varying vec2 vXY; void main() { vS = step(0.999, length(uv * 2.0 - 1.0)); vXY = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`uniform vec3 uColor; uniform float uA; uniform vec2 uArc; varying float vS; varying vec2 vXY;
      void main() {
        float x = (vS - 0.5) / ${core.toFixed(3)}, hot = exp(-x * x), glow = exp(-x * x * 0.09);
        float e = 1.0;
        if (uArc.y > 0.0) { float a = mod(atan(vXY.y, vXY.x) - uArc.x + 6.2831853, 6.2831853) / uArc.y; e = smoothstep(0.0, 0.3, a) * smoothstep(1.0, 0.7, a); }
        float a = clamp(hot * 1.1 + glow * 0.4, 0.0, 1.0) * uA * e;
        gl_FragColor = vec4(uColor * (1.0 + 0.25 * hot), a);
        #include <colorspace_fragment>
      }`})}export const beadGeometry=()=>new THREE.SphereGeometry(.03,14,10);export function beadMaterial(col=new THREE.Color("#ffffff")){return new GlowMat({uniforms:{uColor:{value:col.clone()},uA:{value:1}},transparent:true,vertexShader:VS,fragmentShader:`uniform vec3 uColor; uniform float uA; varying vec3 vN, vP, vL;
      void main() {
        vec3 N = normalize(vN), V = normalize(cameraPosition - vP), side = normalize(cross(vec3(0.0, 1.0, 0.0), V));
        vec3 K = normalize(V + vec3(0.0, 0.6, 0.0) - side * 0.5);
        float ndv = max(dot(N, V), 0.0), fv = 1.0 - ndv, lum = dot(uColor, vec3(0.3, 0.55, 0.15));
        float spec = pow(max(dot(N, normalize(K + V)), 0.0), 120.0);
        float inner = 0.22 + 0.5 * ndv * ndv + 0.45 * pow(max(dot(N, normalize(V - K * 0.8)), 0.0), 4.0);
        vec3 c = uColor * inner * mix(0.25, 1.0, step(0.2, lum)) + vec3(1.0) * spec + vec3(0.55, 0.6, 0.7) * fv * fv * (lum < 0.2 ? 0.6 : 0.15);
        gl_FragColor = vec4(c, uA);
        #include <colorspace_fragment>
      }`})}
