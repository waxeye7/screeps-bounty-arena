import { describe, expect, it } from 'vitest';

import { buildHarvesterBody, ensureBasicHarvesters } from '../src/planning/spawn';

describe('ensureBasicHarvesters', () => {
  it('spawns a harvester when below target', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 123,
      creeps: {},
      spawns: {},
    } as GameGlobal;

    const spawn = {
      id: 'spawn1',
      name: 'Spawn1',
      spawning: null,
      pos: { isNearTo: () => true },
      room: { energyAvailable: 300, find: () => [] },
      structureType: STRUCTURE_SPAWN,
      spawnCreep: (...args: unknown[]) => {
        calls.push(args);
        return 0;
      },
    } as StructureSpawn;

    ensureBasicHarvesters(spawn, 1);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      [WORK, CARRY, MOVE],
      'Harvester123',
      { memory: { role: 'harvester' } },
    ]);
  });
});

describe('buildHarvesterBody', () => {
  it('keeps low-energy rooms on the minimal viable body', () => {
    expect(buildHarvesterBody(0)).toEqual([WORK, CARRY, MOVE]);
    expect(buildHarvesterBody(199)).toEqual([WORK, CARRY, MOVE]);
  });

  it('scales harvester bodies as room energy increases', () => {
    expect(buildHarvesterBody(400)).toEqual([WORK, CARRY, MOVE, WORK, CARRY, MOVE]);
    expect(buildHarvesterBody(800)).toEqual([
      WORK,
      CARRY,
      MOVE,
      WORK,
      CARRY,
      MOVE,
      WORK,
      CARRY,
      MOVE,
      WORK,
      CARRY,
      MOVE,
    ]);
  });

  it('caps harvester body size to keep spawn attempts practical', () => {
    expect(buildHarvesterBody(10_000)).toHaveLength(12);
  });
});
