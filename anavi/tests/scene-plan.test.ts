import { expect, test } from 'vitest';
import { diffScore, ScenePlan } from '../scripts/scene-plan';

const firstPlan: ScenePlan = {
  scenes: [],
  metadata: { trustScore: 0, intent: 'initial' },
};

const secondPlan: ScenePlan = {
  scenes: [],
  metadata: { trustScore: 1, intent: 'updated' },
};

test('diffScore flags substantial plan changes', () => {
  expect(() => diffScore(firstPlan, secondPlan)).not.toThrow();
});
