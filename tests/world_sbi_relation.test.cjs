const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
test('changing World factor detaches the prior SBI async target',()=>{
 const nodes=new Map(),mounts=[];
 function node(){let html='';return {children:[],isConnected:true,textContent:'',
  set innerHTML(value){html=value;this.children.forEach(c=>c.isConnected=false);this.children=[];},
  get innerHTML(){return html;},querySelectorAll(){return [];},appendChild(c){this.children.push(c);}};}
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node};
 const ctx=vm.createContext({document,CONFIG:{clarityMode:true},SEED:{},currentForce:'rates',esc:String,
  SBI_MACRO:{mount:(target,mode)=>mounts.push({target,mode})}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/forces.js'),'utf8'),ctx);
 ctx.renderForces();assert.equal(mounts.length,1);assert.equal(mounts[0].mode,'relationship');
 ctx.currentForce='crude';ctx.renderForces();
 assert.equal(mounts[0].target.isConnected,false);assert.equal(mounts.length,1);
 assert.equal(nodes.get('world-sbi-relation').innerHTML,'');
});
