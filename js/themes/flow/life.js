import*as THREE from"three";const FONT="'Hiragino Kaku Gothic StdN', 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif";export const SIGN_WORDS=["ラーメン","居酒屋","薬","本屋","喫茶","カラオケ","酒","うどん","質","たばこ","理容","寿司","焼鳥","パチンコ","営業中","銭湯"];export const BOARD_WORDS=["安全第一","駅","祝 優勝","のりば","入口","工事中","出口","公園","港","注意","ジュース","案内","登山口","立入禁止","市場","祭"];const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));const norm=db=>clamp((db+40)/36);function signAtlas(){const c=document.createElement("canvas");c.width=1024;c.height=768;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,1024,768);x.fillStyle=x.strokeStyle="#000";x.textAlign="center";x.textBaseline="middle";SIGN_WORDS.forEach((w,i)=>{const cx=i*64,ch=[...w],fs=Math.min(46,200/ch.length);x.lineWidth=6;x.strokeRect(cx+4,4,56,248);x.font=`900 ${fs}px ${FONT}`;ch.forEach((g,k)=>x.fillText(g,cx+32,128+(k-(ch.length-1)/2)*fs*1.05))});[...SIGN_WORDS,...BOARD_WORDS].forEach((w,i)=>{const cx=i%4*256,cy=256+Math.floor(i/4)*64;x.lineWidth=6;x.strokeRect(cx+4,cy+4,248,56);x.font=`900 ${Math.min(42,220/[...w].length)}px ${FONT}`;x.fillText(w,cx+128,cy+33)});const t=new THREE.CanvasTexture(c);t.anisotropy=4;t.generateMipmaps=true;return t}function personGeo(){const parts=[[new THREE.CylinderGeometry(.2,.14,1.32,7,1,true).translate(0,.66,0),0],[new THREE.BoxGeometry(.09,.62,.09).translate(.25,.99,0),1],[new THREE.BoxGeometry(.09,.62,.09).translate(-.25,.99,0),2],[new THREE.IcosahedronGeometry(.15,0).translate(0,1.5,0),3]];const pos=[],nor=[],part=[];for(const[g0,k]of parts){const g=g0.index?g0.toNonIndexed():g0;g.computeVertexNormals();pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);for(let i=0;i<g.attributes.position.count;i++)part.push(k);g.dispose();g0.dispose()}const geo=new THREE.InstancedBufferGeometry;geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));geo.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3));geo.setAttribute("aPart",new THREE.Float32BufferAttribute(part,1));return geo}function birdGeo(){const pos=[],aw=[];for(const s of[-1,1])for(const[a,b]of[[0,.5],[.5,1]]){const q=[[a,0],[b,0],[a,1],[b,0],[b,1],[a,1]];for(const[sp,e]of q){pos.push(0,0,0);aw.push(s,sp,e)}}const geo=new THREE.InstancedBufferGeometry;geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));geo.setAttribute("aW",new THREE.Float32BufferAttribute(aw,3));return geo}const inst=(geo,name,arr,n)=>geo.setAttribute(name,new THREE.InstancedBufferAttribute(new Float32Array(arr),n));export function createLife({group,U,GLSL,eye,near=1}){const LU={drums:{value:0},beat:{value:0},bar:{value:0},bass:{value:0},sn:{value:0},snN:{value:0},lt:{value:0},near:{value:near},atlas:{value:signAtlas()}};const PERSON=personGeo(),QUAD=new THREE.PlaneGeometry(1,1),CLOTH=new THREE.PlaneGeometry(1,1,4,4).translate(0,-.5,0);const FRAG_HEAD=`uniform vec3 paper, ink, eye; uniform float inv, draw; ${GLSL}
    vec3 finish(vec3 c, vec3 p) {
      vec3 d = p - eye; c = mix(c, paper, smoothstep(55.0, 170.0, length(d)) * 0.72); c = mix(c, paper, 0.7 * calmAt(normalize(d)));
      return mix(paper, c, smoothstep(0.4, 0.8, draw)); }`;const drawCut=`#ifdef DRAWING
      if (draw < chunk(vP) * 0.5) discard;
    #endif`;function attach(spots,P,g){const uni=()=>({...U,...P,...LU});if(spots.crowd.length){const geo=PERSON.clone(),n=spots.crowd.length/7;geo.instanceCount=n;inst(geo,"aPos",spots.crowd.filter((_,i)=>i%7<4),4);inst(geo,"aRnd",spots.crowd.filter((_,i)=>i%7>=4),3);const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:uni(),vertexShader:`attribute float aPart; attribute vec4 aPos; attribute vec3 aRnd; uniform float drums, beat, bar, near;
          varying vec3 vP, vN; varying float vPart, vY, vTone;
          mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
          void main() {
            vec3 p = position, n = normal; float jumper = step(aRnd.x, 0.55);
            float raise = clamp(drums * 1.8 - aRnd.z * 0.9, 0.0, 1.0);
            if (aPart > 0.5 && aPart < 2.5) { float s = aPart < 1.5 ? 1.0 : -1.0, a = s * mix(0.12, 2.75, raise); vec2 piv = vec2(s * 0.22, 1.3);
              p.xy = piv + rot(a) * (p.xy - piv); n.xy = rot(a) * n.xy; }
            vY = p.y; vPart = aPart; vTone = fract(aRnd.y * 7.31);
            p.x += (1.0 - jumper) * drums * 0.12 * sin(6.2832 * (bar * 2.0 + aRnd.y)) * p.y;
            p.xz = rot(aRnd.y * 6.2832) * p.xz; n.xz = rot(aRnd.y * 6.2832) * n.xz;
            float hop = jumper * drums * 0.4 * sin(3.14159 * fract(beat + aRnd.y * 0.06));
            p *= aPos.w; p.xz /= near;
            vec4 w = modelMatrix * vec4(aPos.xyz + p + vec3(0.0, hop, 0.0), 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * n);
            gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`${FRAG_HEAD} varying vec3 vP, vN; varying float vPart, vY, vTone;
          void main() {
            ${drawCut}
            vec3 N = normalize(vN), V = normalize(eye - vP); float rim = 1.0 - abs(dot(N, V));
            vec3 c = paper;
            if (vPart > 2.5) c = vY > 1.5 && vTone > 0.25 ? ink : paper;
            else if (vTone > 0.7) c = ink;
            else if (vTone > 0.4) { vec2 a = angOf(normalize(vP - eye)) / 0.12; c = mix(paper, ink, hatchLine(a.x + a.y) * 0.6); }
            c = mix(c, ink, smoothstep(0.38, 0.6, rim));
            gl_FragColor = vec4(invert(finish(c, vP), inv), 1.0);
            #include <colorspace_fragment>
          }`}));m.frustumCulled=false;g.add(m)}if(spots.signs.length){const geo=new THREE.InstancedBufferGeometry().copy(QUAD);geo.instanceCount=spots.signs.length/8;const S=spots.signs;inst(geo,"aPos",S.filter((_,i)=>i%8<3),3);inst(geo,"aYaw",S.filter((_,i)=>i%8===3),1);inst(geo,"aSize",S.filter((_,i)=>i%8===4||i%8===5),2);inst(geo,"aCell",S.filter((_,i)=>i%8===6),1);inst(geo,"aRnd",S.filter((_,i)=>i%8===7),1);const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:uni(),side:THREE.DoubleSide,vertexShader:`attribute vec3 aPos; attribute float aYaw, aCell, aRnd; attribute vec2 aSize; uniform float near; varying vec3 vP; varying vec2 vUv; varying float vR;
          void main() {
            vec3 p = vec3(position.x * aSize.x, position.y * aSize.y, 0.0); float c = cos(aYaw), s = sin(aYaw); p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); p.xz /= near;
            vec2 cell = aCell < 15.5 ? vec2(aCell * 64.0, 512.0) : vec2(mod(aCell - 16.0, 4.0) * 256.0, 448.0 - floor((aCell - 16.0) / 4.0) * 64.0);
            vec2 sz = aCell < 15.5 ? vec2(64.0, 256.0) : vec2(256.0, 64.0);
            vUv = (cell + (position.xy + 0.5) * sz) / vec2(1024.0, 768.0); vR = aRnd;
            vec4 w = modelMatrix * vec4(aPos + p, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`${FRAG_HEAD} uniform sampler2D atlas; uniform float sn, snN; varying vec3 vP; varying vec2 vUv; varying float vR;
          void main() {
            ${drawCut}
            float t = texture2D(atlas, vUv).r;
            float flip = step(hash(vec2(vR * 97.0, snN)), 0.4) * step(0.5, sn);
            float rev = abs(step(0.62, vR) - flip);
            vec3 c = mix(ink, paper, mix(t, 1.0 - t, rev));
            gl_FragColor = vec4(invert(finish(c, vP), inv), 1.0);
            #include <colorspace_fragment>
          }`}));m.frustumCulled=false;g.add(m)}if(spots.cloth.length){const geo=new THREE.InstancedBufferGeometry().copy(CLOTH);geo.instanceCount=spots.cloth.length/8;const C=spots.cloth;inst(geo,"aPos",C.filter((_,i)=>i%8<3),3);inst(geo,"aYaw",C.filter((_,i)=>i%8===3),1);inst(geo,"aSize",C.filter((_,i)=>i%8===4||i%8===5),2);inst(geo,"aKind",C.filter((_,i)=>i%8===6),1);inst(geo,"aRnd",C.filter((_,i)=>i%8===7),1);const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:uni(),side:THREE.DoubleSide,vertexShader:`attribute vec3 aPos; attribute float aYaw, aKind, aRnd; attribute vec2 aSize; uniform float bass, lt, near; varying vec3 vP; varying vec2 vUv; varying float vK, vR;
          void main() {
            vec2 q = position.xy; vec3 p; float ph = aRnd * 6.2832, gust = 0.04 + bass;
            if (aKind > 2.5) {
              float u = q.x + 0.5, a = sin(lt * 1.9 + ph) * (0.1 + 0.6 * bass) * u;
              p = vec3(u * aSize.x * cos(a), (q.y + 0.5) * aSize.y, u * aSize.x * sin(a) + sin(u * 7.0 - lt * 7.0 + ph) * 0.12 * u * aSize.x * gust);
            } else {
              float a = (0.05 + 0.55 * bass) * (0.65 + 0.35 * sin(lt * 2.4 + ph)), y = q.y * aSize.y;
              p = vec3(q.x * aSize.x, y * cos(a), -y * sin(a) + sin(q.x * 5.0 + lt * 5.0 + ph) * 0.06 * gust * -q.y);
            }
            float c = cos(aYaw), s = sin(aYaw); p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); p.xz /= near;
            vUv = uv; vK = aKind; vR = aRnd;
            vec4 w = modelMatrix * vec4(aPos + p, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`${FRAG_HEAD} varying vec3 vP; varying vec2 vUv; varying float vK, vR;
          void main() {
            ${drawCut}
            vec2 u = vUv; float dn = 1.0 - u.y;
            float inside = 1.0, edge;
            if (vK < 0.5) inside = step(abs(u.x - 0.5), 0.27) + step(dn, 0.32);
            else if (vK > 1.5 && vK < 2.5) inside = step(abs(u.x - 0.5) * 2.0, 1.0 - dn);
            if (inside < 0.5) discard;
            vec2 fw = fwidth(u) * 1.6;
            edge = vK > 1.5 && vK < 2.5 ? step(1.0 - dn - abs(u.x - 0.5) * 2.0, fw.x * 3.0) : 0.0;
            edge = max(edge, max(step(min(u.x, 1.0 - u.x), fw.x), step(min(u.y, 1.0 - u.y), fw.y)));
            if (vK < 0.5) edge = max(edge, step(abs(abs(u.x - 0.5) - 0.27), fw.x) * step(0.32, dn) + step(abs(dn - 0.32), fw.y) * step(0.27, abs(u.x - 0.5)));
            float fill = fract(vR * 5.3);
            vec3 c = fill > 0.72 ? ink : paper;
            if (fill > 0.45 && fill <= 0.72) c = mix(paper, ink, step(0.5, fract((u.x + u.y) * 6.0)) * 0.8);
            c = mix(c, ink, edge);
            gl_FragColor = vec4(invert(finish(c, vP), inv), 1.0);
            #include <colorspace_fragment>
          }`}));m.frustumCulled=false;g.add(m)}}const NB=34,BU={...U,...LU,inv:{value:0},fc:{value:new THREE.Vector3(0,60,-60)},flap:{value:0},show:{value:0}};const bgeo=birdGeo(),off=[];for(let i=0;i<NB;i++)off.push(Math.random()*2-1,Math.random(),Math.random()*2-1);inst(bgeo,"aOff",off,3);bgeo.instanceCount=NB;const birds=new THREE.Mesh(bgeo,new THREE.ShaderMaterial({uniforms:BU,side:THREE.DoubleSide,vertexShader:`attribute vec3 aW, aOff; uniform vec3 fc, eye; uniform float lt, flap, show; varying vec3 vP;
      void main() {
        float ang = lt * (0.16 + 0.08 * aOff.x) + aOff.y * 6.2832, R1 = 4.0 + 6.0 * abs(aOff.x);
        vec3 c = fc + vec3(cos(ang) * R1, aOff.z * 2.6 + sin(ang * 2.0) * 0.6, sin(ang) * R1 * 0.6);
        vec3 toEye = normalize(eye - c), right = normalize(cross(vec3(0.0, 1.0, 0.0), toEye));
        float f = sin(lt * 9.0 + aOff.y * 40.0) * flap, a1 = 0.18 + 0.75 * f, a2 = a1 - 0.5 * f - 0.25;
        vec2 elbow = 0.55 * vec2(cos(a1), sin(a1)), tip = elbow + 0.55 * vec2(cos(a2), sin(a2));
        vec2 p = aW.y <= 0.5 ? mix(vec2(0.0), elbow, aW.y * 2.0) : mix(elbow, tip, aW.y * 2.0 - 1.0);
        p.y -= aW.z * 0.16 * (1.0 - aW.y);
        vec3 w = c + (right * p.x * aW.x + vec3(0.0, p.y, 0.0)) * 1.25 * show;
        vP = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`,fragmentShader:`uniform vec3 paper, ink, eye; uniform float inv; varying vec3 vP; ${GLSL}
      void main() { vec3 c = mix(ink, paper, 0.75 * calmAt(normalize(vP - eye))); gl_FragColor = vec4(invert(c, inv), 1.0);
        #include <colorspace_fragment>
      }`}));birds.frustumCulled=false;birds.renderOrder=3;group.add(birds);let songRef=null,rngD=[0,1],rngB=[0,1],drumsS=0,bassS=0,pS=.4,pPrev=.4,flapS=0,azS=null,secI=-1,azT=30;const rel=(v,r)=>clamp((v-r[0])/(r[1]-r[0]));const rangeOf=(song,k)=>{const v=(song.curve?.[k]||[]).map(norm).filter(a=>a>.02).sort((a,b)=>a-b);return v.length>20?[v[Math.floor(v.length*.1)],Math.max(v[Math.floor(v.length*.1)]+.08,v[Math.floor(v.length*.97)])]:[0,1]};return{attach,debug:()=>({drums:+LU.drums.value.toFixed(2),bass:+LU.bass.value.toFixed(2),sn:+LU.sn.value.toFixed(2),flap:+BU.flap.value.toFixed(2),birdsY:+BU.fc.value.y.toFixed(1)}),update(ctx,skyInv,hideBirds){const{dt,now,song,active}=ctx;if(song&&song!==songRef){songRef=song;rngD=rangeOf(song,"drums");rngB=rangeOf(song,"bass");secI=-1}const d=active&&song?rel(ctx.drums,rngD):0,b=active&&song?rel(ctx.bass,rngB):0;drumsS+=(d-drumsS)*(1-Math.exp(-dt*(d>drumsS?12:3)));bassS+=(b-bassS)*(1-Math.exp(-dt*(b>bassS?14:6)));LU.drums.value=drumsS;LU.bass.value=bassS;LU.beat.value=ctx.beatPhase;LU.bar.value=ctx.barPhase;LU.lt.value+=dt;if(ctx.snared){LU.sn.value=1;LU.snN.value=(LU.snN.value+1)%997}else LU.sn.value*=Math.exp(-dt*6);const m=song?.melody;let has=false,pn=pS;if(active&&m?.midi){const i=Math.floor(now*(m.rate||10)),v=m.midi[i],c=m.conf?m.conf[i]:1;if(v!=null&&c>.35){has=true;pn=clamp((v-(m.lo-4))/Math.max(4,m.hi-m.lo+8))}}pPrev=pS;pS+=(pn-pS)*(1-Math.exp(-dt*2.5));const climb=dt>0?Math.abs(pS-pPrev)/dt:0;flapS+=(clamp(climb*3+(has?.2:0))-flapS)*(1-Math.exp(-dt*4));BU.flap.value=flapS;const secs=song?.styledSections||[];let si=-1;for(let k=0;k<secs.length;k++)if(now>=secs[k].start)si=k;if(si!==secI){secI=si;azT=(si%2?1:-1)*(24+si*37%19);if(azS===null)azS=azT}azS+=(azT-azS)*(1-Math.exp(-dt*.4));const el=(24+13*pS)*Math.PI/180,az=azS*Math.PI/180,D=72;BU.fc.value.set(Math.sin(az)*Math.cos(el)*D,eye()+Math.sin(el)*D,-Math.cos(az)*Math.cos(el)*D);BU.show.value+=((active&&!hideBirds?1:0)-BU.show.value)*(1-Math.exp(-dt*3));BU.inv.value=skyInv},dispose(){PERSON.dispose();QUAD.dispose();CLOTH.dispose();LU.atlas.value.dispose();bgeo.dispose();birds.material.dispose()}}}
