import { describe, expect, it } from 'vitest';

import { buildWorkerBody, ensureBasicBuilders, ensureBasicHarvesters, ensureBasicUpgraders, ensureEmergencyRecovery } from '../src/planning/spawn';

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

function makeSpawn(calls: unknown[], energyAvailable = 200, constructionSites: ConstructionSite[] = []): StructureSpawn {
  return {
    id: 'spawn1',
    name: 'Spawn1',
    spawning: null,
    pos: { isNearTo: () => true },
    room: {
      energyAvailable,
      find: (type: number) => (type === FIND_CONSTRUCTION_SITES ? constructionSites : []),
    },
    structureType: STRUCTURE_SPAWN,
    spawnCreep: (...args: unknown[]) => {
      calls.push(args);
      return 0;
    },
  } as unknown as StructureSpawn;
}

describe('spawn planning', () => {

  it('detects emergency and spawns recovery worker when no harvesters or miners exist', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 999,
      creeps: {},
      spawns: {},
    } as GameGlobal;

    const spawn = makeSpawn(calls, 100);
    const isEmergency = ensureEmergencyRecovery(spawn);

    expect(isEmergency).toBe(true);
    expect(calls).toHaveLength(1);
    // Even with 100 energy, it tries to build a 200 energy body (fallback minimal)
    expect(calls[0]).toEqual([[WORK, CARRY, MOVE], 'RecoveryHarvester999', { memory: { role: 'harvester' } }]);
  });

  it('detects emergency and uses available energy for recovery worker', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 999,
      creeps: {},
      spawns: {},
    } as GameGlobal;

    const spawn = makeSpawn(calls, 300);
    const isEmergency = ensureEmergencyRecovery(spawn);

    expect(isEmergency).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([[WORK, CARRY, MOVE, WORK], 'RecoveryHarvester999', { memory: { role: 'harvester' } }]);
  });

  it('returns false for non-emergency scenarios', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 999,
      creeps: {
        Harvester1: { memory: { role: 'harvester' } } as Creep,
      },
      spawns: {},
    } as GameGlobal;

    const spawn = makeSpawn(calls, 300);
    const isEmergency = ensureEmergencyRecovery(spawn);

    expect(isEmergency).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('spawns a harvester when below target', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 123,
      creeps: {},
      spawns: {},
    } as GameGlobal;

    ensureBasicHarvesters(makeSpawn(calls, 400), 1);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      [WORK, CARRY, MOVE, WORK, CARRY, MOVE],
      'Harvester123',
      { memory: { role: 'harvester' } },
    ]);
  });

  it('spawns an upgrader after basic harvester coverage exists', () => {
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

    ensureBasicUpgraders(makeSpawn(calls), 1);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([[WORK, CARRY, MOVE], 'Upgrader456', { memory: { role: 'upgrader' } }]);
  });

  it('spawns a builder when construction exists after basic harvester coverage', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 789,
      creeps: {
        Harvester1: { memory: { role: 'harvester' } } as Creep,
        Harvester2: { memory: { role: 'harvester' } } as Creep,
        Harvester3: { memory: { role: 'harvester' } } as Creep,
      },
      spawns: {},
    } as GameGlobal;

    const site = { id: 'site1', pos: { isNearTo: () => true } } as ConstructionSite;
    ensureBasicBuilders(makeSpawn(calls, 200, [site]), 1);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([[WORK, CARRY, MOVE], 'Builder789', { memory: { role: 'builder' } }]);
  });
});
