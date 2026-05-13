import { describe, expect, it } from 'vitest';

import { ensureBasicHarvesters } from '../src/planning/spawn';

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
      room: { find: () => [] },
      structureType: 'spawn' as const,
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
