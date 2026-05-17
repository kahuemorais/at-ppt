import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';

const vertexShader = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uIntensity;
uniform float uSpeed;
uniform int uAnimType;
uniform vec2 uMouse;
uniform int uColorCount;
uniform float uDistort;
uniform vec2 uOffset;
uniform sampler2D uGradient;
uniform float uNoiseAmount;
uniform int uRayCount;

float hash21(vec2 p){p=floor(p);float f=52.9829189*fract(dot(p,vec2(.065,.005)));return fract(f);}
mat2 rot30(){return mat2(.8,-.5,.5,.8);}
float layeredNoise(vec2 f){vec2 p=mod(f+vec2(uTime*30.,-uTime*21.),1024.);vec2 q=rot30()*p;float n=0.;n+=.40*hash21(q);n+=.25*hash21(q*2.+17.);n+=.20*hash21(q*4.+47.);n+=.10*hash21(q*8.+113.);n+=.05*hash21(q*16.+191.);return n;}
vec3 rayDir(vec2 f,vec2 r,vec2 o,float d){float focal=r.y*max(d,1e-3);return normalize(vec3(2.*(f-o)-r,focal));}
float edgeFade(vec2 f,vec2 r,vec2 o){vec2 t=f-.5*r-o;float rr=length(t)/(min(r.x,r.y)*.5);float x=clamp(rr,0.,1.);float q=x*x*x*(x*(x*6.-15.)+10.);float s=q*.5;s=pow(s,1.5);float tail=1.-pow(1.-s,2.);s=mix(s,tail,.2);float dn=(layeredNoise(f*.15)-.5)*.0015*s;return clamp(s+dn,0.,1.);}
mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1,0,0,0,c,-s,0,s,c);}
mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0,s,0,1,0,-s,0,c);}
mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,-s,0,s,c,0,0,0,1);}
vec3 sampleG(float t){t=clamp(t,0.,1.);return texture(uGradient,vec2(t,.5)).rgb;}
vec2 rot2(vec2 v,float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c)*v;}
float bendAngle(vec3 q,float t){return .8*sin(q.x*.55+t*.6)+.7*sin(q.y*.5-t*.5)+.6*sin(q.z*.6+t*.7);}

