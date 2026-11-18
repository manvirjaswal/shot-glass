import*as THREE from"three";import{GLSL3,chordCol,slotOf}from"../v3/look3.js";import{chordAt}from"../../analysis.js";import{cloudPicture,hashStr,CLOUDS,rng}from"./clouds17.js";import{createWaves,partLit,WATER_SKY}from"../v16/water16.js";const DEG=Math.PI/180,STREAK_GOLD=new THREE.Color(1,.8,.32);const SWEEP=180,BLEND=40;const EQ=64,NBAND=48;export const RINGS=24;const PG=45,WF_UP=5,WF_N=512,EQ_SPAN=70,EQ_LOW=.4,PART_UP=4,PART_W=14,PART_FLOOR=.025;const PARTS=[[0,0,8],[-32,8,18],[32,18,30],[-64,30,44],[64,44,64]];const AURORA_FUNCS=`uniform sampler2D nzTex, wfTex; uniform float eqA, eqPa, eqP[5], pgT, eqV4; uniform float aLit, hzAge, hzKick; uniform vec3 hzOld, hzNew, a1P0, a1P1, a1P2; uniform float a1Two; uniform vec4 a1G[3], a1H[3], a1V[3]; uniform float a1N;
  uniform float skW, skF, skFK, skL, aT, aE, hzEq; uniform vec4 skP[4];
  vec3 a1pal(float x) { x = clamp(x, 0.0, 1.0); return x < 0.5 ? mix(a1P0, a1P1, x * 2.0) : mix(a1P1, a1P2, x * 2.0 - 1.0); }
  float eqAt(float adeg) { float a = abs(adeg), q = 0.0; for (int i = -2; i <= 2; i++) { vec4 e = texture2D(eqTex, vec2(clamp((a + 2.0 * float(i)) / ${EQ_SPAN.toFixed(1)}, 0.0, 1.0) * 0.98 + 0.01, 0.5)); q += 0.22 * sqrt(e.r) + 2.4 * e.g; }
    return q / 5.0 + 0.5 * min(hzKick, 1.5) * (1.0 - smoothstep(12.0, 40.0, a)); }
  float partAt(float adeg) { float s = 0.0, w = 0.0, k;
    ${PARTS.map(([c],i)=>`k = exp(-pow((adeg - (${c.toFixed(1)})) / ${PART_W.toFixed(1)}, 2.0)) + 1e-4; s += k * eqP[${i}]; w += k;`).join(" ")}
    return s / w; }
  vec3 chordAtDeg(float adeg) { float front = hzAge * ${SWEEP.toFixed(1)}; return mix(hzOld, hzNew, 1.0 - smoothstep(front - ${BLEND.toFixed(1)}, front, 180.0 - abs(adeg))); }
  float upOf(float h, float tall) { float hp = max(h, 0.0), r = clamp(hp / tall, 0.0, 1.0);
    float crisp = (1.0 - smoothstep(0.62 * tall, tall, hp)) * mix(1.0, 0.45, r), soft = (1.0 - smoothstep(0.2 * tall, 1.25 * tall, hp)) * mix(1.0, 0.55, r);
    return mix(exp(-hp / (tall * 0.5)), mix(crisp, soft, eqV4), eqA); }
  float pgIn(float adeg) { float s = (adeg + ${PG.toFixed(1)}) / ${(2*PG).toFixed(1)}; return smoothstep(0.0, 0.05, s) * (1.0 - smoothstep(0.95, 1.0, s)); }
  vec3 pgV4(float adeg) { if (eqV4 < 0.01 || pgT < 0.0) return vec3(0.0);
    float s = (adeg + ${PG.toFixed(1)}) / ${(2*PG).toFixed(1)}, ap = ${(-PG).toFixed(1)} + ${(2*PG).toFixed(1)} * pgT;
    return vec3(1.0 - smoothstep(pgT - 0.02, pgT + 0.02, s), exp(-pow((adeg - ap) / 5.0, 2.0)), eqV4 * pgIn(adeg)); }
  float pgLit(vec3 P) { return 1.0 + P.z * (0.2 * P.x - 0.15 * (1.0 - P.x) + 0.7 * P.y); }
  float pgHem(vec3 P) { return P.z * (1.2 * P.x + 0.12 * (1.0 - P.x) + 3.0 * P.y); }
  float wfAt(float adeg) { float s = (adeg + ${PG.toFixed(1)}) / ${(2*PG).toFixed(1)}; return texture2D(wfTex, vec2(clamp(s, 0.0, 1.0), 0.5)).r * pgIn(adeg); }
  vec3 sat3(vec3 c) { return max(mix(vec3(dot(c, vec3(0.333))), c, 1.25), 0.0); }
  vec3 hueRot(vec3 c, float a) { vec3 k = vec3(0.57735); float ca = cos(a); return max(c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca), 0.0); }
  float nzA(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return texture2D(nzTex, (i + f + 0.5) / 512.0).r; }
  vec3 auroraAt(float az, float el, vec4 L) {
    float adeg = degrees(az), wk = skW, tsp = 1.0 + 1.5 * wk, sg = 0.0, fl = 0.0; vec3 c = vec3(0.0);
    for (int i = 0; i < 4; i++) { vec4 P = skP[i]; float age = time - P.y; if (age < 0.0 || age > 2.4) continue;
      float d = abs(mod(adeg - P.x + 180.0, 360.0) - 180.0), front = age * 75.0;
      sg += P.z * exp(-pow((d - front) / (10.0 + 8.0 * age), 2.0)) * exp(-age * 1.1) * smoothstep(0.0, 0.08, age); }
    if (skF >= 0.0) { float age = time - skF, sw = -190.0 + age * 300.0; fl = skFK * exp(-pow((adeg - sw) / 30.0, 2.0)) * smoothstep(0.0, 0.08, age) * exp(-age * 0.5); }
    for (int k = 0; k < 3; k++) { if (float(k) >= a1N) break; vec4 G = a1G[k], H = a1H[k], V = a1V[k]; float fk = float(k);
      float da = abs(mod(adeg - H.x + 180.0, 360.0) - 180.0), win = (0.18 + 0.4 * wk) + (0.82 - 0.4 * wk) * exp(-pow(da / H.y, 2.0));
      win = mix(win, max(win, 0.55 * (1.0 - smoothstep(60.0, 90.0, abs(adeg)))), eqA);
      float u = az * G.y + fk * 7.3, base = mix(G.x, 0.45 * G.x, smoothstep(45.0, 110.0, abs(adeg))), vt = aT * V.w;
      float bend = nzA(vec2(az * 1.4 + fk * 5.3, vt * 0.05 + fk * 2.0)) - 0.32, tilt = clamp((adeg - H.x) / 70.0, -1.0, 1.0);
      base += V.x * bend * (bend > 0.0 ? 1.6 : 0.6) + V.y * tilt; base = mix(base, max(${EQ_LOW.toFixed(2)} * base, 4.0), eqA);
      float fold = H.z * (0.45 + 0.8 * nzA(vec2(az * 1.8 + fk * 9.0 + 4.0, vt * 0.035))), q = eqA * min(mix(eqAt(adeg), partAt(adeg), eqPa), 1.3) * mix(1.0, 0.55 + 0.6 * aLit, eqV4), wf = k == 0 ? eqA * (1.0 - eqV4) : 0.0;
      vec3 pv = k == 0 ? pgV4(adeg) : vec3(0.0);
      fold *= 1.0 - 0.4 * (k == 0 ? eqA : 0.0) * pgIn(adeg);
      float foot = base + fold * (nzA(vec2(u, aT * 0.025 * tsp + fk * 3.1)) - 0.5) + 0.35 * fold * (nzA(vec2(u * 3.7 + 2.0, aT * 0.04 * tsp)) - 0.5) + wf * ${WF_UP.toFixed(1)} * wfAt(adeg) + eqPa * ${PART_UP.toFixed(1)} * q;
      float tall = mix((6.0 + 30.0 * L.y * G.w) * (0.7 + 0.6 * nzA(vec2(az * 2.3 + fk * 3.0 + 9.0, vt * 0.04))) * (1.0 + 1.0 * wk + 0.6 * fl), (4.0 + 40.0 * q) * (1.0 + 0.5 * wk) * (1.0 + 0.6 * pv.z * pv.y), eqA), h = el - foot, edge = smoothstep(-1.1, 0.15, h), up = upOf(h, tall);
      float rays = 0.25 + 1.5 * pow(nzA(vec2(az * G.z + fk * 11.0, aT * 0.06 * tsp)), 2.4);
      float hw = H.w + V.z * 2.0 * (nzA(vec2(az * 1.9 + fk * 4.0 + 17.0, vt * 0.035 + fk)) - 0.5); hw = 1.0 - abs(1.0 - mod(hw + 2.0, 2.0));
      vec3 chd = chordAtDeg(adeg);
      vec3 lc = mix(mix(a1pal(hw), chd, 0.9 * eqA), hueRot(mix(a1pal(hw + 0.45 + 0.4 * wk), mix(chd, vec3(1.0), 0.15), 0.9 * eqA), a1Two), smoothstep(0.0, tall * 0.5, h)) * L.x * 0.5 * aE * (1.0 + 2.2 * wk + 3.5 * sg + 2.0 * fl) * (1.0 - 0.6 * eqA + 1.5 * q) * pgLit(pv) + vec3(0.004, 0.01, 0.008);
      lc = sat3(lc); lc = mix(lc, vec3(dot(lc, vec3(0.45)) * 1.2), 0.3 * pv.z * pv.y);
      lc = mix(lc, vec3(1.0, 0.82, 0.4) * dot(lc, vec3(0.5)) * 2.0, 0.6 * fl * smoothstep(0.2 * tall, 0.9 * tall, h));
      lc = mix(lc, vec3(dot(lc, vec3(0.6))) + vec3(0.04 * skL), min(0.55, 0.18 * sg + 0.4 * skL));
      vec3 pale = mix(lc, vec3(dot(lc, vec3(0.4))), 0.3);
      c += (lc * edge * up * rays + pale * (exp(-h * h / 0.7) * 1.3 + pgHem(pv) * exp(-h * h / 1.4))) * win * (1.0 - 0.3 * fk); }
    float co = smoothstep(0.45, 1.1, wk);
    if (co > 0.0) c += a1pal(fract(adeg / 140.0 + 0.2)) * co * 0.3 * pow(nzA(vec2(az * 9.0, time * 0.2 * tsp)), 2.2) * smoothstep(26.0, 80.0, el) * (0.6 + 0.4 * sin(el * 0.2 - time * 2.0));
    return c;
  }
  vec3 fogAt(float az, float el, vec4 L, out float dens) {
    vec4 nb = textureLod(nebTex, vec2(fract((az + nebRot + aT * 0.004) / 6.2831853 + 0.5), 0.5 + el / 90.0), 3.0);
    vec4 nf = textureLod(nebTex, vec2(fract((az * 2.0 - nebRot - aT * 0.007) / 6.2831853 + 0.5), 0.5 + el / 60.0), 2.0);
    dens = (0.75 * nb.g + 0.6 * nb.r + 0.35 * nf.g) * smoothstep(-1.0, 2.0, el) * exp(-max(el, 0.0) / 13.0);
    float pl = 0.0, ad = degrees(az);
    for (int i = 0; i < 4; i++) { vec4 P = skP[i]; float age = time - P.y; if (age < 0.0 || age > 1.8) continue;
      vec2 q = vec2(abs(mod(ad - P.x + 180.0, 360.0) - 180.0), el - P.w); float dd = length(q), front = age * 90.0;
      pl += P.z * exp(-pow((dd - front) / ((6.0 + 10.0 * age) * (0.7 + 0.35 * P.z)), 2.0)) * exp(-age * 1.6) * smoothstep(0.0, 0.05, age); }
    vec3 pc = mix(vec3(1.0, 0.8, 0.42), vec3(1.0, 0.97, 0.9), smoothstep(0.8, 2.2, pl));
    return (a1pal(0.75) * L.x * 0.46 + vec3(0.016, 0.022, 0.036) + pc * pl * 0.6 + vec3(0.75, 0.82, 0.9) * skL * 0.22) * dens * 1.5;
  }
  vec3 horizonAt(float y, float az) {
    float ang = abs(degrees(az)), front = hzAge * ${SWEEP.toFixed(1)}, k = 1.0 - smoothstep(front - ${BLEND.toFixed(1)}, front, 180.0 - ang);
    vec3 col = mix(mix(hzOld, hzNew, k), a1pal(0.5) * 0.7, eqA);
    float ahead = mix(0.55, 1.0, smoothstep(25.0, 55.0, ang)), eq = sqrt(texture2D(eqTex, vec2(ang / 180.0, 0.5)).r) * ahead * hzEq;
    float cell = ang / 3.0, cx = abs(fract(cell) - 0.5), ce = texture2D(eqTex, vec2((floor(cell) + 0.5) * 3.0 / 180.0, 0.5)).r * ahead * hzEq;
    float barH = 0.12 * ce, bar = (1.0 - smoothstep(0.24, 0.36, cx)) * (1.0 - smoothstep(0.8 * barH, barH, y)) * (0.25 + 0.75 * (1.0 - y / max(barH, 1e-3)));
    float line = exp(-y * 120.0), glow = exp(-y * 30.0 / (1.0 + 5.0 * eq)), wide = exp(-y * 7.0 / (1.0 + 1.5 * eq));
    return col * (line * (0.05 + 0.05 * aLit) * (0.7 + 1.2 * eq) * (1.0 + 1.2 * hzKick * (1.0 - eqA)) + glow * (0.015 + 0.03 * aLit) * (0.4 + 3.2 * eq)
                  + wide * (0.005 + 0.016 * eq) + bar * step(0.0005, barH) * (0.05 + 0.05 * aLit) * (0.6 + 1.2 * ce));
  }
  vec4 passiveL(float az) {
    vec2 c = vec2(cos(az), sin(az));
    float surge = nzA(c * 2.4 + vec2(aT * 0.03, 3.0 - aT * 0.017)), act = 0.22 + 0.78 * smoothstep(0.3, 0.85, surge);
    return vec4(act, 0.2 + 0.65 * nzA(c * 3.1 + vec2(5.0, aT * 0.011)), 0.0, 0.0);
  }
`;export const SKY_W=1536,SKY_H=384;export const AURORA_SKY=AURORA_FUNCS+`uniform sampler2D skyA, skyF, colTex; uniform float skyOn;
  float footAt(float adeg) { return texture2D(colTex, vec2(adeg / 360.0 + 0.5, 0.5 / 9.0)).r; }
  vec3 progAt(float az, float el) {
    float adeg = degrees(az); if (eqA < 0.01 || eqV4 > 0.99 || pgT < 0.0 || abs(adeg) > ${(PG+2).toFixed(1)}) return vec3(0.0);
    float s = (adeg + ${PG.toFixed(1)}) / ${(2*PG).toFixed(1)}, d = abs(el - footAt(adeg)), px = max(fwidth(el), 0.01), ends = smoothstep(0.0, 0.012, s) * (1.0 - smoothstep(0.988, 1.0, s));
    float core = 1.0 - smoothstep(0.05, 0.05 + 1.5 * px, d), glow = exp(-d * d / 0.3), played = 1.0 - smoothstep(pgT, pgT + 0.004, s);
    float ap = ${(-PG).toFixed(1)} + ${(2*PG).toFixed(1)} * pgT, dd = length(vec2((adeg - ap) * cos(radians(el)), el - footAt(ap)));
    float dot = 1.0 - smoothstep(0.32, 0.32 + 1.5 * px, dd), halo = exp(-dd * dd / 1.1);
    return vec3(0.9, 0.95, 1.0) * eqA * (1.0 - eqV4) * ((core * 0.5 + glow * 0.07) * mix(0.14, 1.0, played) * ends + dot * 1.8 + halo * 0.3);
  }
  vec3 auroraSky(vec3 d, float calm) {
    float az = atan(d.x, -d.z), el = degrees(asin(clamp(d.y, -1.0, 1.0))), y = max(d.y, 0.0), dens, cf = calm > 0.0 ? 1.0 - 0.6 * calm * calmAt(d) : 1.0, op = openDir(d);
    vec3 a, f;
    if (skyOn > 0.5) { vec2 uv = vec2(az / 6.2831853 + 0.5, (0.5 + clamp(el / 90.0, 0.0, 1.0) * ${SKY_H-1}.0) / ${SKY_H}.0); vec4 F = texture2D(skyF, vec2(uv.x, clamp(el / 90.0, 0.0, 1.0)));
      a = texture2D(skyA, uv).rgb * (1.0 - 0.5 * min(F.a, 1.0)); f = F.rgb; }
    else { vec4 L = passiveL(az); f = fogAt(az, el, L, dens); a = auroraAt(az, el, L) * (1.0 - 0.5 * min(dens, 1.0)); }
    return a * cf * mix(0.25, 1.0, op) + f * mix(0.4, 1.0, op) + vec3(0.007, 0.011, 0.022) * exp(-y * 3.5) + horizonAt(y, az) + (skyOn > 0.5 ? progAt(az, el) * cf : vec3(0.0));
  }`;const BAKE_VS=`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`;const COL_W=4096;const colsFS=()=>`varying vec2 vUv; ${GLSL3} ${CLOUDS} ${WATER_SKY} ${EQ_HEAD} ${AURORA_FUNCS}
  void main() { float az = (vUv.x - 0.5) * 6.2831853, row = floor(vUv.y * 9.0), k = floor(row / 3.0), j = row - 3.0 * k;
    if (k >= a1N) { gl_FragColor = vec4(0.0); return; }
    vec4 L = passiveL(az); float adeg = degrees(az), wk = skW, tsp = 1.0 + 1.5 * wk, sg = 0.0, fl = 0.0;
    for (int i = 0; i < 4; i++) { vec4 P = skP[i]; float age = time - P.y; if (age < 0.0 || age > 2.4) continue;
      float d = abs(mod(adeg - P.x + 180.0, 360.0) - 180.0), front = age * 75.0;
      sg += P.z * exp(-pow((d - front) / (10.0 + 8.0 * age), 2.0)) * exp(-age * 1.1) * smoothstep(0.0, 0.08, age); }
    if (skF >= 0.0) { float age = time - skF, sw = -190.0 + age * 300.0; fl = skFK * exp(-pow((adeg - sw) / 30.0, 2.0)) * smoothstep(0.0, 0.08, age) * exp(-age * 0.5); }
    vec4 G = k < 0.5 ? a1G[0] : k < 1.5 ? a1G[1] : a1G[2], H = k < 0.5 ? a1H[0] : k < 1.5 ? a1H[1] : a1H[2], V = k < 0.5 ? a1V[0] : k < 1.5 ? a1V[1] : a1V[2]; float fk = k;
    float da = abs(mod(adeg - H.x + 180.0, 360.0) - 180.0), win = (0.18 + 0.4 * wk) + (0.82 - 0.4 * wk) * exp(-pow(da / H.y, 2.0));
    win = mix(win, max(win, 0.55 * (1.0 - smoothstep(60.0, 90.0, abs(adeg)))), eqA);
    float u = az * G.y + fk * 7.3, base = mix(G.x, 0.45 * G.x, smoothstep(45.0, 110.0, abs(adeg))), vt = aT * V.w;
    float bend = nzA(vec2(az * 1.4 + fk * 5.3, vt * 0.05 + fk * 2.0)) - 0.32, tilt = clamp((adeg - H.x) / 70.0, -1.0, 1.0);
    base += V.x * bend * (bend > 0.0 ? 1.6 : 0.6) + V.y * tilt; base = mix(base, max(${EQ_LOW.toFixed(2)} * base, 4.0), eqA);
    float fold = H.z * (0.45 + 0.8 * nzA(vec2(az * 1.8 + fk * 9.0 + 4.0, vt * 0.035))), q = eqA * min(mix(eqAt(adeg), partAt(adeg), eqPa), 1.3) * mix(1.0, 0.55 + 0.6 * aLit, eqV4), wf = k < 0.5 ? eqA * (1.0 - eqV4) : 0.0;
    vec3 pv = k < 0.5 ? pgV4(adeg) : vec3(0.0);
    fold *= 1.0 - 0.4 * (k < 0.5 ? eqA : 0.0) * pgIn(adeg);
    float foot = base + fold * (nzA(vec2(u, aT * 0.025 * tsp + fk * 3.1)) - 0.5) + 0.35 * fold * (nzA(vec2(u * 3.7 + 2.0, aT * 0.04 * tsp)) - 0.5) + wf * ${WF_UP.toFixed(1)} * wfAt(adeg) + eqPa * ${PART_UP.toFixed(1)} * q;
    float tall = mix((6.0 + 30.0 * L.y * G.w) * (0.7 + 0.6 * nzA(vec2(az * 2.3 + fk * 3.0 + 9.0, vt * 0.04))) * (1.0 + 1.0 * wk + 0.6 * fl), (4.0 + 40.0 * q) * (1.0 + 0.5 * wk) * (1.0 + 0.6 * pv.z * pv.y), eqA);
    float rays = 0.25 + 1.5 * pow(nzA(vec2(az * G.z + fk * 11.0, aT * 0.06 * tsp)), 2.4);
    float hw = H.w + V.z * 2.0 * (nzA(vec2(az * 1.9 + fk * 4.0 + 17.0, vt * 0.035 + fk)) - 0.5); hw = 1.0 - abs(1.0 - mod(hw + 2.0, 2.0));
    vec3 chd = chordAtDeg(adeg);
    float M = L.x * 0.5 * aE * (1.0 + 2.2 * wk + 3.5 * sg + 2.0 * fl) * (1.0 - 0.6 * eqA + 1.5 * q) * pgLit(pv);
    if (j < 0.5) gl_FragColor = vec4(foot, tall, rays, win * (1.0 - 0.3 * fk));
    else if (j < 1.5) { vec3 c = sat3(mix(a1pal(hw), chd, 0.9 * eqA) * M); gl_FragColor = vec4(mix(c, vec3(dot(c, vec3(0.45)) * 1.2), 0.3 * pv.z * pv.y), min(0.55, 0.18 * sg + 0.4 * skL)); }
    else { vec3 c = sat3(hueRot(mix(a1pal(hw + 0.45 + 0.4 * wk), mix(chd, vec3(1.0), 0.15), 0.9 * eqA), a1Two) * M); gl_FragColor = vec4(mix(c, vec3(dot(c, vec3(0.45)) * 1.2), 0.3 * pv.z * pv.y), fl); }
  }`;const curtainsFS=()=>`varying vec2 vUv; uniform sampler2D colTex; ${GLSL3} ${CLOUDS} ${WATER_SKY} ${EQ_HEAD} ${AURORA_FUNCS}
  void main() { float az = (vUv.x - 0.5) * 6.2831853, el = (vUv.y * ${SKY_H}.0 - 0.5) / ${SKY_H-1}.0 * 90.0; vec3 c = vec3(0.0);
    for (int k = 0; k < 3; k++) { if (float(k) >= a1N) break;
      vec4 A = texture2D(colTex, vec2(vUv.x, (float(k * 3) + 0.5) / 9.0)), B = texture2D(colTex, vec2(vUv.x, (float(k * 3) + 1.5) / 9.0)), C = texture2D(colTex, vec2(vUv.x, (float(k * 3) + 2.5) / 9.0));
      float h = el - A.x, tall = A.y, edge = smoothstep(-1.1, 0.15, h), up = upOf(h, tall);
      vec3 lc = mix(B.rgb, C.rgb, smoothstep(0.0, tall * 0.5, h)) + vec3(0.004, 0.01, 0.008);
      lc = mix(lc, vec3(1.0, 0.82, 0.4) * dot(lc, vec3(0.5)) * 2.0, 0.6 * C.a * smoothstep(0.2 * tall, 0.9 * tall, h));
      lc = mix(lc, vec3(dot(lc, vec3(0.6))) + vec3(0.04 * skL), B.a);
      vec3 pale = mix(lc, vec3(dot(lc, vec3(0.4))), 0.3);
      float hem = k == 0 ? pgHem(pgV4(degrees(az))) : 0.0;
      c += (lc * edge * up * A.z + pale * (exp(-h * h / 0.7) * 1.3 + hem * exp(-h * h / 1.4))) * A.w; }
    float wk = skW, co = smoothstep(0.45, 1.1, wk), adeg = degrees(az);
    if (co > 0.0) c += a1pal(fract(adeg / 140.0 + 0.2)) * co * 0.3 * pow(nzA(vec2(az * 9.0, time * 0.2 * (1.0 + 1.5 * wk))), 2.2) * smoothstep(26.0, 80.0, el) * (0.6 + 0.4 * sin(el * 0.2 - time * 2.0));
    gl_FragColor = vec4(c, 1.0); }`;const fogFS=()=>`varying vec2 vUv; ${GLSL3} ${CLOUDS} ${WATER_SKY} ${EQ_HEAD} ${AURORA_FUNCS}
  void main() { float az = (vUv.x - 0.5) * 6.2831853, el = vUv.y * 90.0, dens; vec4 L = passiveL(az); vec3 f = fogAt(az, el, L, dens); gl_FragColor = vec4(f, dens); }`;export const PALETTES=[["#c8ec13","#8bf042","#9af4a2"],["#6dec13","#42f051","#9af4d6"],["#13ec13","#42f099","#9af4f4"],["#13ec6d","#42f0d3","#9addf4"],["#13ecb6","#42f07c","#b0f49a"],["#13e5ec","#42f0b6","#9af4b0"],["#1daeed","#4cebf0","#9af4d6"],["#8455f1","#cf84f5","#f49aec"],["#af4cf0","#f47bf4","#f49ace"],["#de42f0","#f471cd","#f49ab5"],["#ef39cb","#dc68f3","#bf9af4"],["#ef3994","#f3688f","#f49aa0"]],PW=[.08,.08,.12,.08,.08,.08,.08,.08,.08,.08,.08,.08];export const PALETTE_W=PW;const nightKey=song=>song?song.title||song.slug||String(song.duration):"menu";const nightSlot=key=>{let x=rng(hashStr(key)^6670)(),i=0;while(i<PW.length-1&&x>PW[i])x-=PW[i++];return i};export function turnFor(song){const h=song?.harmony;if(!h)return 0;let home=-1;if(h.key&&h.key.r>=.6)home=h.key.tonic+(h.key.mode==="minor"?12:0);else{const w=new Float32Array(24);for(const c of h.chords||[])if(c.c>=0)w[c.c]+=c.t1-c.t0;let best=0;for(let i=0;i<24;i++)if(w[i]>w[best])best=i;if(w[best]>0)home=best}return home<0?0:nightSlot(nightKey(song))-slotOf(home)}export const EQ_HEAD=`uniform sampler2D eqTex;`;export function createEq(){const pix=new Uint8Array(EQ*4),tex=new THREE.DataTexture(pix,EQ,1,THREE.RGBAFormat);tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.needsUpdate=true;const fast=new Float32Array(NBAND),top=new Float32Array(NBAND).fill(.2),slow=new Float32Array(NBAND);return{tex,feed:null,dispose:()=>tex.dispose(),update(dt,spectrum){const sp=this.feed||spectrum||null,kF=1-Math.exp(-dt*18),kD=1-Math.exp(-dt*4),kS=1-Math.exp(-dt/.6);for(let b=0;b<NBAND;b++){const v=sp?sp[b]||0:0;fast[b]+=(v-fast[b])*(v>fast[b]?kF:kD);top[b]=Math.max(top[b]*Math.exp(-dt*.08),fast[b],.15);slow[b]+=(fast[b]-slow[b])*kS}let all=.15;for(let b=0;b<NBAND;b++)all=Math.max(all,top[b]*(1+.5*b/NBAND));for(let i=0;i<EQ;i++){const bf=(i+.5)/EQ*(NBAND-1),b0=Math.floor(bf),b1=Math.min(NBAND-1,b0+1),f=bf-b0;const lv=(fast[b0]*(1-f)+fast[b1]*f)*(1+.5*bf/NBAND)/all;pix[i*4]=255*Math.min(1,lv*lv);const pn=Math.max(0,(fast[b0]-slow[b0])*(1-f)+(fast[b1]-slow[b1])*f)/all;pix[i*4+1]=255*Math.min(1,2.5*pn)}tex.needsUpdate=true}}}export const AURORA_RINGS=`uniform vec4 gr[${RINGS}]; uniform vec3 gc[${RINGS}]; uniform float grN;
  vec3 goldRings(vec2 p, inout vec2 sl) {
    vec3 g = vec3(0.0);
    for (int i = 0; i < ${RINGS}; i++) { if (float(i) >= grN) break; vec4 G = gr[i]; float age = time - G.z; if (age < 0.0 || age > 3.0) continue;
      vec2 q = p - G.xy; float dq = length(q), px = fwidth(dq), fade = (1.0 - smoothstep(1.6, 3.0, age)) * smoothstep(0.0, 0.04, age);
      float R1 = 9.0 * G.w * (1.0 - exp(-age * 1.15)), R2 = R1 * 0.78, R3 = R1 * 0.6, w = (0.012 + 0.01 * age) * (0.6 + 0.4 * G.w);
      if (dq > R1 + 1.0 || dq < R3 - 0.2) continue;
      float l1 = 1.0 - smoothstep(w, w + 1.5 * px, abs(dq - R1)), l2 = 1.0 - smoothstep(w * 0.7, w * 0.7 + 1.5 * px, abs(dq - R2)), l3 = 1.0 - smoothstep(w * 0.5, w * 0.5 + 1.5 * px, abs(dq - R3));
      float halo = exp(-pow((dq - R1) / (0.12 + 0.05 * age), 2.0));
      g += gc[i] * (l1 * 1.4 + l2 * 0.75 + l3 * 0.45 + halo * 0.12) * fade * exp(-age * 0.5);
      sl += q / max(dq, 1e-3) * (l1 - 0.5 * l2) * fade * 0.02; }
    return g;
  }`;export function createAurora(U,FU,night){const group=new THREE.Group,W=createWaves(FU),pic=cloudPicture({mips:true}),EQT=createEq();const wfPix=new Uint8Array(WF_N*4),wfTex=new THREE.DataTexture(wfPix,WF_N,1,THREE.RGBAFormat);wfTex.magFilter=wfTex.minFilter=THREE.LinearFilter;const waveOf=song=>{const D=song?.duration||1,mix=song?.curve?.mix,rate=song?.curveRate||10,v=new Float32Array(WF_N);for(let i=0;i<WF_N;i++){const t0=i/WF_N*D,t1=(i+1)/WF_N*D;if(mix?.length){let m=0,n=0;for(let j=Math.floor(t0*rate);j<=Math.min(mix.length-1,Math.ceil(t1*rate));j++,n++)m+=mix[j]||0;v[i]=n?m/n:0}else v[i]=(song?.sections||[]).find(x=>t0>=x.start&&t0<x.end)?.energy??.3}let sm=v;for(let pass2=0;pass2<3;pass2++){const o=new Float32Array(WF_N);for(let i=0;i<WF_N;i++){let a=0;for(let j=-5;j<=5;j++)a+=sm[Math.max(0,Math.min(WF_N-1,i+j))];o[i]=a/11}sm=o}const top=[...sm].sort((a,b)=>a-b)[Math.floor(WF_N*.97)]||1;for(let i=0;i<WF_N;i++)wfPix[i*4]=Math.round(255*Math.min(1,sm[i]/top));wfTex.needsUpdate=true};let eqA=0,eqPa=0,eqV4=0,twoK=0,twoA=0;const partPk=PARTS.map(()=>PART_FLOOR),partS=PARTS.map(()=>0);let gi=0;const ring=(p,col,size=1)=>{const i=gi++%RINGS;FU.gr.value[i].set(p.x,p.z,FU.time.value,size);FU.gc.value[i].copy(col);FU.grN.value=Math.min(RINGS,gi)};const goldRing=(p,col=STREAK_GOLD)=>{const T=FU.time.value,i=FU.gr.value.findIndex((G,k)=>k>=FU.grN.value||T-G.z>1.6);if(i<0)return;FU.gr.value[i].set(p.x,p.z,T,1);FU.gc.value[i].copy(col);FU.grN.value=Math.max(FU.grN.value,i+1)};let wake=0,pi=0;const nightOf=key=>{const r=rng(hashStr(key)^6670);r();const i=nightSlot(key);FU.a1P0.value.set(PALETTES[i][0]);FU.a1P1.value.set(PALETTES[i][1]);FU.a1P2.value.set(PALETTES[i][2]);const n=r()<.55?2:3;FU.a1N.value=n;for(let k=0;k<3;k++){FU.a1G.value[k].set(15+9*r()+4*k,3+6*r(),90+120*r(),.6+.8*r());FU.a1H.value[k].set((r()-.5)*70,40+50*r(),3+8*r(),r())}const v=rng(hashStr(key)^24301);for(let k=0;k<3;k++)FU.a1V.value[k].set(5+5*v(),(v()-.5)*12,.2+.22*v(),.7+.7*v());const tw=rng(hashStr(key)^2016);twoA=key!=="menu"&&tw()<.55?(tw()<.5?-1:1)*(100+80*tw())*DEG:0};nightOf("menu");const sky=new THREE.Mesh(new THREE.SphereGeometry(185,64,32),new THREE.ShaderMaterial({uniforms:FU,side:THREE.BackSide,depthWrite:false,vertexShader:`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`varying vec3 vW; ${GLSL3} ${CLOUDS} ${WATER_SKY} ${EQ_HEAD} ${AURORA_SKY}
      void main() { vec3 d = normalize(vW - eye);
        vec3 c = d.y >= 0.0 ? auroraSky(d, 1.0) : d.y > -0.035 ? auroraSky(vec3(d.x, -d.y, d.z), 0.0) * (1.0 - smoothstep(0.0, 0.035, -d.y)) : vec3(0.0);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`}));sky.renderOrder=-6;sky.frustumCulled=false;group.add(sky);const rtOf=(w,h)=>{const r=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,depthBuffer:false,magFilter:THREE.LinearFilter,minFilter:THREE.LinearFilter,generateMipmaps:false});r.texture.wrapS=THREE.RepeatWrapping;r.texture.wrapT=THREE.ClampToEdgeWrapping;return r};const rtA=rtOf(SKY_W,SKY_H),rtF=rtOf(SKY_W/4,SKY_H/4),rtC=rtOf(COL_W,9),bakeCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1),quad=new THREE.PlaneGeometry(1,1);rtC.texture.minFilter=rtC.texture.magFilter=THREE.LinearFilter;const pass=fs=>{const sc=new THREE.Scene,m=new THREE.Mesh(quad,new THREE.ShaderMaterial({uniforms:FU,vertexShader:BAKE_VS,fragmentShader:fs,depthTest:false,depthWrite:false}));m.frustumCulled=false;sc.add(m);return sc};FU.colTex={value:rtC.texture};FU.skyA={value:rtA.texture};FU.skyF={value:rtF.texture};FU.skyOn={value:0};const bakeC=pass(colsFS()),bakeA=pass(curtainsFS()),bakeF=pass(fogFS());let bakeOk=null;const bake=r=>{if(bakeOk===null)bakeOk=!!(r.capabilities.isWebGL2&&(r.extensions.has("EXT_color_buffer_float")||r.extensions.has("EXT_color_buffer_half_float")));if(!bakeOk){FU.skyOn.value=0;return}const xr=r.xr.enabled,rt0=r.getRenderTarget(),ac=r.autoClear;r.xr.enabled=false;r.autoClear=true;r.setRenderTarget(rtC);r.render(bakeC,bakeCam);r.setRenderTarget(rtA);r.render(bakeA,bakeCam);r.setRenderTarget(rtF);r.render(bakeF,bakeCam);r.setRenderTarget(rt0);r.xr.enabled=xr;r.autoClear=ac;FU.skyOn.value=1};let songRef,lit=.3,chNow=-1,hzAge=9;const old=new THREE.Color,cA=new THREE.Color;const newChord=col=>{const run=hzAge*SWEEP/(180+BLEND);FU.hzOld.value.copy(run>=1?FU.hzNew.value:old.copy(FU.hzOld.value).lerp(FU.hzNew.value,Math.min(1,run)));FU.hzNew.value.copy(col);hzAge=0};return{group,envMeshes:[sky],shellAt(){return null},gunfire:"impact",recoil:1.35,charge:false,splash(p,size,speed){W.splash(p,size,speed);return true},water:W.water,land(p,strong,mini,col){W.land(p,strong,mini);if(mini==="streak")goldRing(p);return true},nightCols:()=>[FU.a1P0.value,FU.a1P1.value,FU.a1P2.value],shotWater(p,c,hard){W.land(p,false,hard?"shot":true);return true},event(n,d){const T=FU.time.value;if(n==="perfect"&&d.pos)FU.skP.value[pi++%4].set(Math.atan2(d.pos.x,-d.pos.z)/DEG,T,.6+2.2*(d.k||0),Math.asin(Math.max(-1,Math.min(1,(d.pos.y-U.eye.value.y)/Math.max(1,d.pos.distanceTo(U.eye.value)))))/DEG);if(n==="chain"){FU.skF.value=T;FU.skFK.value=.7}if(n==="drop"){FU.skF.value=T;FU.skFK.value=.8+.5*(d.k||0);FU.hzKick.value=Math.max(FU.hzKick.value,2.4);FU.skL.value=Math.max(FU.skL.value,1.3)}if(n==="perfect"){FU.hzKick.value=Math.max(FU.hzKick.value,.5+1.6*(d.k||0));FU.skL.value=Math.max(FU.skL.value,.25+.95*(d.k||0))}},sink:{drag:1.5,v:-3,at:1,over:1.8,dim:.6,dimFade:.35,glow:1,fade:.2,through:true},update({dt,now,song,part,secIdx,kicked,kGain,spectrum,renderer,play,energyK=1,eq="classic",dark=0}){FU.aT.value+=dt*(.4+.6*energyK);FU.aE.value=(.65+.35*energyK)*(1-.9*dark);pic.make(renderer);FU.waterF.value=2;FU.eqTex.value=EQT.tex;FU.wSheen.value.setRGB(.03,.09,.06);FU.nebTex.value=pic.tex;FU.nzTex.value=night.nzTex.value;EQT.update(dt,song?spectrum:null);const V4=eq==="v4"||eq==="v5"||eq==="v6";eqA+=(((eq==="aurora"||eq==="parts"||V4)&&song?1:0)-eqA)*(1-Math.exp(-dt*4));FU.eqA.value=eqA;FU.hzEq.value=1-eqA;eqPa+=(((eq==="parts"||V4)&&song?1:0)-eqPa)*(1-Math.exp(-dt*4));FU.eqPa.value=eqPa;eqV4+=((V4&&song?1:0)-eqV4)*(1-Math.exp(-dt*4));FU.eqV4.value=eqV4;twoK+=((eq==="v6"&&song?1:0)-twoK)*(1-Math.exp(-dt*4));FU.a1Two.value=twoA*twoK;FU.wfTex.value=wfTex;FU.pgT.value=song?Math.max(0,Math.min(1,now/(song.duration||1))):-1;if(song!==songRef){waveOf(song);songRef=song;chNow=-1;gi=0;FU.grN.value=0;FU.skF.value=-1;for(const P of FU.skP.value)P.y=-99;nightOf(nightKey(song));FU.nebRot.value=song?hashStr(song.title||song.slug||song.duration)%360*DEG:0}const ch=song?.harmony?chordAt(song.harmony,now):-1;if(ch>=0&&ch!==chNow){const col=chordCol(ch);if(chNow<0){FU.hzOld.value.copy(col);FU.hzNew.value.copy(col);hzAge=9}else newChord(col);chNow=ch}if(!song){cA.copy(U.chord.value);FU.hzOld.value.copy(cA);FU.hzNew.value.copy(cA)}hzAge+=dt;FU.hzAge.value=hzAge;if(kicked&&song)FU.hzKick.value=Math.max(FU.hzKick.value,(kGain??.6)*energyK);FU.hzKick.value*=Math.exp(-dt*9);{const d=EQT.tex.image.data;PARTS.forEach(([,a,b],i)=>{let p=0,l=0;for(let t=a;t<b;t++){p+=d[t*4+1]/255;l+=Math.sqrt(d[t*4]/255)}p/=b-a;l/=b-a;partPk[i]=Math.max(p,partPk[i]*Math.exp(-dt/3),PART_FLOOR);const v=.1+.15*l+.45*p/partPk[i]+(i===0?.25*Math.min(FU.hzKick.value,1.5):0);partS[i]+=(v-partS[i])*(1-Math.exp(-dt*(v>partS[i]?12:3)));FU.eqP.value[i]=partS[i]})}lit+=(partLit(part)-lit)*(1-Math.exp(-dt*1.5));FU.aLit.value=lit*(1-.9*dark);W.part(song,secIdx,now,U.platR.value,energyK);{const kS=.85*(play?.chainK||0);wake+=(kS-wake)*(1-Math.exp(-dt*(kS>wake?2.5:.55)));FU.skW.value=wake}FU.skL.value*=Math.exp(-dt*5);W.step(renderer,dt);if(renderer)bake(renderer)},debug:()=>({...W.debug(),lit:+lit.toFixed(2),chord:chNow,hzAge:+hzAge.toFixed(2),kick:+FU.hzKick.value.toFixed(2),wake:+wake.toFixed(2)}),eq:EQT,bake:r=>bake(r),heights:r=>W.heights(r),parts:()=>[["sky",[sky]]],dispose(){W.dispose();EQT.dispose();wfTex.dispose();pic.dispose();sky.geometry.dispose();sky.material.dispose();rtA.dispose();rtF.dispose();rtC.dispose();quad.dispose();for(const sc of[bakeC,bakeA,bakeF])sc.children[0].material.dispose()}}}
