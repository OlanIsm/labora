import { strict as assert } from 'node:assert';
import { experiments, getExperiment } from '../lib/data';
import { act, answer, initialRuntime, score } from '../lib/engine';
import { ohmsLaw, classifyPH, dilution, pendulumPeriod } from '../lib/science';

let exp=experiments[0]; let s=initialRuntime();
s=act(exp,s,'place','indicator'); assert.equal(s.step,0); assert.deepEqual(s.placed,[]); assert.match(s.feedback,/Not yet/);
s=act(exp,s,'place','beaker'); assert.equal(s.step,1); assert.deepEqual(s.placed,['beaker']);
s=act(exp,s,'add','indicator'); assert.equal(s.step,1); assert.match(s.feedback,/Not yet/);
s=act(exp,s,'pour','solution'); assert.equal(s.step,2); assert.deepEqual(s.placed,['beaker','solution']);
s=act(exp,s,'add','indicator'); assert.equal(s.step,3); assert.deepEqual(s.placed,['beaker','solution','indicator']);
s=answer(exp,s,1); assert.equal(s.step,4); assert.equal(score(exp,s).total,100);

exp=getExperiment('mixture')!; s=initialRuntime();
s=act(exp,s,'add','reagent'); assert.equal(s.step,0); assert.deepEqual(s.placed,[]); assert.match(s.feedback,/Not yet/);
s=act(exp,s,'place','beaker'); assert.equal(s.step,1); assert.deepEqual(s.placed,['beaker']);
s=act(exp,s,'add','reagent'); assert.equal(s.step,1); assert.match(s.feedback,/Not yet/);
s=act(exp,s,'pour','solution'); assert.equal(s.step,2); assert.deepEqual(s.placed,['beaker','solution']);
s=act(exp,s,'add','reagent'); assert.equal(s.step,3); assert.deepEqual(s.placed,['beaker','solution','reagent']);
s=answer(exp,s,0); assert.equal(s.step,4); assert.equal(score(exp,s).total,100);

exp=getExperiment('dilution')!; s=initialRuntime();
s=act(exp,s,'add','water'); assert.equal(s.step,0); assert.deepEqual(s.placed,[]); assert.match(s.feedback,/Not yet/);
s=act(exp,s,'place','cylinder'); assert.equal(s.step,1); assert.deepEqual(s.placed,['cylinder']);
s=act(exp,s,'add','water'); assert.equal(s.step,1); assert.match(s.feedback,/Not yet/);
s=act(exp,s,'add','concentrate'); assert.equal(s.step,2); assert.deepEqual(s.placed,['cylinder','concentrate']);
s=act(exp,s,'add','water'); assert.equal(s.step,3); assert.deepEqual(s.placed,['cylinder','concentrate','water']);
s=answer(exp,s,1); assert.equal(s.step,4); assert.equal(score(exp,s).total,100);

assert.equal(ohmsLaw(6,3),2); assert.equal(classifyPH(3),'Acidic'); assert.equal(dilution(2,10,20),1); assert.ok(pendulumPeriod(2)>pendulumPeriod(1));
console.log('Engine checks passed');