void main(){
    vec2 frag=gl_FragCoord.xy;
    float t=uTime*uSpeed;
    float jitterAmp=.1*clamp(uNoiseAmount,0.,1.);
    vec3 dir=rayDir(frag,uResolution,uOffset,1.);
    float marchT=0.;
    vec3 col=vec3(0.);
    float n=layeredNoise(frag);
    vec4 c=cos(t*.2+vec4(0.,33.,11.,0.));
    mat2 M2=mat2(c.x,c.y,c.z,c.w);
    float amp=clamp(uDistort,0.,50.)*.15;
    mat3 rot3dMat=mat3(1.);
    if(uAnimType==1){vec3 ang=vec3(t*.31,t*.21,t*.17);rot3dMat=rotZ(ang.z)*rotY(ang.y)*rotX(ang.x);}
    mat3 hoverMat=mat3(1.);
    if(uAnimType==2){vec2 m=uMouse*2.-1.;vec3 ang=vec3(m.y*.6,m.x*.6,0.);hoverMat=rotY(ang.y)*rotX(ang.x);}
    for(int i=0;i<44;++i){
        vec3 P=marchT*dir;P.z-=2.;float rad=length(P);vec3 Pl=P*(10./max(rad,1e-6));
        if(uAnimType==0){Pl.xz*=M2;}
        else if(uAnimType==1){Pl=rot3dMat*Pl;}
        else{Pl=hoverMat*Pl;}
        float stepLen=min(rad-.3,n*jitterAmp)+.1;
        float grow=smoothstep(.35,3.,marchT);
        float a1=amp*grow*bendAngle(Pl*.6,t);
        float a2=.5*amp*grow*bendAngle(Pl.zyx*.5+3.1,t*.9);
        vec3 Pb=Pl;Pb.xz=rot2(Pb.xz,a1);Pb.xy=rot2(Pb.xy,a2);
        float rayPattern=smoothstep(.5,.7,sin(Pb.x+cos(Pb.y)*cos(Pb.z))*sin(Pb.z+sin(Pb.y)*cos(Pb.x+t)));
        if(uRayCount>0){float ang=atan(Pb.y,Pb.x);float comb=.5+.5*cos(float(uRayCount)*ang);comb=pow(comb,3.);rayPattern*=smoothstep(.15,.95,comb);}
        vec3 spectral=1.+vec3(cos(marchT*3.),cos(marchT*3.+1.),cos(marchT*3.+2.));
        float saw=fract(marchT*.25);float tRay=saw*saw*(3.-2.*saw);
        vec3 userGradient=2.*sampleG(tRay);
        vec3 spec=(uColorCount>0)?userGradient:spectral;
        vec3 base=(.05/(.4+stepLen))*smoothstep(5.,0.,rad)*spec;
        col+=base*rayPattern;marchT+=stepLen;
    }
    col*=edgeFade(frag,uResolution,uOffset);col*=uIntensity;
    fragColor=vec4(clamp(col,0.,1.),1.);
}`;

class PrismaticBurst {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.intensity = options.intensity ?? 2;
        this.speed = options.speed ?? 0.5;
        this.animationType = options.animationType ?? 'rotate3d';
        this.colors = options.colors ?? [];
        this.distort = options.distort ?? 0;
        this.offset = options.offset ?? { x: 0, y: 0 };
        this.rayCount = options.rayCount ?? 0;
        this.mixBlendMode = options.mixBlendMode ?? 'lighten';
        
        this.mouseTarget = [0.5, 0.5];
        this.mouseSmooth = [0.5, 0.5];
        this.hoverDamp = options.hoverDampness ?? 0;
        this.isVisible = true;
        this.accumTime = 0;
        this.last = performance.now();
        this.raf = 0;
        
        this.init();
    }
    
    init() {
        const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        if (!gl) return;
        
        this.gl = gl;
        this.canvas.style.position = 'absolute';
        this.canvas.style.inset = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.mixBlendMode = this.mixBlendMode;
        
        const renderer = new Renderer({ gl, alpha: false, antialias: false });
        this.renderer = renderer;
        
        const white = new Uint8Array([255, 255, 255, 255]);
        const gradientTex = new Texture(gl, { image: white, width: 1, height: 1, generateMipmaps: false, flipY: false });
        gradientTex.minFilter = gl.LINEAR;
        gradientTex.magFilter = gl.LINEAR;
        gradientTex.wrapS = gl.CLAMP_TO_EDGE;
        gradientTex.wrapT = gl.CLAMP_TO_EDGE;
        this.gradientTex = gradientTex;
        
        const program = new Program(gl, {
            vertex: vertexShader,
            fragment: fragmentShader,
            uniforms: {
                uResolution: { value: [1, 1] },
                uTime: { value: 0 },
                uIntensity: { value: 1 },
                uSpeed: { value: 1 },
                uAnimType: { value: 0 },
                uMouse: { value: [0.5, 0.5] },
                uColorCount: { value: 0 },
                uDistort: { value: 0 },
                uOffset: { value: [0, 0] },
                uGradient: { value: gradientTex },
                uNoiseAmount: { value: 0.8 },
                uRayCount: { value: 0 }
            }
        });
        this.program = program;
        
        const triangle = new Triangle(gl);
        const mesh = new Mesh(gl, { geometry: triangle, program });
        this.mesh = mesh;
        this.triangle = triangle;
        
        this.resize();
        this.bindEvents();
        this.animate();
    }
    
    resize() {
        const w = this.canvas.clientWidth || 1;
        const h = this.canvas.clientHeight || 1;
        this.renderer.setSize(w, h);
        this.program.uniforms.uResolution.value = [this.canvas.width, this.canvas.height];
    }
    
    bindEvents() {
        this.canvas.addEventListener('pointermove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            this.mouseTarget = [Math.min(Math.max(x, 0), 1), Math.min(Math.max(y, 0), 1)];
        }, { passive: true });
        
        window.addEventListener('resize', () => this.resize());
        
        const io = new IntersectionObserver((entries) => {
            this.isVisible = entries[0].isIntersecting;
        }, { threshold: 0.01 });
        io.observe(this.canvas);
    }
    
    animate() {
        const now = performance.now();
        const dt = Math.max(0, now - this.last) * 0.001;
        this.last = now;
        
        if (this.isVisible && !document.hidden) {
            this.accumTime += dt;
        }
        
        const tau = 0.02 + Math.min(1, this.hoverDamp) * 0.5;
        const alpha = 1 - Math.exp(-dt / tau);
        this.mouseSmooth[0] += (this.mouseTarget[0] - this.mouseSmooth[0]) * alpha;
        this.mouseSmooth[1] += (this.mouseTarget[1] - this.mouseSmooth[1]) * alpha;
        
        this.program.uniforms.uMouse.value = this.mouseSmooth;
        this.program.uniforms.uTime.value = this.accumTime;
        
        this.renderer.render({ scene: this.mesh });
        
        this.raf = requestAnimationFrame(() => this.animate());
    }
    
    update(options) {
        if (options.intensity !== undefined) this.program.uniforms.uIntensity.value = options.intensity;
        if (options.speed !== undefined) this.program.uniforms.uSpeed.value = options.speed;
        
        const animTypeMap = { rotate: 0, rotate3d: 1, hover: 2 };
        if (options.animationType !== undefined) {
            this.program.uniforms.uAnimType.value = animTypeMap[options.animationType] ?? 1;
        }
        if (options.distort !== undefined) this.program.uniforms.uDistort.value = options.distort;
        if (options.offset !== undefined) {
            this.program.uniforms.uOffset.value = [options.offset.x || 0, options.offset.y || 0];
        }
        if (options.rayCount !== undefined) this.program.uniforms.uRayCount.value = options.rayCount;
        
        if (options.colors && options.colors.length > 0) {
            const gl = this.gl;
            const capped = options.colors.slice(0, 64);
            const count = capped.length;
            const data = new Uint8Array(count * 4);
            for (let i = 0; i < count; i++) {
                const hex = capped[i].trim().replace('#', '');
                const r = parseInt(hex.slice(0, 2), 16) / 255;
                const g = parseInt(hex.slice(2, 4), 16) / 255;
                const b = parseInt(hex.slice(4, 6), 16) / 255;
                data[i * 4] = Math.round(r * 255);
                data[i * 4 + 1] = Math.round(g * 255);
                data[i * 4 + 2] = Math.round(b * 255);
                data[i * 4 + 3] = 255;
            }
            this.gradientTex.image = data;
            this.gradientTex.width = count;
            this.gradientTex.height = 1;
            this.gradientTex.needsUpdate = true;
            this.program.uniforms.uColorCount.value = count;
        }
    }
    
    destroy() {
        cancelAnimationFrame(this.raf);
        this.program.remove();
        this.triangle.remove();
        this.mesh.remove();
    }
}

export default PrismaticBurst;
window.PrismaticBurst = PrismaticBurst;