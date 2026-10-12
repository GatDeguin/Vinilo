/* SURCO Studio: dependency-free WebGL2 renderer, physically inspired GGX shading.
   Procedural geometry, procedural assets, PCF shadows. Not ray tracing. */
'use strict';
const StudioMath=(()=>{
 const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>mul(a,1/(Math.hypot(...a)||1));
 const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
 function mm(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
 function matrix(p=[0,0,0],r=[0,0,0],s=[1,1,1]){const [x,y,z]=r,cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);const rx=new Float32Array([1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1]),ry=new Float32Array([cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1]),rz=new Float32Array([cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1]);const m=mm(ry,mm(rz,rx));for(let j=0;j<3;j++)for(let i=0;i<3;i++)m[j*4+i]*=s[j];m[12]=p[0];m[13]=p[1];m[14]=p[2];return m;}
 function view(eye,at){const z=norm(sub(eye,at)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
 function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
 function ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);}
 function point(m,p){const x=p[0],y=p[1],z=p[2];return[m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14],m[3]*x+m[7]*y+m[11]*z+m[15]];}
 function normalMat(m){const a=[m[0],m[1],m[2]],b=[m[4],m[5],m[6]],c=[m[8],m[9],m[10]],d=dot(a,cross(b,c))||1;return new Float32Array([...mul(cross(b,c),1/d),...mul(cross(c,a),1/d),...mul(cross(a,b),1/d)]);}
 return{add,sub,mul,dot,cross,norm,I,mm,matrix,view,perspective,ortho,point,normalMat};
})();
const StudioGeo=(()=>{
 const {norm,cross,sub,mul,add}=StudioMath;
 const empty=()=>({p:[],n:[],u:[],i:[]});
 function vertex(g,p,n,u){g.p.push(...p);g.n.push(...n);g.u.push(...u);return g.p.length/3-1;}
 function box(w,h,d,rad=0){const g=empty(),sizes=[w/2,h/2,d/2];for(let ax=0;ax<3;ax++)for(const sign of [-1,1]){const a=(ax+1)%3,b=(ax+2)%3;const steps=rad?[-1,-.97,-.88,-.72,0,.72,.88,.97,1]:[-1,1];const N=steps.length,base=g.p.length/3;for(let j=0;j<N;j++)for(let k=0;k<N;k++){let p=[0,0,0];p[ax]=sizes[ax]*sign;p[a]=steps[k]*sizes[a];p[b]=steps[j]*sizes[b];let n=[0,0,0];n[ax]=sign;if(rad){const q=p.map((v,i)=>Math.max(-sizes[i]+rad,Math.min(sizes[i]-rad,v)));n=norm(sub(p,q));p=add(q,mul(n,rad));}vertex(g,p,n,ax===1?[p[0]/w+.5,.5-p[2]/d]:[(steps[k]+1)/2,(steps[j]+1)/2]);}for(let j=0;j<N-1;j++)for(let k=0;k<N-1;k++){const v=base+j*N+k;const q=[v,v+1,v+N,v+1,v+N+1,v+N];if(sign<0)q.reverse();g.i.push(...q);}}return g;}
 function cylinder(r=1,h=1,n=96){const g=empty();for(let j=0;j<=n;j++){const a=j/n*Math.PI*2,x=Math.cos(a),z=Math.sin(a);vertex(g,[x*r,-h/2,z*r],[x,0,z],[j/n,0]);vertex(g,[x*r,h/2,z*r],[x,0,z],[j/n,1]);if(j<n){let i=j*2;g.i.push(i,i+1,i+2,i+1,i+3,i+2);}}for(const sign of [-1,1]){const center=vertex(g,[0,sign*h/2,0],[0,sign,0],[.5,.5]);for(let j=0;j<=n;j++){const a=j/n*Math.PI*2,x=Math.cos(a),z=Math.sin(a);vertex(g,[x*r,sign*h/2,z*r],[0,sign,0],[.5+x*.5,.5-z*.5]);if(j<n){const k=center+1+j;if(sign>0)g.i.push(center,k+1,k);else g.i.push(center,k,k+1);}}}return g;}
 function torus(R,r,n=96,m=8){const g=empty();for(let j=0;j<=n;j++){const u=j/n*Math.PI*2;for(let k=0;k<=m;k++){const v=k/m*Math.PI*2,c=Math.cos(v),s=Math.sin(v);vertex(g,[(R+r*c)*Math.cos(u),r*s,(R+r*c)*Math.sin(u)],[c*Math.cos(u),s,c*Math.sin(u)],[j/n,k/m]);if(j<n&&k<m){const a=j*(m+1)+k;g.i.push(a,a+m+1,a+1,a+1,a+m+1,a+m+2);}}}return g;}
 function tube(points,r=.045,n=16){const g=empty();for(let j=0;j<points.length;j++){const t=norm(sub(points[Math.min(j+1,points.length-1)],points[Math.max(0,j-1)])),a=norm(cross(t,Math.abs(t[1])>.95?[1,0,0]:[0,1,0])),b=cross(t,a);for(let k=0;k<=n;k++){const u=k/n*Math.PI*2,nn=add(mul(a,Math.cos(u)),mul(b,Math.sin(u)));vertex(g,add(points[j],mul(nn,r)),nn,[k/n,j/(points.length-1)]);if(j<points.length-1&&k<n){const p=j*(n+1)+k;g.i.push(p,p+1,p+n+1,p+1,p+n+2,p+n+1);}}}return g;}
 function merge(items){const g=empty();for(const [src,mat] of items){const base=g.p.length/3,nm=StudioMath.normalMat(mat);for(let k=0;k<src.p.length;k+=3){g.p.push(...StudioMath.point(mat,src.p.slice(k,k+3)).slice(0,3));const a=src.n[k],b=src.n[k+1],c=src.n[k+2];g.n.push(...norm([nm[0]*a+nm[3]*b+nm[6]*c,nm[1]*a+nm[4]*b+nm[7]*c,nm[2]*a+nm[5]*b+nm[8]*c]));}g.u.push(...src.u);g.i.push(...src.i.map(v=>v+base));}return g;}
 return{box,cylinder,torus,tube,merge};
})();
class SurcoStudio{
 constructor(canvas,{onAction,onReady,reduced=false,quality='auto'}={}){
  this.canvas=canvas;this.onAction=onAction||(()=>{});this.reduced=reduced;this.quality=quality;this.nodes=[];this.meshes=[];this.textures=[];this.recordAngle=0;this.rpm=33.333;this.spin=0;this.playing=false;this.stage='sleeved';this.progress=0;this.motion=null;this.armAngle=0;this.drag=null;this.camYaw=.34;this.top=false;this.mouse=[0,0];this.lastTime=0;this.idleFrames=0;this.currentArt=null;this.destroyed=false;this.stats={frames:0,drawCalls:0,callbacks:0};this.visible=true;this.raf=0;this.events=new AbortController();this.cameraPose=[.72,.34];this.cameraVelocity=[0,0];this.cameraActive=false;this.recordSpring=null;this.loop=this.loop.bind(this);
  const gl=this.gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'default',preserveDrawingBuffer:false});if(!gl)throw Error('WebGL2 no está disponible.');this.initGL();this.buildScene();this.arm.p[1]=1.90;this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.bind();this.wake();onReady?.();
 }
 initGL(){const g=this.gl;
  const vertex=`#version 300 es
  precision highp float;layout(location=0)in vec3 aPos;layout(location=1)in vec3 aNormal;layout(location=2)in vec2 aUV;
  uniform mat4 uModel,uVP,uLightVP;uniform mat3 uNormal;out vec3 vPos,vN,vLocal,vT;out vec2 vUV;out vec4 vShadow;
  void main(){vec4 w=uModel*vec4(aPos,1.);vPos=w.xyz;vN=normalize(uNormal*aNormal);vT=uNormal*vec3(-aPos.z,0.,aPos.x);vUV=aUV;vLocal=aPos;vShadow=uLightVP*w;gl_Position=uVP*w;}`;
  const fragment=`#version 300 es
  precision highp float;in vec3 vPos,vN,vLocal,vT;in vec2 vUV;in vec4 vShadow;out vec4 outColor;
  uniform vec3 uEye,uColor;uniform float uMetal,uRough,uAlpha,uEmission;uniform int uPattern,uUseMap,uReceiveShadow;uniform sampler2D uMap,uShadow;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
  float shadow(vec3 N,vec3 L){vec3 p=vShadow.xyz/vShadow.w*.5+.5;if(p.z>1.||p.z<0.||p.x<0.||p.x>1.||p.y<0.||p.y>1.)return 1.;float bias=max(.0011*(1.-dot(N,L)),.00035);vec2 texel=1./vec2(textureSize(uShadow,0));float s=0.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(uShadow,p.xy+vec2(float(x),float(y))*texel).r;s+=(p.z-bias<=d)?1.:.21;}return s/9.;}
  vec3 brdf(vec3 N,vec3 V,vec3 L,vec3 base,float rough,float metal,vec3 light){vec3 H=normalize(V+L);float nl=max(dot(N,L),0.),nv=max(dot(N,V),.001),nh=max(dot(N,H),0.),hv=max(dot(H,V),0.);float a=rough*rough,a2=a*a;float den=nh*nh*(a2-1.)+1.;float D=a2/(3.14159265*den*den+.00001);float k=(rough+1.)*(rough+1.)/8.;float G=nv/(nv*(1.-k)+k)*nl/(nl*(1.-k)+k);vec3 F0=mix(vec3(.04),base,metal);vec3 F=F0+(1.-F0)*pow(1.-hv,5.);vec3 spec=D*G*F/(4.*nv*nl+.001);return ((1.-F)*(1.-metal)*base/3.14159265+spec)*light*nl;}
  vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
  void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uEye-vPos);vec3 base=pow(uColor,vec3(2.2));float rough=uRough;
    if(uUseMap==1){vec4 tex=texture(uMap,vUV);base*=pow(tex.rgb,vec3(2.2));}
    if(uPattern==1){float warp=sin(vPos.x*.85)*.032+noise(vec2(vPos.x*1.9,vPos.y*5.))*.035;float grain=noise(vec2(vPos.x*.55,(vPos.y+warp)*78.));float fine=noise(vec2(vPos.x*12.,vPos.y*520.));base*=mix(vec3(.63,.54,.43),vec3(1.10,1.08,1.02),grain)+fine*.12;rough+=grain*.07;}
    if(uPattern==2&&abs(N.y)>.2){float radius=length(vLocal.xz);float w=fwidth(radius*2150.);float grooves=sin(radius*2150.)*.5/(1.+w*w)+.5;float modulation=sin(radius*237.+sin(radius*37.));base*=.64+.12*grooves+.10*modulation;rough=clamp(rough+grooves*.045,.1,.8);vec2 dir=normalize(vLocal.xz+.0001);N=normalize(N+vec3(dir.x,0.,dir.y)*(grooves-.5)*.025);}
    if(uPattern==3){base*=.91+.09*hash(vec2(floor(vPos.x*950.),floor(vPos.z*6.)));}
    vec3 L=normalize(vec3(-3.,8.,5.)-vPos);float sh=uReceiveShadow==1?shadow(N,L):1.;if(uPattern==4){outColor=vec4(uColor*(.78+.22*sh),1.);return;}vec3 c=brdf(N,V,L,base,rough,uMetal,vec3(3.7,3.25,2.8))*sh;if(uPattern==2&&abs(N.y)>.2){vec3 T=normalize(vT+vec3(.00001));float streak=pow(max(0.,1.-abs(dot(T,normalize(L+V)))),8.);float band=.82+.18*sin(length(vLocal.xz)*115.);c+=vec3(.04,.046,.054)*streak*band;}
    c+=brdf(N,V,normalize(vec3(4.,6.,-4.)-vPos),base,rough,uMetal,vec3(1.8,1.94,2.15));
    c+=brdf(N,V,normalize(vec3(6.,3.,6.)-vPos),base,rough,uMetal,vec3(.7,.65,.55));
    vec3 R=reflect(-V,N);vec3 env=mix(vec3(.16,.13,.105),vec3(.58,.62,.68),smoothstep(-.1,.9,R.y));
    float card=pow(max(dot(R,normalize(vec3(-.6,.9,.4))),0.),mix(160.,7.,rough));env+=vec3(1.6,1.5,1.3)*card;
    float strip=pow(max(dot(R,normalize(vec3(.5,.3,-.5))),0.),mix(180.,12.,rough));env+=vec3(.8,.9,1.)*strip;
    vec3 f0=mix(vec3(.04),base,uMetal);vec3 F=f0+(1.-f0)*pow(1.-max(dot(N,V),0.),5.);c+=env*F*(1.-rough*.55);c+=base*(1.-uMetal)*(.23+.15*max(N.y,0.));c+=base*uEmission;
    float ao=1.-.13*exp(-max(vPos.y,0.)*3.);c*=ao;outColor=vec4(pow(aces(c),vec3(1./2.2)),uAlpha);
  }`;
  const shadowV=`#version 300 es
  precision highp float;layout(location=0)in vec3 aPos;uniform mat4 uModel,uVP;void main(){gl_Position=uVP*uModel*vec4(aPos,1.);}`;
  const shadowF=`#version 300 es
  precision highp float;void main(){}`;
  this.program=this.programOf(vertex,fragment);this.shadowProgram=this.programOf(shadowV,shadowF);
  this.loc={};for(const n of ['uModel','uVP','uLightVP','uNormal','uEye','uColor','uMetal','uRough','uAlpha','uEmission','uPattern','uUseMap','uReceiveShadow','uMap','uShadow'])this.loc[n]=g.getUniformLocation(this.program,n);
  this.sloc={model:g.getUniformLocation(this.shadowProgram,'uModel'),vp:g.getUniformLocation(this.shadowProgram,'uVP')};
  this.shadowSize=1024;this.depth=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.depth);g.texImage2D(g.TEXTURE_2D,0,g.DEPTH_COMPONENT24,this.shadowSize,this.shadowSize,0,g.DEPTH_COMPONENT,g.UNSIGNED_INT,null);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);this.fbo=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.TEXTURE_2D,this.depth,0);g.drawBuffers([g.NONE]);g.readBuffer(g.NONE);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('No se pudo crear el mapa de sombras.');g.bindFramebuffer(g.FRAMEBUFFER,null);
  this.white=this.textureFrom(this.makeCanvas(2,2,c=>{c.fillStyle='#fff';c.fillRect(0,0,2,2);}));g.enable(g.DEPTH_TEST);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);g.disable(g.CULL_FACE);
  this.lightVP=StudioMath.mm(StudioMath.ortho(-8.5,8.5,-7.5,7.5,.5,25),StudioMath.view([-3,8,5],[0,.2,0]));
 }
 programOf(v,f){const g=this.gl,compile=(type,s)=>{const sh=g.createShader(type);g.shaderSource(sh,s);g.compileShader(sh);if(!g.getShaderParameter(sh,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(sh));return sh;};const p=g.createProgram(),vs=compile(g.VERTEX_SHADER,v),fs=compile(g.FRAGMENT_SHADER,f);g.attachShader(p,vs);g.attachShader(p,fs);g.linkProgram(p);g.deleteShader(vs);g.deleteShader(fs);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));return p;}
 makeCanvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),c);return c;}
 textureFrom(img){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,img);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.generateMipmap(g.TEXTURE_2D);this.textures.push(t);return t;}
 updateTexture(t,img){const g=this.gl;g.bindTexture(g.TEXTURE_2D,t);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,img);g.generateMipmap(g.TEXTURE_2D);}
 mesh(geo){const g=this.gl,vao=g.createVertexArray();g.bindVertexArray(vao);const buffers=[];[geo.p,geo.n,geo.u].forEach((data,i)=>{const b=g.createBuffer();buffers.push(b);g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,new Float32Array(data),g.STATIC_DRAW);g.enableVertexAttribArray(i);g.vertexAttribPointer(i,i===2?2:3,g.FLOAT,false,0,0);});const ib=g.createBuffer();buffers.push(ib);g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,ib);g.bufferData(g.ELEMENT_ARRAY_BUFFER,new Uint32Array(geo.i),g.STATIC_DRAW);g.bindVertexArray(null);const m={vao,count:geo.i.length,buffers};this.meshes.push(m);return m;}
 mat(color,metal=0,rough=.5,extra={}){if(typeof color==='string'&&color.length===4)color='#'+color.slice(1).split('').map(x=>x+x).join('');const rgb=typeof color==='string'?color.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255):color;return{color:rgb,metal,rough,alpha:1,emission:0,pattern:0,texture:null,...extra};}
 node(mesh,mat,p=[0,0,0],r=[0,0,0],s=[1,1,1],parent=null){const n={mesh,mat,p,r,s,parent,visible:true,shadow:true,receive:true,world:StudioMath.I()};this.nodes.push(n);return n;}
 group(p=[0,0,0],r=[0,0,0]){return this.node(null,null,p,r);}
 buildScene(){const G=StudioGeo,M=StudioMath;const cyl=this.mesh(G.cylinder()),box=(w,h,d,b=0)=>this.mesh(G.box(w,h,d,b));
  const wood=this.mat('#765136',0,.44,{pattern:1}),rubber=this.mat('#141719',.05,.67),black=this.mat('#181b1d',.65,.32,{pattern:3}),silver=this.mat('#c5c8ca',.97,.26,{pattern:3}),chrome=this.mat('#d7dbde',1,.16),brass=this.mat('#a48246',.83,.31),cream=this.mat('#d4ccb8',.05,.7);
  this.node(box(70,.1,70),this.mat('#e9e5dc',0,.95,{pattern:4}),[0,-.19,0]).shadow=false;
  const shadowCanvas=this.makeCanvas(256,256,c=>{const grad=c.createRadialGradient(128,128,12,128,128,128);grad.addColorStop(0,'rgba(20,14,10,.45)');grad.addColorStop(.45,'rgba(20,14,10,.24)');grad.addColorStop(1,'rgba(20,14,10,0)');c.fillStyle=grad;c.fillRect(0,0,256,256);});
  // Four real isolation feet.
  for(const x of [-2.42,2.52])for(const z of [-1.67,1.67]){this.node(cyl,rubber,[x,.05,z],[0,0,0],[.38,.28,.38]);this.node(cyl,silver,[x,.20,z],[0,0,0],[.33,.11,.33]);}
  this.node(box(6.55,.73,4.56,.12),wood,[.15,.61,0]);this.node(box(6.57,.09,4.58,.04),rubber,[.15,.987,0]);this.node(box(6.58,.15,4.59,.055),silver,[.15,1.055,0]);this.node(box(6.24,.025,4.30,.04),black,[.15,1.145,0]);
  this.platter=this.group([-.65,1.25,-.10]);
  this.node(cyl,silver,[0,0,0],[0,0,0],[1.93,.22,1.93],this.platter);
  for(const y of [-.065,0,.065])this.node(this.mesh(G.torus(1.925,.014,144,6)),black,[0,y,0],[0,0,0],[1,1,1],this.platter);
  const marks=[];for(let j=0;j<112;j++){const a=j/112*Math.PI*2;marks.push([G.box(.032,.025,.012),M.matrix([Math.sin(a)*1.932,.025,Math.cos(a)*1.932],[0,a,0])]);}this.node(this.mesh(G.merge(marks)),chrome,[0,0,0],[0,0,0],[1,1,1],this.platter);
  this.node(cyl,rubber,[-.65,1.385,-.10],[0,0,0],[1.86,.07,1.86]);
  for(let r=.4;r<1.8;r+=.35)this.node(this.mesh(G.torus(r,.007,100,5)),rubber,[-.65,1.427,-.10]);
  this.node(cyl,chrome,[-.65,1.55,-.10],[0,0,0],[.041,.30,.041]);this.node(cyl,silver,[-.65,1.46,-.10],[0,0,0],[.12,.035,.12]);
  // Sleeve and movable record are actual independent 3D objects.
  this.sleeve=this.group([-4.65,1.85,-.8],[-.12,.18,-.04]);this.sleeve.shadow=true;
  this.node(box(3.73,3.73,.068,.025),cream,[0,0,0],[0,0,0],[1,1,1],this.sleeve);
  this.coverMat=this.mat('#ffffff',0,.85);this.cover=this.node(box(3.69,3.69,.004),this.coverMat,[0,0,.039],[0,0,0],[1,1,1],this.sleeve);
  this.record=this.group([-4.47,1.85,-.89],[Math.PI/2-.12,.18,-.04]);this.recordDisk=this.node(cyl,this.mat('#181b20',.35,.22,{pattern:2}),[0,0,0],[0,0,0],[1.78,.035,1.78],this.record);
  this.node(this.mesh(G.torus(1.779,.012,160,6)),this.mat('#292d30',.5,.22),[0,0,0],[0,0,0],[1,1,1],this.record);
  this.labelMat=this.mat('#ffffff',.0,.8);this.node(cyl,this.labelMat,[0,.024,0],[0,0,0],[.555,.012,.555],this.record);this.node(cyl,this.mat('#17191a',.4,.35),[0,.034,0],[0,0,0],[.05,.018,.05],this.record);
  // Tonearm assembly, bearing, gimbal, curved polished tube and cartridge.
  this.node(cyl,black,[2.46,1.26,-1.34],[0,0,0],[.4,.24,.4]);this.node(cyl,chrome,[2.46,1.44,-1.34],[0,0,0],[.26,.2,.26]);this.node(this.mesh(G.torus(.25,.036,48,10)),brass,[2.46,1.56,-1.34]);
  this.arm=this.group([2.46,1.58,-1.34]);
  this.node(this.mesh(G.tube([[0,.03,-.5],[0,.03,0],[-.1,.03,.4],[-.12,.03,1.3],[.08,.03,1.86],[.05,.03,2.48]],.055,20)),chrome,[0,0,0],[0,0,0],[1,1,1],this.arm);
  this.node(cyl,black,[0,.03,-.49],[Math.PI/2,0,0],[.23,.39,.23],this.arm);for(const z of [-.66,-.48,-.31])this.node(this.mesh(G.torus(.226,.008,48,5)),silver,[0,.03,z],[Math.PI/2,0,0],[1,1,1],this.arm);
  this.node(box(.26,.10,.40,.02),black,[.045,.014,2.45],[0,-.1,0],[1,1,1],this.arm);this.node(box(.20,.12,.20,.01),this.mat('#9a4633',.2,.3),[.045,-.09,2.53],[0,-.1,0],[1,1,1],this.arm);this.node(this.mesh(G.tube([[.04,-.15,2.5],[.04,-.24,2.58]],.012,6)),chrome,[0,0,0],[0,0,0],[1,1,1],this.arm);
  this.node(this.mesh(G.tube([[.15,.02,2.50],[.34,.10,2.51],[.41,.13,2.61]],.022,8)),silver,[0,0,0],[0,0,0],[1,1,1],this.arm);
  this.node(cyl,black,[2.5,1.31,.73],[0,0,0],[.12,.36,.12]);this.node(box(.22,.11,.11,.02),rubber,[2.5,1.54,.73]);
  // Physical controls, bolts and plate.
  this.startPos=[-2.53,1.20,1.7];this.node(cyl,chrome,this.startPos,[0,0,0],[.28,.12,.28]);this.node(cyl,black,[-2.53,1.27,1.7],[0,0,0],[.22,.07,.22]);this.ledMat=this.mat('#a7a883',.1,.5);this.node(cyl,this.ledMat,[-2.53,1.314,1.7],[0,0,0],[.055,.013,.055]);
  this.speedPos=[1.6,1.23,1.76];this.node(cyl,chrome,this.speedPos,[0,0,0],[.22,.15,.22]);this.node(cyl,black,[1.6,1.31,1.76],[0,0,0],[.185,.033,.185]);this.node(box(.015,.007,.15),cream,[1.6,1.332,1.69]);
  this.volumePos=[2.55,1.23,1.76];this.node(cyl,black,this.volumePos,[0,0,0],[.30,.26,.30]);this.node(cyl,silver,[2.55,1.37,1.76],[0,0,0],[.278,.04,.278]);this.volNeedle=this.node(box(.017,.009,.19),black,[2.55,1.396,1.69]);
  const ridges=[];for(let j=0;j<48;j++){const a=j/48*Math.PI*2;ridges.push([G.box(.01,.18,.008),M.matrix([Math.sin(a)*.303,0,Math.cos(a)*.303],[0,a,0])]);}this.node(this.mesh(G.merge(ridges)),silver,this.volumePos);
  const screws=[];for(const x of [-2.99,3.25])for(const z of [-2.05,2.05]){screws.push([G.cylinder(.042,.018,12),M.matrix([x,1.16,z])]);}this.node(this.mesh(G.merge(screws)),chrome);
  const plateCanvas=this.makeCanvas(1024,160,c=>{c.fillStyle='#d9d4c4';c.fillRect(0,0,1024,160);c.fillStyle='#272928';c.font='500 58px Georgia';c.fillText('surco',50,84);c.font='18px sans-serif';c.fillText('DIRECT DRIVE    /    S–01',410,66);c.font='13px sans-serif';c.fillText('DESIGNED FOR LISTENING',410,106);});
  this.node(box(2.06,.009,.34),this.mat('#ffffff',.25,.55,{texture:this.textureFrom(plateCanvas)}),[-.42,1.168,1.91]);
  const textCanvas=this.makeCanvas(512,128,c=>{c.fillStyle='#171a1c';c.fillRect(0,0,512,128);c.fillStyle='#c1beb1';c.font='25px sans-serif';c.fillText('33⅓ / 45',60,77);c.fillText('VOLUME',320,77);});this.node(box(1.94,.008,.25),this.mat('#fff',0,.8,{texture:this.textureFrom(textCanvas)}),[2.13,1.164,2.035]);
 }
 setArt(canvas,title,accent='#ad5b3e'){this.wake();this.currentArt=canvas;if(!this.coverMat.texture)this.coverMat.texture=this.textureFrom(canvas);else this.updateTexture(this.coverMat.texture,canvas);const label=this.makeCanvas(512,512,c=>{c.fillStyle=accent;c.fillRect(0,0,512,512);c.strokeStyle='rgba(255,255,255,.25)';for(let r=190;r<232;r+=13){c.beginPath();c.arc(256,256,r,0,Math.PI*2);c.stroke();}c.fillStyle='#f4e9d4';c.textAlign='center';c.font='46px Georgia';c.fillText('surco',256,151);c.font='17px sans-serif';c.fillText('S T E R E O   /   S I D E   A',256,185);c.font='22px sans-serif';const words=title.slice(0,48);c.fillText(words.slice(0,25),256,342);if(words.length>25)c.fillText(words.slice(25),256,373);c.font='15px sans-serif';c.fillText('33⅓ RPM',256,418);});if(!this.labelMat.texture)this.labelMat.texture=this.textureFrom(label);else this.updateTexture(this.labelMat.texture,label);}
 wake(){if(!this.destroyed&&!this.lost&&!document.hidden&&this.visible&&!this.raf)this.raf=requestAnimationFrame(this.loop);}
 suspend(){cancelAnimationFrame(this.raf);this.raf=0;this.lastTime=0;const wasDragging=!!this.drag;this.cancelDrag(false);if(wasDragging)this.setStage(this.stage,false);this.finishRecord();this.cameraPose=this.top?[1.30,.02]:[.72,this.camYaw];this.cameraVelocity=[0,0];this.cameraActive=false;}
 finishRecord(){const m=this.motion||this.recordSpring;if(m){this.record.p=[...m.to];this.record.r=[...m.angle];}this.motion=null;this.recordSpring=null;}
 setPlaying(v){this.playing=v;if(v&&this.stage==='mounted')this.finishRecord();this.wake();}
 setProgress(v){const next=Math.max(0,Math.min(1,v||0));if(next!==this.progress){this.progress=next;if(this.playing)this.wake();}}
 setVolume(v){this.volNeedle.r[1]=(v-.5)*4.8;this.wake();}
 setQuality(q){this.quality=q;this.resize();}
 setReduced(value){this.reduced=!!value;if(this.reduced){const wasDragging=!!this.drag;this.cancelDrag(false);if(wasDragging)this.setStage(this.stage,false);this.finishRecord();this.cameraPose=this.top?[1.30,.02]:[.72,this.camYaw];this.cameraVelocity=[0,0];this.cameraActive=false;this.mouse=[0,0];}this.wake();}
 setCamera(top){this.cancelDrag();this.top=!!top;if(this.reduced){this.cameraPose=this.top?[1.30,.02]:[.72,this.camYaw];this.cameraVelocity=[0,0];this.cameraActive=false;}else this.cameraActive=true;this.wake();}
 setSleeveVisible(value){this.sleeve.visible=value;if(this.stage==='sleeved')this.record.visible=value;this.wake();}
 sleeveBounds(){const mat=StudioMath.matrix(this.sleeve.p,this.sleeve.r,this.sleeve.s),corners=[[-1.85,-1.85,.045],[1.85,-1.85,.045],[-1.85,1.85,.045],[1.85,1.85,.045]].map(p=>this.project(StudioMath.point(mat,p).slice(0,3))),rect=this.canvas.getBoundingClientRect(),xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);return{left:rect.left+Math.min(...xs),top:rect.top+Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}
 sampleRecord(t){if(!this.motion)return;const m=this.motion,v=m.duration?Math.min(1,Math.max(0,(t-m.start)/m.duration)):1,e=v<.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2;this.record.p=m.from.map((x,i)=>x+(m.to[i]-x)*e);this.record.p[1]+=Math.sin(v*Math.PI)*m.arc;this.record.r=m.rot.map((x,i)=>x+(m.angle[i]-x)*e);if(v===1)this.motion=null;}
 setStage(stage,animate=true,softReturn=false){
  this.sampleRecord(performance.now());this.cancelDrag(false);this.record.visible=true;const from=[...this.record.p],rot=[...this.record.r];this.stage=stage;
  const to=stage==='mounted'?[-.65,1.46,-.10]:stage==='extracted'?[-3.35,2.90,1.05]:[-4.47,1.85,-.89],raw=stage==='mounted'?[0,0,0]:stage==='extracted'?[1.10,0,-.18]:[Math.PI/2-.12,.18,-.04],angle=raw.map((v,i)=>SurcoMotion.nearestAngle(rot[i],v));
  const old=this.recordSpring;this.motion=null;this.recordSpring=null;
  if(!animate||this.reduced){this.record.p=to;this.record.r=angle;}
  else if(softReturn)this.recordSpring={to,angle,velocity:old?.velocity||[0,0,0],angular:old?.angular||[0,0,0]};
  else this.motion={from,to,rot,angle,start:performance.now(),duration:stage==='mounted'?SurcoMotion.tokens.mount:stage==='extracted'?SurcoMotion.tokens.extract:SurcoMotion.tokens.return,arc:stage==='mounted'?.55:.20};
  this.wake();
 }
 cancelDrag(returnToStage=true){const drag=this.drag;this.drag=null;this.down=null;if(drag&&this.canvas.hasPointerCapture(drag.id))this.canvas.releasePointerCapture(drag.id);this.canvas.style.cursor='default';if(drag&&returnToStage)this.setStage(this.stage,true,true);}
 resize(){if(this.destroyed)return;this.cancelDrag();const r=this.canvas.getBoundingClientRect();const max=this.quality==='high'?2:this.quality==='low'?1:Math.min(devicePixelRatio||1,1.5);const dpr=Math.min(max,2048/Math.max(r.width,r.height));this.canvas.width=Math.max(1,Math.round(r.width*dpr));this.canvas.height=Math.max(1,Math.round(r.height*dpr));this.width=r.width;this.height=r.height;this.updateCamera();this.wake();}
 updateCamera(){const aspect=(this.width||1)/(this.height||1),dist=aspect<1.1?15.8:12.8,target=[-1.10,.95,0],elev=this.cameraPose[0],yaw=this.cameraPose[1],eye=[target[0]+Math.sin(yaw)*Math.cos(elev)*dist+(this.reduced?0:this.mouse[0]*.1),Math.sin(elev)*dist,target[2]+Math.cos(yaw)*Math.cos(elev)*dist];this.eye=eye;this.vp=StudioMath.mm(StudioMath.perspective(.65,aspect,.1,90),StudioMath.view(eye,target));}
 project(p){if(!this.vp)return[0,0];const q=StudioMath.point(this.vp,p);return[(q[0]/q[3]*.5+.5)*this.width,(-q[1]/q[3]*.5+.5)*this.height];}
 hit(x,y,p,r){const q=this.project(p);return Math.hypot(x-q[0],y-q[1])<r;}
 bind(){const on=(target,type,fn,opts={})=>target.addEventListener(type,fn,{...opts,signal:this.events.signal}),c=this.canvas,coords=e=>{const r=c.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];};
  on(c,'pointerdown',e=>{if(e.button>0)return;const[x,y]=coords(e);if(this.drag)return;if(this.stage==='extracted'&&this.hit(x,y,this.record.p,100)){this.sampleRecord(performance.now());this.motion=null;this.recordSpring=null;this.drag={id:e.pointerId,x,y,p:[...this.record.p],moved:false};c.setPointerCapture(e.pointerId);c.style.cursor='grabbing';e.preventDefault();}else this.down={x,y,id:e.pointerId};});
  on(c,'pointermove',e=>{const[x,y]=coords(e);this.mouse=[(x/this.width-.5)*2,(y/this.height-.5)*2];this.wake();if(this.drag?.id===e.pointerId){this.motion=null;const d=this.drag;d.moved=d.moved||Math.hypot(x-d.x,y-d.y)>6;const scale=13/this.width;this.record.p=[Math.max(-7,Math.min(4,d.p[0]+(x-d.x)*scale)),Math.max(1.6,Math.min(5,d.p[1]-(y-d.y)*scale*.4)),Math.max(-3,Math.min(4,d.p[2]+(y-d.y)*scale*.75))];e.preventDefault();return;}const recordHit=this.hit(x,y,this.record.p,80),sleeveHit=this.hit(x,y,[-4.65,1.85,-.8],75),controlHit=[this.startPos,this.speedPos,this.volumePos,[2.46,1.58,-1.34]].some(p=>this.hit(x,y,p,25));c.style.cursor=this.stage==='extracted'&&recordHit?'grab':controlHit||sleeveHit||recordHit?'pointer':'default';});
  on(c,'pointerup',e=>{const[x,y]=coords(e);if(this.drag?.id===e.pointerId){const d=this.drag;this.drag=null;c.releasePointerCapture(e.pointerId);c.style.cursor='grab';const platter=this.project([-.65,1.46,-.1]);if(d.moved&&Math.hypot(x-platter[0],y-platter[1])<Math.min(150,this.width*.23)){this.onAction('mount');}else{this.setStage('extracted',true,true);if(!d.moved)this.onAction('mount');}return;}if(!this.down||this.down.id!==e.pointerId||Math.hypot(x-this.down.x,y-this.down.y)>8)return;this.down=null;if(this.hit(x,y,this.startPos,27)||this.hit(x,y,[2.46,1.58,-1.34],30))this.onAction('play');else if(this.hit(x,y,this.speedPos,24))this.onAction('speed');else if(this.hit(x,y,this.volumePos,26))this.onAction('volume');else if(this.hit(x,y,[-4.65,1.85,-.8],95)&&this.stage==='sleeved')this.onAction('extract');else if(this.hit(x,y,[-.65,1.46,-.1],100)&&this.stage==='mounted')this.onAction('play');});
  on(c,'pointercancel',()=>this.cancelDrag());on(c,'lostpointercapture',()=>this.cancelDrag());on(c,'pointerleave',()=>{if(!this.drag){this.mouse=[0,0];this.wake();}});on(window,'blur',()=>this.cancelDrag());
  on(c,'webglcontextlost',e=>{e.preventDefault();this.lost=true;this.suspend();this.onAction('contextlost');});on(c,'webglcontextrestored',()=>{this.onAction('contextrestored');});on(document,'visibilitychange',()=>{if(document.hidden)this.suspend();else this.wake();});on(window,'pagehide',()=>this.suspend());on(window,'pageshow',()=>this.wake());if('IntersectionObserver'in window){this.visibilityObserver=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible)this.wake();else this.suspend();});this.visibilityObserver.observe(c);}
 }
 loop(t){
  this.raf=0;if(this.destroyed||this.lost||document.hidden||!this.visible)return;this.stats.callbacks++;
  if(this.quality==='low'&&t-(this.lowTime||0)<33){this.wake();return;}this.lowTime=t;
  const dt=Math.min(.05,this.lastTime?Math.max(0,(t-this.lastTime)/1000):1/60);this.lastTime=t;const M=SurcoMotion,T=M.tokens;
  this.sampleRecord(t);
  if(this.recordSpring){const m=this.recordSpring;let moving=false;for(let i=0;i<3;i++){[this.record.p[i],m.velocity[i]]=M.spring(this.record.p[i],m.velocity[i],m.to[i],T.omega,dt);[this.record.r[i],m.angular[i]]=M.spring(this.record.r[i],m.angular[i],m.angle[i],T.omega,dt);if(Math.abs(this.record.p[i]-m.to[i])>T.epsilon||Math.abs(m.velocity[i])>T.velocityEpsilon||Math.abs(this.record.r[i]-m.angle[i])>T.epsilon||Math.abs(m.angular[i])>T.velocityEpsilon)moving=true;}if(!moving)this.finishRecord();}
  const cameraTarget=this.top?[1.30,.02]:[.72,this.camYaw];this.cameraActive=false;for(let i=0;i<2;i++){if(this.reduced){this.cameraPose[i]=cameraTarget[i];this.cameraVelocity[i]=0;}else{[this.cameraPose[i],this.cameraVelocity[i]]=M.spring(this.cameraPose[i],this.cameraVelocity[i],cameraTarget[i],T.omega,dt);if(Math.abs(this.cameraPose[i]-cameraTarget[i])>T.epsilon||Math.abs(this.cameraVelocity[i])>T.velocityEpsilon)this.cameraActive=true;else{this.cameraPose[i]=cameraTarget[i];this.cameraVelocity[i]=0;}}}
  const target=this.playing?1:0;this.spin=this.reduced?target:target+(this.spin-target)*Math.exp(-dt*(this.playing?5:8));if(Math.abs(this.spin-target)<.001)this.spin=target;
  if(!this.reduced){this.recordAngle=(this.recordAngle-this.spin*this.rpm*Math.PI*2/60*dt)%(Math.PI*2);this.platter.r[1]=this.recordAngle;if(this.stage==='mounted'&&!this.motion&&!this.recordSpring)this.record.r[1]=this.recordAngle;}
  const aa=this.stage==='mounted'&&this.playing?-.76-this.progress*.38:0,armY=this.stage==='mounted'&&this.playing?1.735:1.90;
  this.armAngle=this.reduced?aa:aa+(this.armAngle-aa)*Math.exp(-dt*10);if(Math.abs(this.armAngle-aa)<.001)this.armAngle=aa;this.arm.r[1]=this.armAngle;
  this.arm.p[1]=this.reduced?armY:armY+(this.arm.p[1]-armY)*Math.exp(-dt*10);if(Math.abs(this.arm.p[1]-armY)<.001)this.arm.p[1]=armY;
  this.ledMat.color=this.playing?[.5,.8,.4]:[.37,.39,.31];this.ledMat.emission=this.playing?.5:0;
  this.updateCamera();for(const n of this.nodes){const local=StudioMath.matrix(n.p,n.r,n.s);n.world=n.parent?StudioMath.mm(n.parent.world,local):local;}this.render();this.stats.frames++;
  const transient=this.motion||this.recordSpring||this.cameraActive||this.spin!==target||this.armAngle!==aa||this.arm.p[1]!==armY;
  if(transient||this.playing&&!this.reduced)this.wake();else this.lastTime=0;
 }
 render(){const g=this.gl;g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.viewport(0,0,this.shadowSize,this.shadowSize);g.clear(g.DEPTH_BUFFER_BIT);g.useProgram(this.shadowProgram);g.uniformMatrix4fv(this.sloc.vp,false,this.lightVP);g.enable(g.POLYGON_OFFSET_FILL);g.polygonOffset(1.5,2.0);for(const n of this.nodes)if(n.mesh&&n.visible&&n.shadow&&(!n.parent||n.parent.visible)){g.uniformMatrix4fv(this.sloc.model,false,n.world);g.bindVertexArray(n.mesh.vao);g.drawElements(g.TRIANGLES,n.mesh.count,g.UNSIGNED_INT,0);}g.disable(g.POLYGON_OFFSET_FILL);
  g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,this.canvas.width,this.canvas.height);g.clearColor(233/255,229/255,220/255,1);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.useProgram(this.program);const l=this.loc;g.uniformMatrix4fv(l.uVP,false,this.vp);g.uniformMatrix4fv(l.uLightVP,false,this.lightVP);g.uniform3fv(l.uEye,this.eye);g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.depth);g.uniform1i(l.uShadow,1);g.uniform1i(l.uMap,0);let draws=0;
  for(const n of this.nodes)if(n.mesh&&n.visible&&(!n.parent||n.parent.visible)){const m=n.mat;g.uniformMatrix4fv(l.uModel,false,n.world);g.uniformMatrix3fv(l.uNormal,false,StudioMath.normalMat(n.world));g.uniform3fv(l.uColor,m.color);g.uniform1f(l.uMetal,m.metal);g.uniform1f(l.uRough,m.rough);g.uniform1f(l.uAlpha,m.alpha);g.uniform1f(l.uEmission,m.emission);g.uniform1i(l.uPattern,m.pattern);g.uniform1i(l.uUseMap,m.texture?1:0);g.uniform1i(l.uReceiveShadow,n.receive?1:0);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,m.texture||this.white);g.bindVertexArray(n.mesh.vao);g.drawElements(g.TRIANGLES,n.mesh.count,g.UNSIGNED_INT,0);draws++;}this.stats.drawCalls=draws;
 }
 destroy(){this.suspend();this.destroyed=true;this.events.abort();this.observer?.disconnect();this.visibilityObserver?.disconnect();const g=this.gl;for(const m of this.meshes){g.deleteVertexArray(m.vao);m.buffers.forEach(b=>g.deleteBuffer(b));}this.textures.forEach(t=>g.deleteTexture(t));g.deleteTexture(this.depth);g.deleteFramebuffer(this.fbo);g.deleteProgram(this.program);g.deleteProgram(this.shadowProgram);}
}
