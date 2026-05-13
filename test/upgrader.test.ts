import { describe, expect, it } from 'vitest';

import { runUpgrader } from '../src/roles/upgrader';

describe('runUpgrader', () => {
  it('harvests energy before upgrading', () => {
    const source = { id: 'source1', pos: { isNearTo: () => false } } as Source;
    const moves: RoomObject[] = [];
    function find(type: typeof FIND_SOURCES): Source[];
    function find(type: typeof FIND_MY_SPAWNS): StructureSpawn[];
    function find(type: typeof FIND_SOURCES | typeof FIND_MY_SPAWNS): Source[] | StructureSpawn[] {
      return type === FIND_SOURCES ? [source] : [];
    }

    globalThis.Game = {
      time: 1,
      creeps: {},
      spawns: {
        Spawn1: {
          id: 'spawn1',
          name: 'Spawn1',
          spawning: null,
          pos: { isNearTo: () => true },
          room: { find },
          structureType: STRUCTURE_SPAWN,
          spawnCreep: () => 0,
        } as StructureSpawn,
      },
    } as GameGlobal;

    const creep = {
      id: 'creep1',
      name: 'Upgrader1',
      memory: { role: 'upgrader' },
      pos: { isNearTo: () => false },
      store: { getFreeCapacity: () => 1 },
      harvest: () => ERR_NOT_IN_RANGE,
      transfer: () => 0,
      upgradeController: () => 0,
      moveTo: (target: RoomObject) => {
        moves.push(target);
        return 0;
      },
      say: () => 0,
    } as Creep;

    runUpgrader(creep);

    expect(creep.memory.sourceId).toBe('source1');
    expect(moves).toEqual([source]);
  });

  it('upgrades the room controller when full', () => {
    const controller = { id: 'controller1', pos: { isNearTo: () => false } } as StructureController;
    const upgrades: StructureController[] = [];
    const moves: RoomObject[] = [];
    function find(type: typeof FIND_SOURCES): Source[];
    function find(type: typeof FIND_MY_SPAWNS): StructureSpawn[];
    function find(type: typeof FIND_SOURCES | typeof FIND_MY_SPAWNS): Source[] | StructureSpawn[] {
      return [];
    }

    globalThis.Game = {
      time: 1,
      creeps: {},
      spawns: {
        Spawn1: {
          id: 'spawn1',
          name: 'Spawn1',
          spawning: null,
          pos: { isNearTo: () => true },
          room: { controller, find },
          structureType: STRUCTURE_SPAWN,
          spawnCreep: () => 0,
        } as StructureSpawn,
      },
    } as GameGlobal;

    const creep = {
      id: 'creep1',
      name: 'Upgrader1',
      memory: { role: 'upgrader' },
      pos: { isNearTo: () => false },
      store: { getFreeCapacity: () => 0 },
      harvest: () => 0,
      transfer: () => 0,
      upgradeController: (target: StructureController) => {
        upgrades.push(target);
        return ERR_NOT_IN_RANGE;
      },
      moveTo: (target: RoomObject) => {
        moves.push(target);
        return 0;
      },
      say: () => 0,
    } as Creep;

    runUpgrader(creep);

    expect(upgrades).toEqual([controller]);
    expect(moves).toEqual([controller]);
  });
});
