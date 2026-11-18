import*as THREE from"three";import{GLSL3}from"./look3.js";import{CLOUDS}from"../v17/clouds17.js";import{WATER_SKY}from"../v16/water16.js";import{AURORA_SKY,AURORA_RINGS,EQ_HEAD,RINGS}from"../v17/aurora17.js";const DISC_R=.3;const blank=()=>Object.assign(new THREE.DataTexture(new Uint8Array(4),1,1),{needsUpdate:true});const vec4s=n=>Array.from({length:n},()=>new THREE.Vector4);export function createFloor(U,opts={}){const FU={...U,voidF:{value:0},snOff:{value:0},kFloor:{value:0},kGainF:{value:.5},tl:{value:Array.from({length:16},()=>new THREE.Vector4(0,0,0,0))},tc:{value:Array.from({length:16},()=>new THREE.Color)},pn:{value:0},poolOn:{value:1},mirrorOn:{value:1},lw:{value:Array.from({length:6},()=>new THREE.Vector4(0,0,-1,0))},wA:{value:Array.from({length:3},()=>new THREE.Vector4)},wB:{value:Array.from({length:3},()=>new THREE.Vector4)},wC:{value:Array.from({length:3},()=>new THREE.Vector4)},waterF:{value:0},waveSpan:{value:56},waveK:{value:1.2},wSheen:{value:new THREE.Color(0,0,0)},waveTex:{value:blank()},nebTex:{value:blank()},nebRot:{value:0},nzTex:{value:blank()},aLit:{value:.3},hzAge:{value:9},hzKick:{value:0},hzOld:{value:new THREE.Color},hzNew:{value:new THREE.Color},a1P0:{value:new THREE.Color("#2fe08a")},a1P1:{value:new THREE.Color("#5cf0b8")},a1P2:{value:new THREE.Color("#8a6cff")},a1Two:{value:0},a1G:{value:vec4s(3)},a1H:{value:vec4s(3)},a1V:{value:vec4s(3)},a1N:{value:2},gr:{value:vec4s(RINGS)},gc:{value:Array.from({length:RINGS},()=>new THREE.Color)},grN:{value:0},sc:{value:vec4s(3)},sd:{value:vec4s(3)},skW:{value:0},skF:{value:-1},skFK:{value:0},skL:{value:0},skP:{value:vec4s(4).map(v=>v.set(0,-99,0,0))},aT:{value:0},aE:{value:1},hzEq:{value:1},eqTex:{value:blank()},eqA:{value:0},eqPa:{value:0},eqV4:{value:0},eqP:{value:[0,0,0,0,0]},pgT:{value:-1},wfTex:{value:blank()}};const mat=new THREE.ShaderMaterial({uniforms:FU,transparent:true,depthWrite:false,defines:opts.v2?{V2:1}:{},blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,vertexShader:`varying vec3 vP; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`uniform float pn, poolOn, mirrorOn, voidF, snOff, kFloor, kGainF; uniform vec4 tl[16]; uniform vec3 tc[16]; uniform vec4 lw[6], wA[3], wB[3], wC[3]; varying vec3 vP; ${GLSL3}
      uniform float waterF, waveSpan, waveK; uniform vec3 wSheen; uniform sampler2D waveTex; uniform vec4 sc[3], sd[3]; ${CLOUDS} ${WATER_SKY} ${EQ_HEAD} ${AURORA_SKY} ${AURORA_RINGS}
      float lineAA(float d, float w) { float f = fwidth(d); return 1.0 - smoothstep(w - f, w + f, abs(d)); }
      #ifdef V2
        float caustic(vec2 q, float t) {
          float v = 0.0;
          for (int n = 0; n < 3; n++) { float fn = float(n);
            vec2 r = q * (1.0 + fn * 0.6) + vec2(sin(t * 0.7 + fn * 2.1), cos(t * 0.5 + fn * 1.3)) * 1.5;
            v += abs(sin(r.x + sin(r.y * 1.7 + t)) * cos(r.y * 0.8 + cos(r.x * 1.3 - t * 0.6))); }
          return pow(1.0 - v / 3.0, 6.0);
        }
      #endif
      void main() {
        vec2 p = vP.xz; float r = length(p);
        vec3 V = normalize(eye - vP);
        vec3 base = vec3(0.012, 0.0125, 0.014) * (0.85 + 0.3 * noise(p * 0.08));
        vec2 g = abs(fract(p / 3.0) - 0.5);
        float seam = lineAA(max(g.x, g.y) - 0.5, 0.004) * exp(-r * 0.05);
        float plat = 1.0 - smoothstep(platR - 0.02, platR, r);
        base = mix(base, vec3(0.004, 0.0045, 0.006), plat);
        base = mix(base, vec3(0.002, 0.0022, 0.003), voidF * (1.0 - plat)); seam *= 1.0 - voidF;
        vec3 glow = rimCol * 0.012 * seam * (1.0 - plat) + rimCol * 0.03 * plat * lineAA(fract(r / 0.3) - 0.5, 0.015) * step(0.3, r) * (1.0 - voidF);
        float rim = lineAA(r - platR + 0.03, 0.02), rimHalo = exp(-abs(r - platR) * 9.0);
        glow += rimCol * rim * 0.16 + chord * snP * (1.0 - snOff) * (rim * 0.8 + rimHalo * 0.6);
        if (poolOn > 0.5 && waterF < 0.5) for (int i = 0; i < 16; i++) { if (float(i) >= pn) break;
          vec2 d = p - tl[i].xz; float h = max(tl[i].y, 0.5), s = 0.35 + 0.12 * h;
          glow += tc[i] * tl[i].w * tl[i].w * tl[i].w * exp(-dot(d, d) / (2.0 * s * s)) * 0.22 / (1.0 + 0.05 * h); }
        if (ringAge >= 0.0 && waterF < 0.5) { float x = (r - ringAge * 32.0) / 1.2; glow += chord * ringK * exp(-x * x) * smoothstep(0.0, 0.2, ringAge) * exp(-ringAge * 1.2); }
        #ifdef V2
          float zone = smoothstep(platR + 0.3, platR + 1.4, r) * (1.0 - smoothstep(11.0, 16.0, r)) * smoothstep(1.75, 1.2, abs(atan(p.x, -p.y)));
          zone *= 1.0 - voidF;
          float hiK = 0.05 * hiL + 0.16 * hiP;
          if (zone > 0.0 && hiK > 0.002) glow += chord * caustic(p * 0.55, hiPh * 0.9) * hiK * zone * (1.0 - plat);
        #endif
        float wave = 0.0;
        for (int i = 0; i < 6; i++) { vec4 L = lw[i]; if (L.z < 0.0) continue;
          float mini = step(L.w, 0.6), d = length(p - L.xy), x = d - L.z * mix(14.0, 6.0, mini), env = L.w * exp(-L.z * mix(1.5, 4.0, mini)) * smoothstep(0.0, 0.05, L.z);
          float crest = exp(-x * x / 0.35), trail = x < 0.0 ? sin(-x * 4.2) * exp(x * 0.55) : 0.0, w = crest + 0.45 * max(trail, 0.0);
          float grid = lineAA(max(g.x, g.y) - 0.5, 0.012) * (1.0 - voidF);
          vec3 amb = mix(vec3(1.0, 0.62, 0.2), vec3(1.0, 0.8, 0.32) * 1.6, mini);
          glow += amb * env * (w * 0.22 + w * grid * 1.4 + exp(-d * d * 0.8) * exp(-L.z * 7.0) * 0.8);
          #ifdef V2
            glow += amb * env * w * caustic(p * 0.55, hiPh * 0.9) * 1.2 * (1.0 - voidF);
          #endif
          wave = max(wave, abs(trail + crest) * env); }
        if (kFloor > 0.0 && kickAge < 1.2) {
          float env = kFloor * kGainF * kickK * exp(-kickAge * 3.2) * smoothstep(0.0, 0.03, kickAge) * (1.0 - plat);
          float x = r - platR - kickAge * 12.0, crest = exp(-x * x / 0.12), trail = x < 0.0 ? sin(-x * 4.5) * exp(x * 1.1) : 0.0;
          glow += chord * env * (crest * 0.09 + max(trail, 0.0) * 0.045);
          wave = max(wave, abs(trail + crest) * env * 1.6); }
        for (int i = 0; i < 3; i++) { vec4 A = wA[i], B = wB[i], C = wC[i]; if (B.y <= 0.0 && C.z <= 0.0) continue;
          vec2 ab = A.zw - A.xy; float len = max(length(ab), 0.01), t = clamp(dot(p - A.xy, ab) / (len * len), 0.0, 1.0);
          float across = length(p - A.xy - ab * t) / B.x;
          float lane = exp(-across * across * 3.5) * smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.7, 1.0, t)) * B.y;
          float x = (t - B.z) * len, crest = exp(-x * x / 0.6) * B.w;
          float grid = lineAA(max(g.x, g.y) - 0.5, 0.014) * (1.0 - voidF);
          vec3 amb = vec3(1.0, 0.66, 0.22);
          glow += amb * lane * (0.07 + grid * 0.5 * exp(-across * across * 2.0) + crest * (0.3 + grid * 1.4));
          glow += amb * step(0.5, waterF) * exp(-across * across * 14.0) * smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.7, 1.0, t)) * B.y * (0.2 + crest * 0.9);
          #ifdef V2
            glow += amb * lane * caustic(p * 0.55, hiPh * 0.9) * (0.6 + 2.0 * crest) * (1.0 - voidF);
          #endif
          vec2 q = p - C.xy, toE = normalize(eye.xz - C.xy + vec2(1e-4)); float al = dot(q, toE), sd = dot(q, vec2(-toE.y, toE.x));
          float ws = B.x * mix(0.55, 0.9, C.w), ls = mix(0.7, 3.8, C.w), sd2 = sd * sd / (ws * ws);
          glow += amb * C.z * exp(-al * al / (ls * ls)) * (exp(-sd2) * 0.28 + exp(-sd2 * 6.0) * 0.5);
          wave = max(wave, lane * 0.5); }
        float gl = 1.0 - clamp(V.y, 0.0, 1.0), fres = 0.35 + 0.65 * gl * gl * gl * gl;
        float a = 1.0 - mirrorOn * fres * 0.85 * (1.0 - plat * 0.6);
        a = mix(a, 0.12 + 0.55 * gl * gl * gl * gl, voidF * (1.0 - plat));
        if (waterF > 0.5) {
          vec2 wuv = p / waveSpan + 0.5, e = vec2(1.0 / 256.0, 0.0);
          float inG = step(0.0, wuv.x) * step(wuv.x, 1.0) * step(0.0, wuv.y) * step(wuv.y, 1.0);
          vec2 sl = vec2(texture2D(waveTex, wuv + e.xy).r - texture2D(waveTex, wuv - e.xy).r, texture2D(waveTex, wuv + e.yx).r - texture2D(waveTex, wuv - e.yx).r) * waveK * inG;
          float sheen = smoothstep(0.03, 0.2, length(sl));
          vec3 lit2 = goldRings(p, sl);
          vec3 Nw = normalize(vec3(-sl.x, 1.0, -sl.y)), Rw = reflect(-V, Nw); Rw.y = abs(Rw.y);
          float fr = pow(1.0 - max(dot(Nw, V), 0.0), 3.0), F = (0.82 + 0.18 * fr) * mirrorOn;
          vec3 refl = auroraSky(Rw, 0.0);
          if (poolOn > 0.5) for (int i = 0; i < 16; i++) { if (float(i) >= pn) break;
            vec3 q = tl[i].xyz - vP; float dq = length(q), x = sqrt(max(0.0, 2.0 * (1.0 - dot(Rw, q / dq)))) * dq / ${DISC_R.toFixed(2)};
            if (x < 1.2) { float k = 0.3 + 0.7 * tl[i].w * tl[i].w, rim = exp(-pow((x - 0.9) / 0.08, 2.0)), body = 1.0 - smoothstep(0.82, 1.02, x);
              refl += tc[i] * k * (0.65 * body + 0.7 * rim) + mix(tc[i], vec3(1.0), 0.6) * k * exp(-x * x * 10.0) * 0.4; } }
          for (int i = 0; i < 4; i++) { vec4 H = hitP[i]; if (H.w < 0.0 || H.w > 0.45) continue;
            vec3 q = H.xyz - vP; float dq = length(q), x = sqrt(max(0.0, 2.0 * (1.0 - dot(Rw, q / dq)))) * dq;
            refl += vec3(1.0, 0.96, 0.88) * (exp(-x * x * 1.6) * 0.9 + exp(-x * x * 0.12) * 0.12) * exp(-H.w * 8.0) * smoothstep(0.0, 0.03, H.w); }
          glow += (refl * F + lit2 + wSheen * sheen) * (1.0 - plat);
          { vec3 foam = vec3(0.0); float gapK = 0.0;
            for (int i = 0; i < 3; i++) { vec4 A = sc[i], B = sd[i]; if (B.z <= 0.001) continue;
              vec2 ab = A.zw - A.xy; float len = max(length(ab), 0.01); vec2 u = ab / len, q = p - A.xy;
              float along = dot(q, u), across = abs(dot(q, vec2(-u.y, u.x))), behind = len - along;
              if (along < -0.6 || behind < -0.8) continue;
              float w = B.x * (0.5 + min(max(behind, 0.0), 8.0) * 0.26), ends = smoothstep(-0.8, 0.1, behind) * smoothstep(-0.6, 1.2, along);
              float heal = exp(-max(behind, 0.0) / B.y) * B.z * ends;
              float lips = exp(-pow((across - w) / (0.2 + 0.12 * w), 2.0)), gap = 1.0 - smoothstep(w * 0.55, w, across);
              float grain = 0.5 + 0.5 * nzA(p * 2.3 + vec2(time * 0.9, -time * 0.4));
              foam += vec3(0.78, 0.88, 1.0) * lips * grain * heal * 0.9; gapK = max(gapK, gap * heal); }
            glow = glow * (1.0 - 0.7 * min(gapK, 1.0)) + foam * (1.0 - plat); a = max(a, min(1.0, foam.g * 1.4)); }
          a = mix(a, 1.0 - (1.0 - F) * 0.45, 1.0 - plat);
          base = mix(base, vec3(0.002, 0.004, 0.009), 1.0 - plat);
          { float mist = smoothstep(14.0, 75.0, r) * (0.35 + 0.65 * nzA(p * 0.035 + vec2(time * 0.012, -time * 0.008))) * (1.0 - plat);
            glow = mix(glow, vec3(0.028, 0.036, 0.055) + a1P0 * 0.018 * aLit, mist * 0.6); a = max(a, mist * 0.6); }
        }
        a *= 1.0 - 0.35 * min(wave, 1.0);
        gl_FragColor = vec4(base * a + glow, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(400,400),mat);mesh.rotation.x=-Math.PI/2;mesh.renderOrder=-1;mesh.frustumCulled=false;let li=0;const wUsed=[false,false,false],sFade=[false,false,false],sUsed=[false,false,false];return{mesh,FU,warnStart(){const i=wUsed.indexOf(false);if(i<0)return null;wUsed[i]=true;return i},warn(i,w){FU.wA.value[i].set(w.back.x,w.back.z,w.front.x,w.front.z);FU.wB.value[i].set(w.half,w.light,w.crestAt,w.crest);FU.wC.value[i].set(w.refl.x,w.refl.z,w.reflLight,w.far)},warnEnd(i){wUsed[i]=false;FU.wB.value[i].set(1,0,0,0);FU.wC.value[i].set(0,0,0,0)},land(p,strong,mini=false){FU.lw.value[li++%6].set(p.x,p.z,0,mini?.5:strong?1.25:1);return true},scarStart(){const i=sUsed.indexOf(false);if(i<0)return null;sUsed[i]=true;sFade[i]=false;return i},scar(i,s){FU.sc.value[i].set(s.from.x,s.from.z,s.to.x,s.to.z);FU.sd.value[i].set(s.w,s.back,s.k,0)},scarEnd(i){sFade[i]=true},step(dt){for(const L of FU.lw.value)if(L.z>=0){L.z+=dt;if(L.z>2.2)L.z=-1}for(let i=0;i<3;i++)if(sFade[i]){const D=FU.sd.value[i];D.y=Math.max(.5,D.y*Math.exp(-dt*1.5));D.z*=Math.exp(-dt*2.5);if(D.z<.01){D.z=0;sFade[i]=false;sUsed[i]=false}}}}}
