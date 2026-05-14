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

const defaultSource = { id: 'source1', pos: { isNearTo: () => true } } as Source;

function makeSpawn(
  calls: unknown[],
  energyAvailable = 200,
  constructionSites: ConstructionSite[] = [],
  sources: Source[] = [defaultSource],
  spawning: unknown = null,
  spawnResult = 0,
): StructureSpawn {
  return {
    id: 'spawn1',
    name: 'Spawn1',
    spawning,
    pos: { isNearTo: () => true },
    room: {
      energyAvailable,
      find: (type: number) => {
        if (type === FIND_CONSTRUCTION_SITES) return constructionSites;
        if (type === FIND_SOURCES) return sources;
        return [];
      },
    },
    structureType: STRUCTURE_SPAWN,
    spawnCreep: (...args: unknown[]) => {
      calls.push(args);
      return spawnResult;
    },
  } as unknown as StructureSpawn;
}

describe('spawn planning', () => {

  it('detects emergency but waits when energy is below the cheapest worker body', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 999,
      creeps: {},
      spawns: {},
    } as GameGlobal;

    const spawn = makeSpawn(calls, 100);
    const isEmergency = ensureEmergencyRecovery(spawn);

    expect(isEmergency).toBe(true);
    expect(calls).toHaveLength(0);
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

  it('does not spawn a harvester while the spawn is busy', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 124,
      creeps: {},
      spawns: {},
    } as GameGlobal;

    ensureBasicHarvesters(makeSpawn(calls, 300, [], [defaultSource], { name: 'Harvester123' }), 1);

    expect(calls).toHaveLength(0);
  });

  it('does not spawn a harvester when room energy is below the cheapest worker body', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 125,
      creeps: {},
      spawns: {},
    } as GameGlobal;

    ensureBasicHarvesters(makeSpawn(calls, 199), 1);

    expect(calls).toHaveLength(0);
  });

  it('does not spawn a harvester when no sources are visible', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 126,
      creeps: {},
      spawns: {},
    } as GameGlobal;

    ensureBasicHarvesters(makeSpawn(calls, 300, [], []), 1);

    expect(calls).toHaveLength(0);
  });

  it('does not spawn a harvester when the desired count is already satisfied', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 127,
      creeps: {
        Harvester1: { memory: { role: 'harvester' } } as Creep,
      },
      spawns: {},
    } as GameGlobal;

    ensureBasicHarvesters(makeSpawn(calls, 300), 1);

    expect(calls).toHaveLength(0);
  });

  it('does not repeat failed spawn attempts in the same tick', () => {
    const calls: unknown[] = [];
    globalThis.Game = {
      time: 128,
      creeps: {},
      spawns: {},
    } as GameGlobal;

    const spawn = makeSpawn(calls, 300, [], [defaultSource], null, -6);
    ensureBasicHarvesters(spawn, 1);
    ensureBasicHarvesters(spawn, 1);

    expect(calls).toHaveLength(1);

    globalThis.Game.time = 129;
    ensureBasicHarvesters(spawn, 1);

    expect(calls).toHaveLength(2);
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
