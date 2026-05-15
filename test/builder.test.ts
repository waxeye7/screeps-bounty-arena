import { describe, expect, it } from 'vitest';

import { runBuilder } from '../src/roles/builder';
import { mockConstructionSite, mockCreep, mockRoomFixture, mockSource } from './fixtures/rooms';

describe('runBuilder', () => {
  it('builds construction sites when carrying energy', () => {
    const site = mockConstructionSite('site1');
    const calls: string[] = [];
    const { room } = mockRoomFixture({ constructionSites: [site] });
    const creep = mockCreep({ name: 'Builder1', role: 'builder', room, energyUsed: 50, freeCapacity: 0, calls });

    runBuilder(creep);

    expect(calls).toEqual(['Builder1:build']);
  });

  it('harvests before building when empty', () => {
    const source = mockSource('source1', 13, 12);
    const site = mockConstructionSite('site1');
    const calls: string[] = [];
    const { room } = mockRoomFixture({ sources: [source], constructionSites: [site] });
    const creep = mockCreep({ name: 'Builder1', role: 'builder', room, energyUsed: 0, freeCapacity: 50, calls });

    runBuilder(creep);

    expect(calls).toContain('Builder1:harvest');
    expect(creep.memory.sourceId).toBe('source1');
  });
  it('does NOT attempt to build enemy construction sites', () => {
    const enemySite = { id: 'enemy1', my: false, pos: { isNearTo: () => true } } as ConstructionSite;
    const calls: string[] = [];
    const creep = {
      id: 'builder1',
      name: 'Builder1',
      memory: { role: 'builder' },
      room: makeRoom([], [enemySite]),
      pos: { isNearTo: () => true },
      store: {
        getFreeCapacity: () => 0,
        getUsedCapacity: (resource: ResourceConstant) => (resource === RESOURCE_ENERGY ? 50 : 0),
      },
      harvest: () => 0,
      transfer: () => 0,
      build: (target: ConstructionSite | undefined) => {
        if (target) {
          calls.push('build');
        }
        return 0;
      },
      upgradeController: () => 0,
      moveTo: () => 0,
      say: () => 0,
    } as unknown as Creep;

    runBuilder(creep);

    // Builder should not attempt to build enemy site; calls should be empty
    expect(calls).toHaveLength(0);
  });

});
