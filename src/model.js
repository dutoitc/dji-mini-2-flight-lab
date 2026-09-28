export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function terrain(x,z){const r=Math.hypot(x,z), f=clamp((r-15)/65,0,1);return f*f*(12+9*Math.sin(x/85)*Math.cos(z/110)+5*Math.sin((x+z)/55));}
export class Flight {
 constructor(trees=[]){this.trees=trees;this.reset();}
 reset(){Object.assign(this,{x:0,y:.22,z:0,vx:0,vy:0,vz:0,yaw:0,yr:0,pitch:0,roll:0,distance:0,battery:100,time:0,state:'ground',reason:''});}
 takeoff(){if(this.state==='ground')this.state='takeoff';}
 land(){if(['flying','takeoff'].includes(this.state))this.state='landing';}
 step(dt,input={}){
 if(['ground','crashed'].includes(this.state))return;
 dt=clamp(dt,0,1/30);this.time+=dt;
 const auto=this.state!=='flying';
 const forward=auto?0:input.forward||0,right=auto?0:input.right||0;
 const norm=Math.max(1,Math.hypot(forward,right));
 const speed=10, sy=Math.sin(this.yaw),cy=Math.cos(this.yaw);
 const tx=(sy*forward+cy*right)*speed/norm,tz=(-cy*forward+sy*right)*speed/norm;
 this.yr+=((auto?0:(input.yaw||0)*1.3)-this.yr)*(1-Math.exp(-4*dt));this.yaw+=this.yr*dt;
 const ground=terrain(this.x,this.z),agl=this.y-ground;
 let vertical=(input.up||0)*3;
 if(this.state==='takeoff'){vertical=clamp((1.8-agl)*2,0,1.4);if(agl>1.75)this.state='flying';}
 if(this.state==='landing')vertical=-Math.min(.9,Math.max(.18,agl*.5));
 if(this.y>120&&vertical>0)vertical=0;
 const a=1-Math.exp(-2.2*dt),b=1-Math.exp(-3*dt);
 this.vx+=(tx-this.vx)*a;this.vz+=(tz-this.vz)*a;this.vy+=(vertical-this.vy)*b;
 this.pitch+=(-forward*.3-this.pitch)*a;this.roll+=(-right*.3-this.roll)*a;
 this.x+=this.vx*dt;this.z+=this.vz*dt;this.y+=this.vy*dt;
 this.distance+=Math.hypot(this.vx,this.vy,this.vz)*dt;
 this.battery=Math.max(0,this.battery-dt/15);if(this.battery<10&&this.state==='flying')this.land();
 for(const t of this.trees){const h=this.y-terrain(t.x,t.z);const radius=h<t.h*.3?.35:t.r*clamp((t.h-h)/(t.h*.7),0,1);if(h>-.3&&h<t.h+.25&&Math.hypot(this.x-t.x,this.z-t.z)<radius+.25){this.crash('Collision avec un arbre');return;}}
 const g=terrain(this.x,this.z);
 if(this.y<=g+.22){if(Math.abs(this.vy)>1.2||Math.hypot(this.vx,this.vz)>1.5)this.crash('Impact au sol trop rapide');else{this.state='ground';this.reason='Atterrissage réussi';this.vx=this.vy=this.vz=0;}this.y=g+.22;}
 if(Math.hypot(this.x,this.z)>650)this.crash('Limite de la zone atteinte');
 }
 crash(reason){this.state='crashed';this.reason=reason;this.vx=this.vy=this.vz=0;}
}
