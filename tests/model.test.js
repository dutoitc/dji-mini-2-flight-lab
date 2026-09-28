import {test} from 'node:test';import assert from 'node:assert/strict';import {Flight} from '../src/model.js';
const run=(f,n,input={})=>{for(let i=0;i<n*120;i++)f.step(1/120,input);};
test('takeoff, hover and controlled landing',()=>{const f=new Flight();f.takeoff();run(f,8);assert.equal(f.state,'flying');assert.ok(f.y>1.7&&f.y<2);run(f,8);assert.ok(Math.abs(f.vy)<.01);f.land();run(f,20);assert.equal(f.state,'ground');assert.equal(f.reason,'Atterrissage réussi');});
test('forward north; yaw east; braking and reset',()=>{const f=new Flight();f.takeoff();run(f,8);run(f,2,{up:1});run(f,2,{forward:1});assert.ok(f.z< -10);assert.ok(Math.abs(f.x)<.01);run(f,4);assert.ok(Math.hypot(f.vx,f.vz)<.01);f.yaw=Math.PI/2;run(f,2,{forward:1});assert.ok(f.x>10);f.reset();assert.equal(f.distance,0);assert.equal(f.state,'ground');});
test('tree impact stops flight',()=>{const f=new Flight([{x:0,z:-8,h:12,r:2}]);f.takeoff();run(f,8);run(f,4,{forward:1});assert.equal(f.state,'crashed');});
test('hard descent crashes',()=>{const f=new Flight();f.takeoff();run(f,8);run(f,3,{up:1});run(f,8,{up:-1});assert.equal(f.state,'crashed');});
