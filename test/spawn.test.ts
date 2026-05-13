import { describe, expect, it } from 'vitest';

import { buildWorkerBody, ensureBasicHarvesters } from '../src/planning/spawn';

describe('buildWorkerBody', () => {
  it('keeps the minimal 200-energy worker body', () => {
    expect(buildWorkerBody(200)).toEqual([WORK, CARRY, MOVE]);
  });

  it('uses higher available energy for stronger bodies', () => {
    expect(buildWorkerBody(300)).toEqual([WORK, CARRY, MOVE, WORK]);
    expect(buildWorkerBody(400)).toEqual([WORK, CARRY, MOVE, WORK, CARRY, MOVE]);
  });

  it('falls back to the minimal valid body below 200 energy', () => {
    expect(buildWorkerBody(150)).toEqual([WORK, CARRY, MOVE]);
  });
});

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
      room: { energyAvailable: 400, find: () => [] },
      structureType: STRUCTURE_SPAWN,
      spawnCreep: (...args: unknown[]) => {
        calls.push(args);
        return 0;
      },
    } as StructureSpawn;

    ensureBasicHarvesters(spawn, 1);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      [WORK, CARRY, MOVE, WORK, CARRY, MOVE],
      'Harvester123',
      { memory: { role: 'harvester' } },
    ]);
  });
});
