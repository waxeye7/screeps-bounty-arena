import { describe, expect, it } from 'vitest';

import { ensureBasicHarvesters, ensureBasicUpgraders } from '../src/planning/spawn';

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

  it('spawns an upgrader when below target', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 456,
      creeps: {
        Harvester1: { memory: { role: 'harvester' } } as Creep,
        Harvester2: { memory: { role: 'harvester' } } as Creep,
        Harvester3: { memory: { role: 'harvester' } } as Creep,
      },
      spawns: {},
    } as GameGlobal;

    const spawn = {
      id: 'spawn1',
      name: 'Spawn1',
      spawning: null,
      pos: { isNearTo: () => true },
      room: { find: () => [] },
      structureType: STRUCTURE_SPAWN,
      spawnCreep: (...args: unknown[]) => {
        calls.push(args);
        return 0;
      },
    } as StructureSpawn;

    ensureBasicUpgraders(spawn, 1);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      [WORK, CARRY, MOVE],
      'Upgrader456',
      { memory: { role: 'upgrader' } },
    ]);
  });
});
