import { describe, expect, it } from 'vitest';

import { runBuilder } from '../src/roles/builder';

function makeRoom(sources: Source[], sites: ConstructionSite[]): Room {
  return {
    find: (type: number) => {
      if (type === FIND_SOURCES) return sources;
      if (type === FIND_CONSTRUCTION_SITES) return sites;
      return [];
    },
  } as unknown as Room;
}

describe('runBuilder', () => {
  it('builds construction sites when carrying energy', () => {
    const site = { id: 'site1', my: true, pos: { isNearTo: () => true } } as ConstructionSite;
    const calls: string[] = [];
    const creep = {
      id: 'builder1',
      name: 'Builder1',
      memory: { role: 'builder' },
      room: makeRoom([], [site]),
      pos: { isNearTo: () => true },
      store: {
        getFreeCapacity: () => 0,
        getUsedCapacity: (resource: ResourceConstant) => (resource === RESOURCE_ENERGY ? 50 : 0),
      },
      harvest: () => 0,
      transfer: () => 0,
      build: (target: ConstructionSite) => {
        expect(target).toBe(site);
        calls.push('build');
        return 0;
      },
      upgradeController: () => 0,
      moveTo: () => {
        calls.push('move');
        return 0;
      },
      say: () => 0,
    } as unknown as Creep;

    runBuilder(creep);

    expect(calls).toEqual(['build']);
  });

  it('harvests before building when empty', () => {
    const source = { id: 'source1', pos: { isNearTo: () => true } } as Source;
    const site = { id: 'site1', my: true, pos: { isNearTo: () => true } } as ConstructionSite;
    const calls: string[] = [];
    const creep = {
      id: 'builder1',
      name: 'Builder1',
      memory: { role: 'builder' },
      room: makeRoom([source], [site]),
      pos: { isNearTo: () => true },
      store: {
        getFreeCapacity: () => 50,
        getUsedCapacity: (resource: ResourceConstant) => (resource === RESOURCE_ENERGY ? 0 : 0),
      },
      harvest: (target: Source) => {
        expect(target).toBe(source);
        calls.push('harvest');
        return 0;
      },
      transfer: () => 0,
      build: () => 0,
      upgradeController: () => 0,
      moveTo: () => {
        calls.push('move');
        return 0;
      },
      say: () => 0,
    } as unknown as Creep;

    runBuilder(creep);

    expect(calls).toEqual(['harvest']);
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
