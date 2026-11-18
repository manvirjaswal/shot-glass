import*as THREE from"three";import{GLSL3}from"./look3.js";export function createAir(U,n=1600){const pos=new Float32Array(n*3),rnd=new Float32Array(n*4);for(let i=0;i<n;i++){const r=2.5+38*Math.pow(Math.random(),1.7),a=Math.random()*Math.PI*2;pos.set([Math.sin(a)*r,Math.random()*14,-Math.cos(a)*r],i*3);rnd.set([Math.random(),Math.random(),Math.random(),Math.random()],i*4)}const geo=new THREE.BufferGeometry;geo.setAttribute("position",new THREE.BufferAttribute(pos,3));geo.setAttribute("aRnd",new THREE.BufferAttribute(rnd,4));const AU={...U,vh:{value:1e3}};const mat=new THREE.ShaderMaterial({uniforms:AU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`attribute vec4 aRnd; uniform float vh; varying float vA; ${GLSL3}
      void main() {
        vec3 p = position; float ph = aRnd.x * 6.2832, sp = 0.1 + aRnd.y * 0.25;
        p += vec3(sin(time * sp + ph), sin(time * sp * 0.7 + ph * 1.3) * 0.5, cos(time * sp * 0.9 + ph)) * (0.5 + aRnd.z);
        for (int i = 0; i < 4; i++) { if (hitP[i].w < 0.0) continue;
          vec3 d = p - hitP[i].xyz; float L = length(d), age = hitP[i].w, x = (L - age * 14.0) / 3.0;
          p += d / max(L, 0.1) * exp(-x * x) * exp(-age * 2.5) * 2.2; }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        gl_PointSize = clamp((0.035 + 0.05 * aRnd.w) * vh * projectionMatrix[1][1] * 0.5 / max(dist, 0.1), 1.0, 16.0);
        gl_Position = projectionMatrix * mv;
        vA = smoothstep(1.2, 3.0, length(p - eye)) * (1.0 - smoothstep(25.0, 45.0, dist)) * (0.3 + 0.4 * aRnd.y);
      }`,fragmentShader:`uniform vec3 rimCol; varying float vA;
      void main() { vec2 q = gl_PointCoord - 0.5; float d2 = dot(q, q), a = exp(-d2 * 28.0) * (1.0 - smoothstep(0.16, 0.25, d2));
        gl_FragColor = vec4(rimCol * a * vA * 0.5, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});const points=new THREE.Points(geo,mat);points.renderOrder=3;points.frustumCulled=false;return{points,AU}}
