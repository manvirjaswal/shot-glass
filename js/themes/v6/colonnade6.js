import*as THREE from"three";import{GLSL3}from"../v3/look3.js";import{createPrisms}from"../v3/prisms3.js";function gemMaterial(U){return new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,defines:U.envMap?{ENV:1}:{},blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,defines:{...U.envMap?{ENV:1}:{}},vertexShader:`attribute vec3 aGlow; varying vec3 vL, vC, vP, vG;
      void main() { vG = aGlow; vL = position; mat4 M = modelMatrix * instanceMatrix; vec4 w = M * vec4(position, 1.0); vP = w.xyz;
        vC = (inverse(M) * vec4(cameraPosition, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`varying vec3 vL, vC, vP, vG; ${GLSL3}
      #ifdef ENV
        uniform samplerCube envMap; uniform float envOn;
      #endif
      float lineAA(float d, float w) { float f = fwidth(d) * 1.2; return 1.0 - smoothstep(w - f, w + f, d); }
      void main() {
        vec3 V = normalize(eye - vP), N = normalize(cross(dFdx(vP), dFdy(vP))); if (dot(N, V) < 0.0) N = -N;
        vec3 toC = vC - vL, Nl = normalize(cross(dFdx(vL), dFdy(vL))); if (dot(Nl, toC) < 0.0) Nl = -Nl;
        float fv = 1.0 - clamp(dot(N, V), 0.0, 1.0), F = 0.03 + 0.97 * pow(fv, 5.0), dist = length(vP - eye);
        vec3 aL = abs(vL / vec3(0.45, 0.8, 0.45)); float edge = lineAA(min(aL.x, min(aL.y, aL.z)), 0.035);
        vec3 K = normalize(vec3(-0.2, 1.0, 0.45)), Rf = reflect(-V, N);
        float lam = 0.5 + 0.5 * dot(N, K), glint = smoothstep(0.97, 0.996, dot(Rf, K));
        vec3 refl = rimCol * (0.02 + 0.1 * exp(-abs(Rf.y) * 5.0));
        #ifdef ENV
          if (envOn > 0.5) refl = textureCube(envMap, Rf).rgb;
        #endif
        vec3 rr = refract(normalize(vL - vC), Nl, 0.66); float tc = max(-dot(vL, rr), 0.0); vec3 cp = vL + rr * tc;
        float core = exp(-dot(cp, cp) * 9.0), calm = 1.0 - 0.85 * calmAt(-V);
        float spark = hash(floor(rr.xy * 3.0) + floor(rr.z * 3.0)); spark = spark * spark;
        vec3 g = vG * calm, c = g * (0.3 + 1.8 * core) * (0.7 + 0.8 * spark) + g * edge * 0.9;
        c += rimCol * (0.01 + 0.06 * lam * lam + edge * (0.03 + 0.1 * lam * lam)) + vec3(0.8) * glint * lam + refl * (0.03 + 0.8 * F);
        float a = clamp(0.25 + 0.65 * F, 0.0, 0.9);
        float gm = max(max(vG.r, vG.g), vG.b); vec3 hue = vG / max(gm, 1e-3), base = mix(vec3(0.13, 0.15, 0.21), hue, smoothstep(0.02, 0.25, gm));
        vec3 X = cp + rr * 0.4; vec2 dq = vec2(X.x + X.z, X.y * 0.7) / 0.22;
        float gb = hash(vec2(floor(dq.x + dq.y), floor(dq.y - dq.x)) + floor(dot(rr, vec3(5.0, 3.0, 7.0)) * 1.5)); gb = gb * gb;
        vec2 df = vec2(fract(dq.x + dq.y), fract(dq.y - dq.x)); float gtri = 1.0 - 2.0 * max(abs(df.x - 0.5), abs(df.y - 0.5));
        c = base * calm * (0.08 + (0.14 + 0.6 * gb) * (0.5 + 0.5 * gtri)) * (0.4 + 2.0 * gm) + base * edge * (0.25 + gm) * calm + g * core * 1.4
          + vec3(0.8) * glint * lam + refl * (0.03 + 0.8 * F);
        float on = smoothstep(0.02, 0.25, gm); c *= mix(0.35, 1.0, on);
        float ek = mix(0.35, 1.0, on);
        c -= base * edge * (0.25 + gm) * calm * 0.35 * (1.0 - ek);
        c += (1.0 - on) * (vec3(0.03, 0.035, 0.05) * (0.2 + 0.8 * lam * lam) + (rimCol * 0.15 + 0.03) * F * (0.4 + 0.6 * lam)) * calm;
        a = clamp(mix(0.1, 0.5, on) + (0.35 * F + 0.2 * edge * ek) * mix(0.4, 1.0, on), 0.0, 0.92);
        float fog = exp(-dist * 0.01); c *= fog; a *= fog;
        gl_FragColor = vec4(c, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`})}export function createCrystalGems(U){const P=createPrisms(U);P.mesh.material.dispose();P.mesh.material=gemMaterial(U);P.mesh.renderOrder=3;return P}
