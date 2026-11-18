import*as THREE from"three";import{GLSL3}from"../v3/look3.js";const SIDES=6,TIP=1.1;const VS=`
  #ifdef HALL
    uniform float rk;
  #endif
  attribute vec3 aSize; attribute vec4 aCol; attribute float aLit; varying vec3 vL, vC, vP, vS; varying vec4 vG; varying float vSeed;
  void main() {
    vec3 sz = aSize; float tipLen = TIPK * min(sz.x, sz.z);
    vec3 lp = vec3(position.x * sz.x, position.y <= 1.0001 ? position.y * sz.y : sz.y + (position.y - 1.0) * tipLen, position.z * sz.z);
    vL = lp; vS = sz; vG = vec4(aCol.rgb, aLit); vSeed = aCol.a;
    mat4 M = modelMatrix * instanceMatrix; vec4 w = M * vec4(lp, 1.0);
    #ifdef HALL
      w.xz *= rk;
    #endif
    vP = w.xyz;
    vC = (inverse(M) * vec4(cameraPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;const FS=`varying vec3 vL, vC, vP, vS; varying vec4 vG; varying float vSeed; uniform float caveLit; ${GLSL3}
  #ifdef ENV
    uniform samplerCube envMap; uniform float envOn;
  #endif
  float lineAA(float d, float w) { float f = fwidth(d) * 1.2; return 1.0 - smoothstep(w - f, w + f, d); }
  void main() {
    vec3 V = normalize(eye - vP), N = normalize(cross(dFdx(vP), dFdy(vP))); if (dot(N, V) < 0.0) N = -N;
    vec3 toC = vC - vL, Nl = normalize(cross(dFdx(vL), dFdy(vL))); if (dot(Nl, toC) < 0.0) Nl = -Nl;
    float ndv = clamp(dot(N, V), 0.0, 1.0), fv = 1.0 - ndv, F = 0.04 + 0.96 * pow(fv, 5.0);
    float w = vS.x, h = vS.y, t = vS.z, R = 0.5 * min(w, t), dist = length(vP - eye);
    vec3 base = vG.rgb; float lit = vG.w, calm = 1.0 - 0.8 * calmAt(-V);
    float sa = atan(vL.z / t, vL.x / w) * SIDES / 6.2831853 + SIDES * 0.25 - 0.5;
    float ea = abs(fract(sa + 0.5) - 0.5) * 6.2831853 * R / SIDES;
    float edge = clamp(lineAA(ea, 0.05 + 0.0015 * dist) + lineAA(abs(vL.y - h), 0.05 + 0.0012 * dist) * step(vL.y, h + 0.6 * R), 0.0, 1.0);
    vec3 rr = refract(normalize(vL - vC), Nl, 0.66);
    vec2 p = vL.xz, q = rr.xz; float A = max(dot(q, q), 1e-4), B = dot(p, q), C = dot(p, p) - R * R;
    float tx = (-B + sqrt(max(B * B - A * C, 0.0))) / A;
    if (rr.y > 1e-3) tx = min(tx, (h + R - vL.y) / rr.y); if (rr.y < -1e-3) tx = min(tx, -vL.y / rr.y);
    tx = clamp(tx, 0.0, 4.0 * R + h);
    float tc = clamp(-B / A, 0.0, tx); float dc = length(p + q * tc) / R;
    vec3 X = vL + rr * tx; float sx = atan(X.z / t, X.x / w) * SIDES / 6.2831853 + SIDES * 0.25 - 0.5;
    float fx = floor(sx + SIDES), fy = floor(X.y / max(R * 3.0, 0.1));
    float b = hash(vec2(fx, fy) + floor(dot(rr, vec3(5.0, 3.0, 7.0)) * 1.5)); b = b * b * b;
    float tri = 1.0 - abs(fract(sx) - 0.5) * 2.0, core = exp(-dc * dc * 4.0);
    vec3 deep = exp(-(1.0 - base) * (tx / max(R, 0.1)) * 0.9);
    float I = 0.05 + (0.06 + 0.55 * b) * (0.4 + 0.6 * tri);
    vec3 c = base * deep * I;
    vec3 glow = base * 1.5 + vec3(0.06, 0.03, 0.08) * core;
    c += glow * lit * calm * (core * 0.55 + 0.05 + 0.45 * b * (0.3 + 0.7 * core)) * (0.4 + 0.6 * exp(-vL.y / max(h, 1.0) * 1.4));
    float shim = exp(-pow((vL.y / max(h, 1.0) - fract(time * 0.11 + vSeed)) * 6.0, 2.0));
    c += glow * lit * calm * shim * (0.3 * core + 0.55 * edge + 0.15 * b);
    vec3 K = normalize(vec3(-0.2, 1.0, 0.45)), Rf = reflect(-V, N);
    float lam = 0.5 + 0.5 * dot(N, K), glint = smoothstep(0.985, 0.998, dot(Rf, K));
    vec3 refl = rimCol * (0.02 + 0.08 * exp(-abs(Rf.y) * 5.0));
    #ifdef ENV
      if (envOn > 0.5) refl = textureCube(envMap, Rf).rgb;
    #endif
    float far = smoothstep(35.0, 90.0, dist); edge *= 1.0 - 0.8 * far;
    c += base * (0.05 + 0.12 * far) * lam * lam + (base * 0.6 + 0.15) * edge * (0.12 + 0.5 * lit) + vec3(0.7) * glint * lam * 0.5 + refl * (0.02 + 0.6 * F);
    c += far * (base * 0.10 * (0.3 + tri) + vec3(0.04, 0.05, 0.09) * pow(fv, 2.0));
    float fog = exp(-dist * 0.006); c = mix(HAZE * (0.5 + 1.1 * caveLit), c, fog);
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;export function crystalMaterial(U,haze="vec3(0.03, 0.019, 0.05)",{hall=false}={}){U.caveLit||={value:0};return new THREE.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS,defines:{SIDES:SIDES.toFixed(1),TIPK:TIP.toFixed(3),HAZE:haze,...hall?{HALL:1}:{},...U.envMap?{ENV:1}:{}}})}
