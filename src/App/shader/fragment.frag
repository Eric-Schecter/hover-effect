uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uVelo;
uniform float uMode;

varying vec2 vUv;

vec2 matcap(vec3 eye,vec3 normal){
  vec3 reflected=reflect(eye,normal);
  float m=2.8284271247461903*sqrt(reflected.z+1.);
  return reflected.xy/m+.5;
}

float circle(vec2 uv,vec2 disc_center,float disc_radius,float border_size){
  uv-=disc_center;
  // uv*=uResolution;
  float dist=sqrt(dot(uv,uv));
  return smoothstep(disc_radius+border_size,disc_radius-border_size,dist);
}

float hash12(vec2 p){
  float h=dot(p,vec2(127.1,311.7));
  return fract(sin(h)*43758.5453123);
}

vec2 hash2d(vec2 p)
{
  vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
  p3+=dot(p3,p3.yzx+19.19);
  return fract((p3.xx+p3.yz)*p3.zy);
}

void main(){
  vec2 newUV=vUv;
  vec4 color=vec4(1.);
  if(uMode==1.){
    float c=circle(vUv,uMouse,0.,.1);
    float r=texture2D(tDiffuse,newUV+=vec2(c*.1*.5)).x;
    float g=texture2D(tDiffuse,newUV+=vec2(c*.1*.525)).y;
    float b=texture2D(tDiffuse,newUV+=vec2(c*.1*.55)).z;
    color=vec4(r,g,b,1.);
  }
  if(uMode==2.){
    float c=circle(vUv,uMouse,0.,.1+uVelo*.01)*uVelo;
    vec2 warpedUV=mix(vUv,uMouse,c);
    color=texture2D(tDiffuse,warpedUV)+texture2D(tDiffuse,warpedUV)*vec4(vec3(c),1.);
  }
  if(uMode==3.){
    float hash=hash12(vUv*10.);
    float c=circle(vUv,uMouse,0.,.1+uVelo*.1)*10.;
    vec2 warpedUV=mix(vUv,uMouse,vec2(hash-.5)*c/2.);
    color=texture2D(tDiffuse,warpedUV);
  }
  gl_FragColor=color;
}