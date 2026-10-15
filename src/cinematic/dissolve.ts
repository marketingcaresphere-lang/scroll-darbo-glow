// Raw WebGL dissolve: human -> glowing mesh -> robot, gated per body region.
const VERT = `attribute vec2 p;varying vec2 vUv;void main(){vUv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision highp float;
varying vec2 vUv;
uniform sampler2D uH,uR;
uniform vec4 uP; // hand, arm, chest, face progress 0..1
uniform float uTime,uEye,uBright,uRim;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float box(vec2 uv,vec4 r,float s){return smoothstep(r.x-s,r.x+s,uv.x)*smoothstep(r.z+s,r.z-s,uv.x)*smoothstep(r.y-s,r.y+s,uv.y)*smoothstep(r.w+s,r.w-s,uv.y);}
void main(){
 vec2 uv=vUv;
 vec4 h=texture2D(uH,uv); vec4 r=texture2D(uR,uv);
 float mFace=box(uv,vec4(.33,0.,.68,.34),.025);
 float mHand=box(uv,vec4(.27,.40,.53,.61),.02)*(1.-mFace);
 float mArm=box(uv,vec4(.04,.42,.36,.78),.03)*(1.-mHand)*(1.-mFace);
 float mChest=clamp(1.-mFace-mHand-mArm,0.,1.);
 float p=dot(vec4(mHand,mArm,mChest,mFace),uP);
 float n=noise(uv*14.)*.6+noise(uv*55.)*.4;
 float edge=p*1.25-.12;
 float robot=1.-smoothstep(edge-.012,edge+.012,n);
 float band=smoothstep(edge-.14,edge,n)*(1.-smoothstep(edge,edge+.035,n))*step(.001,p)*step(p,.999);
 vec4 col=mix(h,r,robot);
 float a=col.a;
 vec2 cell=uv*vec2(56.,74.);
 vec2 g=fract(cell);
 float grid=max(step(g.x,.07),step(g.y,.07));
 float sq=step(.9,hash(floor(cell)+floor(uTime*4.)));
 vec3 blue=vec3(.3,.66,1.);
 col.rgb=mix(col.rgb,blue*(.25+grid*1.3+sq*1.8),band*.92);
 col.rgb+=blue*band*.35;
 vec2 asp=vec2(1.,1.333);
 float e=exp(-pow(distance(uv*asp,vec2(.455,.146)*asp)*38.,2.))+exp(-pow(distance(uv*asp,vec2(.565,.146)*asp)*38.,2.));
 col.rgb+=blue*e*uEye*2.2*robot;
 // rim light from the left
 col.rgb+=blue*uRim*.35*smoothstep(.55,.0,uv.x)*a;
 col.rgb*=uBright;
 float glowA=max(a,band*a);
 gl_FragColor=vec4(col.rgb*glowA,glowA);
}`;

export type DissolveUniforms = { p: [number, number, number, number]; eye: number; bright: number; rim: number };

export function createDissolve(canvas: HTMLCanvasElement, humanSrc: string, robotSrc: string) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let ready = 0;
  const tex = (src: string, unit: number, name: string) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.uniform1i(gl.getUniformLocation(prog, name), unit);
    const img = new Image();
    img.onload = () => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((w) => gl.texParameteri(gl.TEXTURE_2D, w, gl.CLAMP_TO_EDGE));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      ready++;
    };
    img.src = src;
  };
  tex(humanSrc, 0, "uH");
  tex(robotSrc, 1, "uR");
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uP = U("uP"), uT = U("uTime"), uE = U("uEye"), uB = U("uBright"), uRim = U("uRim");

  return {
    render(u: DissolveUniforms, time: number) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (ready < 2) return;
      gl.uniform4f(uP, ...u.p);
      gl.uniform1f(uT, time);
      gl.uniform1f(uE, u.eye);
      gl.uniform1f(uB, u.bright);
      gl.uniform1f(uRim, u.rim);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
