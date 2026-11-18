import*as THREE from"three";import{GLSL3}from"../v3/look3.js";import{SLIDE}from"../../gunmodel.js";const f4=x=>x.toFixed(4),SL={HW:f4(SLIDE.hw),TOP:f4(SLIDE.top),NOSE:f4(SLIDE.nose),BACK:f4(SLIDE.back),CH:f4(SLIDE.ch),ROD:f4(SLIDE.top/2)};const ENVH=`
#ifdef ENV
  uniform samplerCube envMap; uniform float envOn;
#endif
`;export function gunMaterial6(U,key,col,G){const kind=key==="body"?0:key==="barrel"?1:2;const m=new THREE.ShaderMaterial({uniforms:{...U,base:{value:col},sa:G.shot,uCharge:G.charge},defines:{...U.envMap?{ENV:1}:{}},vertexShader:`attribute vec3 aEdge; varying vec3 vN, vP, vL, vC, vNl, vE; void main() { vL = position; vNl = normal; vE = aEdge; vC = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
      vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`uniform vec3 base; uniform float sa, uCharge; varying vec3 vN, vP, vL, vC, vNl, vE; ${GLSL3} ${ENVH}
      void two(float d, inout float a, inout float b) { if (d < a) { b = a; a = d; } else if (d < b) b = d; }
      float slideEdge(vec3 p) { float a = 1.0, b = 1.0; two(${SL.HW} - abs(p.x), a, b); two(${SL.TOP} - p.y, a, b); two(p.y, a, b); two(p.z - (${SL.NOSE}), a, b);
        two(${SL.BACK} - p.z, a, b); two((${SL.HW} + ${SL.TOP} - ${SL.CH} - abs(p.x) - p.y) * 0.7071, a, b); return max(b, 0.0); }
      vec3 envAt(vec3 R) { return mix(vec3(0.012, 0.013, 0.017), rimCol * 0.2, smoothstep(-0.1, 0.9, R.y)) + chord * 0.08 * exp(-abs(R.y) * 6.0); }
      void main() {
        vec3 N = normalize(vN), V = normalize(cameraPosition - vP), side = normalize(cross(vec3(0.0, 1.0, 0.0), V));
        float fv = 1.0 - abs(dot(N, V)), f2 = fv * fv, F = 0.03 + 0.97 * f2 * f2 * fv;
        vec3 Rf = reflect(-V, N); float key = smoothstep(0.96, 0.992, dot(Rf, normalize(V + vec3(0.0, 0.6, 0.0) - side * 0.5)));
        vec3 Rr = refract(-V, N, 0.67), seen = envAt(Rr) * 3.0, refl = envAt(Rf) * 2.0;
        #ifdef ENV
          if (envOn > 0.5) { seen = textureCube(envMap, Rr).rgb; refl = textureCube(envMap, Rf).rgb; }
        #endif
        vec3 Ng = normalize(cross(dFdx(vP), dFdy(vP)));
        float edge = clamp(max(length(fwidth(N)) * 2.5 - 0.15, length(fwidth(Ng)) * 0.8 - 0.1), 0.0, 1.0);
        float ed = min(min(vE.x, vE.y), vE.z), lw = max(0.0011, fwidth(ed) * 1.2), cut = exp(-ed / lw) * 0.0011 / lw;
        float along = clamp((0.1 - vL.z) / 0.37, 0.0, 1.0), x = (along - sa * 12.5) / 0.2;
        float run = exp(-x * x) * step(sa, 0.12) + 0.5 * exp(-sa * 10.0);
        float flow = 0.55 + 0.45 * sin(vL.z * 140.0 + time * 38.0) * sin(vL.z * 53.0 - time * 11.0);
        vec3 c;
        ${kind===0?`
        vec3 d = normalize(vL - vC), rl = refract(d, normalize(vNl), 0.67) + vec3(1e-4);
        vec3 tt = max((vec3(-${SL.HW}, 0.0, ${SL.NOSE}) - vL) / rl, (vec3(${SL.HW}, ${SL.TOP}, ${SL.BACK}) - vL) / rl);
        float path = clamp(min(min(tt.x, tt.y), tt.z), 0.0, 0.3);
        vec3 tint = exp(-(1.0 - base) * (0.25 + path * 22.0));
        float e1 = cut, e2 = exp(-slideEdge(vL + rl * path) / 0.002);
        vec2 p = vec2(vL.x, vL.y - ${SL.ROD}), q = rl.xy; float t = max(0.0, -dot(p, q) / max(dot(q, q), 1e-4));
        vec2 nr = p + q * min(t, path); float r2 = dot(nr, nr), rod = (exp(-r2 * 16000.0) + 0.06 * exp(-r2 * 1400.0)) * step(vL.z, ${SL.BACK} - 0.012);
        vec3 body = seen * tint * 0.85;
        vec3 X = vL + rl * path; vec2 dq = vec2(X.z + X.x, X.y * 1.4) / 0.017;
        float gb = hash(vec2(floor(dq.x + dq.y), floor(dq.y - dq.x))); gb = gb * gb;
        vec2 df = vec2(fract(dq.x + dq.y), fract(dq.y - dq.x)); float gtri = 1.0 - 2.0 * max(abs(df.x - 0.5), abs(df.y - 0.5));
        body = base * exp(-(1.0 - base) * (0.3 + path * 26.0)) * (0.3 + (0.18 + 0.7 * gb) * (0.5 + 0.5 * gtri)) + seen * tint * 0.2;
        c = body + base * (0.035 + 0.85 * e1 + 0.55 * e2 + 0.35 * edge) + base * rod * (0.85 + 0.9 * run) + base * 0.25 * run;
        c += base * uCharge * (0.22 + 0.5 * exp(-r2 * 2500.0) * flow) + vec3(1.0) * uCharge * rod * 0.7 * flow + base * uCharge * e1 * 0.5;
        c += vec3(0.85) * key + refl * (0.02 + 0.6 * F);`:kind===1?`
        c = seen * 0.7 + (rimCol * 0.5 + base * 0.35) * max(edge, cut * 0.6) + base * (0.025 + 0.06 * fv) + vec3(0.8) * key + refl * (0.06 + 0.8 * F) + base * (run * 0.08 + uCharge * 0.12 * flow);`:`
        float fe = max(edge, cut * (0.3 + 0.7 * max(N.y, 0.0))); c = seen * 0.16 + rimCol * 0.12 * fe + base * fe * uCharge * 0.6 + vec3(0.6) * key + refl * (0.03 + 0.6 * F) + base * run * 0.04;
        c += base * (0.07 + fe * 0.07);
        `}
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`});m.userData.shared=true;return m}export function gemBoxMaterial(U,col,half){const m=new THREE.ShaderMaterial({uniforms:{...U,base:{value:col.clone()},hs:{value:new THREE.Vector3(...half)}},transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,vertexShader:`varying vec3 vN, vP, vL, vC, vNl; void main() { vL = position; vNl = normal; vC = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
      vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`uniform vec3 base, hs; varying vec3 vN, vP, vL, vC, vNl; ${GLSL3}
      void main() {
        vec3 N = normalize(vN), V = normalize(cameraPosition - vP), side = normalize(cross(vec3(0.0, 1.0, 0.0), V));
        float fv = 1.0 - abs(dot(N, V)), F = 0.03 + 0.97 * pow(fv, 5.0);
        vec3 d = normalize(vL - vC), rl = refract(d, normalize(vNl), 0.66) + vec3(1e-4);
        vec3 tt = max((-hs - vL) / rl, (hs - vL) / rl); float path = max(min(min(tt.x, tt.y), tt.z), 0.0);
        vec3 X = vL + rl * path; float th = min(hs.x, min(hs.y, hs.z)), fs = max(min(hs.x, hs.y) * 0.9, 0.06);
        vec2 dq = vec2(X.x + X.z, X.y * 0.6) / fs;
        float gb = hash(vec2(floor(dq.x + dq.y), floor(dq.y - dq.x)) + floor(dot(rl, vec3(5.0, 3.0, 7.0)) * 1.5)); gb = gb * gb;
        vec2 df = vec2(fract(dq.x + dq.y), fract(dq.y - dq.x)); float gtri = 1.0 - 2.0 * max(abs(df.x - 0.5), abs(df.y - 0.5));
        vec3 deep = exp(-(1.0 - base) * path / max(th, 0.02) * 0.35);
        vec3 q = hs - abs(vL); float e = q.x + q.y + q.z - min(q.x, min(q.y, q.z)) - max(q.x, max(q.y, q.z)), edge = exp(-e / 0.015);
        vec3 R = reflect(-V, N); float key = smoothstep(0.96, 0.99, dot(R, normalize(V + vec3(0.0, 0.6, 0.0) - side * 0.5)));
        vec3 c = base * deep * (0.12 + (0.22 + 1.1 * gb) * (0.5 + 0.5 * gtri)) + base * edge * 1.2 + vec3(0.85) * key + rimCol * 0.15 * F;
        float a = clamp(0.5 + 0.35 * F + 0.3 * edge + 0.2 * gb, 0.0, 0.95);
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`});m.userData.shared=true;return m}export function gunMarkMaterial6(key,col){const m=key==="white"?new THREE.MeshBasicMaterial({visible:false}):new THREE.MeshBasicMaterial({color:col.clone().multiplyScalar(.45).addScalar(.05),transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false});m.userData.shared=true;return m}export function shardMaterials6(U,col){const tint={value:col.clone()};const mk=edge=>{const u={tint,uA:{value:1},rimCol:U.rimCol,chord:U.chord,...U.envMap?{envMap:U.envMap,envOn:U.envOn}:{}};const m=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,side:THREE.DoubleSide,defines:U.envMap?{ENV:1}:{},blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,vertexShader:`varying vec3 vN, vP; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`uniform vec3 tint, rimCol, chord; uniform float uA; varying vec3 vN, vP; ${ENVH}
        void main() {
          vec3 N = normalize(vN), V = normalize(cameraPosition - vP); if (dot(N, V) < 0.0) N = -N;
          vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), V)), K = normalize(V + vec3(0.0, 0.6, 0.0) - side * 0.5), Rf = reflect(-V, N);
          float fv = 1.0 - max(dot(N, V), 0.0), F = 0.03 + 0.97 * pow(fv, 5.0), key = smoothstep(0.93, 0.985, dot(Rf, K));
          vec3 c = ${edge?"tint * (1.1 + 0.4 * fv)":"tint * (0.22 + 0.9 * fv * fv)"} + vec3(0.9) * key, refl = rimCol * 0.15 * exp(-abs(Rf.y) * 4.0);
          #ifdef ENV
            if (envOn > 0.5) refl = textureCube(envMap, Rf).rgb;
          #endif
          c += refl * (0.05 + 0.8 * F);
          float a = ${edge?"0.85":"0.35 + 0.5 * fv * fv + 0.5 * key"};
          float under = vP.y < 0.0 ? 0.5 * exp(vP.y * 2.2) : 1.0;
          gl_FragColor = vec4(c * uA * under, a * uA * under);
          #include <colorspace_fragment>
        }`});m.color=u.tint.value;Object.defineProperty(m,"opacity",{get:()=>u.uA.value,set:v=>{u.uA.value=v},configurable:true});return m};return[mk(false),mk(true)]}
