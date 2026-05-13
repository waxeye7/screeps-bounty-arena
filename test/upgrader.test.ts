import { describe, expect, it } from 'vitest';

import { runUpgrader } from '../src/roles/upgrader';

describe('runUpgrader', () => {
  it('upgrades the room controller when carrying energy', () => {
    const controller = { id: 'controller1' } as StructureController;
    const calls: string[] = [];
    const creep = {
      memory: { role: 'upgrader' },
      room: { controller, find: () => [] },
      store: {
        getUsedCapacity: (resource: ResourceConstant) => (resource === RESOURCE_ENERGY ? 50 : 0),
      },
      upgradeController: (target: StructureController) => {
        expect(target).toBe(controller);
        calls.push('upgrade');
        return 0;
      },
      moveTo: () => {
        calls.push('move');
        return 0;
      },
      say: () => 0,
    } as unknown as Creep;

    runUpgrader(creep);

    expect(calls).toEqual(['upgrade']);
  });

  it('harvests energy before upgrading when empty', () => {
    const source = { id: 'source1' } as Source;
    const calls: string[] = [];
    const creep = {
      memory: { role: 'upgrader' },
      room: { controller: { id: 'controller1' }, find: () => [source] },
      store: {
        getUsedCapacity: (resource: ResourceConstant) => (resource === RESOURCE_ENERGY ? 0 : 0),
      },
      harvest: (target: Source) => {
        expect(target).toBe(source);
        calls.push('harvest');
        return 0;
      },
      moveTo: () => {
        calls.push('move');
        return 0;
      },
      say: () => 0,
    } as unknown as Creep;

    runUpgrader(creep);

    expect(calls).toEqual(['harvest']);
    expect(creep.memory.sourceId).toBe('source1');
  });
});
