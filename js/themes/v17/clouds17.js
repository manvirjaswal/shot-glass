import*as THREE from"three";export function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+1831565813|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}export const hashStr=s=>{let h=2166136261;for(const ch of String(s))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0};const NEB_VS=`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;const NEB_FS=`varying vec2 vUv;
  float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
               mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
  float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { s += a * vn(p); p = p * 2.02 + vec3(11.3, 7.1, 3.7); a *= 0.5; } return s / 0.984; }
  void main() {
    float az = (vUv.x - 0.5) * 6.2831853, el = (vUv.y - 0.5) * 3.1415927;
    vec3 d = vec3(cos(el) * sin(az), sin(el), -cos(el) * cos(az)), p = d * 2.4;
    vec3 q = vec3(fbm(p), fbm(p + vec3(5.2, 1.3, 2.8)), fbm(p + vec3(1.7, 9.2, 3.1)));
    float n1 = fbm(p + 2.6 * (q - 0.5));
    vec3 p2 = d * 1.3 + vec3(31.0, 17.0, 5.0);
    float n2 = fbm(p2 + 2.0 * vec3(fbm(p2) - 0.5, fbm(p2 + vec3(4.1, 2.2, 7.7)) - 0.5, 0.0));
    float fil = pow(1.0 - abs(2.0 * fbm(p * 2.3 + 3.0 * (q - 0.5)) - 1.0), 5.0) * smoothstep(0.42, 0.62, n1);
    gl_FragColor = vec4(smoothstep(0.46, 0.74, n1), smoothstep(0.44, 0.76, n2), fil, q.x);
  }`;export function cloudPicture({mips=false}={}){const rt=new THREE.WebGLRenderTarget(1024,512,{magFilter:THREE.LinearFilter,minFilter:mips?THREE.LinearMipmapLinearFilter:THREE.LinearFilter,generateMipmaps:mips,depthBuffer:false,wrapS:THREE.RepeatWrapping});let made=false;return{tex:rt.texture,make(r){if(made||!r)return;const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({vertexShader:NEB_VS,fragmentShader:NEB_FS,depthTest:false,depthWrite:false})),sc=new THREE.Scene;sc.add(quad);const xr=r.xr.enabled,rt0=r.getRenderTarget(),ac=r.autoClear;r.xr.enabled=false;r.autoClear=true;r.setRenderTarget(rt);r.render(sc,new THREE.Camera);r.setRenderTarget(rt0);r.xr.enabled=xr;r.autoClear=ac;quad.geometry.dispose();quad.material.dispose();made=true},dispose(){rt.dispose()}}}export const CLOUDS=`uniform sampler2D nebTex; uniform float nebRot;`;
