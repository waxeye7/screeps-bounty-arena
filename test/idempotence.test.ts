import { describe, expect, it, beforeEach } from 'vitest';

import { planRcl2Extensions, chooseExtensionConstructionPositions } from '../src/planning/extensions';
import { planEarlyRoads, removeExpensiveRoadConstructionSites } from '../src/planning/roads';
import { ensureBasicHarvesters, ensureBasicUpgraders, ensureBasicBuilders, ensureBasicRepairers, ensureEmergencyRecovery } from '../src/planning/spawn';
import { cleanupDeadCreeps, migrateRoomMemory } from '../src/memory';

// ---------------------------------------------------------------------------
// Helper factories matching patterns in roads.test.ts / extensions.test.ts
// ---------------------------------------------------------------------------

function pos(x: number, y: number, roomName = 'W1N1'): RoomPosition {
  return { x, y, roomName, isNearTo: () => false };
}

function source(id: string, x: number, y: number): Source {
  return { id, pos: pos(x, y) } as Source;
}

function structure(id: string, structureType: string, x: number, y: number): Structure {
  return { id, structureType, pos: pos(x, y), hits: 1000, hitsMax: 1000 } as Structure;
}

function site(id: string, structureType: string, x: number, y: number): ConstructionSite {
  return { id, structureType, pos: pos(x, y), my: true } as ConstructionSite;
}

// ---------------------------------------------------------------------------
// Room builder — shared between tests that check createConstructionSite calls
// ---------------------------------------------------------------------------

interface RoomBuilderInput {
  spawn?: StructureSpawn;
  controller?: StructureController;
  structures?: Structure[];
  constructionSites?: ConstructionSite[];
  sources?: Source[];
  createCalls?: Array<[number, number, string]>;
}

function makeRoom({
  spawn = structure('spawn1', STRUCTURE_SPAWN, 25, 25) as StructureSpawn,
  controller = { id: 'controller1', pos: pos(25, 20), level: 2 } as StructureController,
  structures = [spawn],
  constructionSites = [],
  sources = [],
  createCalls = [],
}: RoomBuilderInput = {}): Room {
  const room = {
    name: 'W1N1',
    controller,
    find: (type: number) => {
      switch (type) {
        case FIND_MY_SPAWNS: return [spawn];
        case FIND_SOURCES: return sources;
        case FIND_STRUCTURES:
        case FIND_MY_STRUCTURES: return [spawn, ...structures];
        case FIND_CONSTRUCTION_SITES: return constructionSites;
        default: return [];
      }
    },
    createConstructionSite: (x: number, y: number, structureType: string) => {
      createCalls.push([x, y, structureType]);
      return 0;
    },
  } as unknown as Room;
  spawn.room = room;
  return room;
}

function makeSpawnWithRoom(
  energyAvailable = 300,
  constructionSites: ConstructionSite[] = [],
  sourcesList: Source[] = [source('s1', 20, 20)],
  spawning: unknown = null,
): StructureSpawn {
  return {
    id: 'spawn1',
    name: 'Spawn1',
    spawning,
    pos: pos(25, 25),
    room: {
      energyAvailable,
      find: (type: number) => {
        if (type === FIND_CONSTRUCTION_SITES) return constructionSites;
        if (type === FIND_SOURCES) return sourcesList;
        return [];
      },
    },
    structureType: STRUCTURE_SPAWN,
    spawnCreep: () => 0,
  } as unknown as StructureSpawn;
}

// ---------------------------------------------------------------------------
// Idempotence tests — repeated ticks must not create runaway behaviour
// ---------------------------------------------------------------------------

describe('idempotence: extension planner does not create duplicate sites', () => {
  it('planRcl2Extensions creates sites only once when pending sites carry over between ticks', () => {
    const createCalls: Array<[number, number, string]> = [];
    const sites: ConstructionSite[] = [];
    const extRoom = makeRoom({ createCalls, constructionSites: sites });

    // Tick 1 — first planning pass creates extension sites
    const firstCount = planRcl2Extensions(extRoom);
    // Expect at least one after the first pass (RCL 2 room with no existing sites)
    expect(firstCount).toBeGreaterThan(0);

    // Simulate the sites being registered as pending for the next tick
    // by moving createCalls into the constructionSites array
    for (const [x, y, st] of createCalls) {
      sites.push(site(`ext-${x}-${y}`, st, x, y));
    }
    createCalls.length = 0;

    // Tick 2 — same room, sites now visible as construction sites
    const secondCount = planRcl2Extensions(extRoom);
    expect(secondCount).toBe(0);
    expect(createCalls).toHaveLength(0);
  });
});

describe('idempotence: road planner does not duplicate sites between ticks', () => {
  it('planEarlyRoads produces zero new sites when all path positions are already occupied', () => {
    const createCalls: Array<[number, number, string]> = [];
    const builtSites: ConstructionSite[] = [];
    const spawn = structure('spawn1', STRUCTURE_SPAWN, 10, 10) as StructureSpawn;
    const roadSource = source('rs', 20, 10);
    const roadController = { id: 'ctl', pos: pos(10, 20) } as StructureController;

    // Tick 1 — create all road sites for the path (high maxNewSites so the full path fits)
    const room1 = makeRoom({
      spawn,
      sources: [roadSource],
      controller: roadController,
      constructionSites: builtSites,
      createCalls,
    });
    const summary1 = planEarlyRoads(room1, { maxNewSites: 20 });
    expect(summary1.created).toBeGreaterThan(0);

    // Move created sites into the room's constructionSites array for the next tick
    for (const [x, y, st] of createCalls) {
      builtSites.push(site(`road-${x}-${y}`, st, x, y));
    }
    createCalls.length = 0;

    // Tick 2 — same room, all road positions now occupied
    const room2 = makeRoom({
      spawn,
      sources: [roadSource],
      controller: roadController,
      constructionSites: builtSites,
      createCalls,
    });
    const summary2 = planEarlyRoads(room2, { maxNewSites: 20 });

    // All positions already occupied — no new sites should be created
    expect(summary2.created).toBe(0);
    expect(createCalls).toHaveLength(0);
    // All candidates should have been skipped as existing
    expect(summary2.skippedExisting).toBe(summary2.candidates);
  });
});

describe('idempotence: extension planner respects pending sites from previous ticks', () => {
  it('does not call createConstructionSite for slots already pending', () => {
    const createCalls: Array<[number, number, string]> = [];
    const spawn = structure('spawn1', STRUCTURE_SPAWN, 25, 25) as StructureSpawn;
    const pendingExtension = site('pending-ext', STRUCTURE_EXTENSION, 23, 25);

    // Room with one extension already under construction
    const builtRoom = makeRoom({
      spawn,
      constructionSites: [pendingExtension],
      createCalls,
    });

    // Run planning — should avoid the pending extension slot
    const count = planRcl2Extensions(builtRoom);
    expect(typeof count).toBe('number');

    // None should try to create on top of the pending site
    const pendingKey = '23,25';
    for (const [x, y] of createCalls) {
      expect(`${x},${y}`).not.toBe(pendingKey);
    }
  });
});

describe('idempotence: memory cleanup and room migration', () => {
  beforeEach(() => {
    globalThis.Game = {
      time: 1,
      creeps: {},
      spawns: {},
      rooms: {},
    } as GameGlobal;
    globalThis.Memory = { creeps: {}, rooms: {} };
  });

  it('cleanupDeadCreeps is idempotent on repeated ticks', () => {
    // Seed Memory.creeps with a dead creep
    globalThis.Memory.creeps = {
      DeadHarvester: { role: 'harvester' },
    };
    globalThis.Game.creeps = {};

    // Tick 1 — removes the dead creep
    const removed1 = cleanupDeadCreeps();
    expect(removed1).toEqual(['DeadHarvester']);
    expect(Object.keys(globalThis.Memory.creeps)).toHaveLength(0);

    // Tick 2 — nothing to remove, no errors
    const removed2 = cleanupDeadCreeps();
    expect(removed2).toEqual([]);
    expect(Object.keys(globalThis.Memory.creeps)).toHaveLength(0);
  });

  it('cleanupDeadCreeps only removes creeps that are actually dead', () => {
    globalThis.Memory.creeps = {
      Alive: { role: 'harvester' },
    };
    globalThis.Game.creeps = {
      Alive: { memory: { role: 'harvester' } } as Creep,
    };

    // Tick 1 — Alive is alive
    const removed1 = cleanupDeadCreeps();
    expect(removed1).toEqual([]);
    expect(Object.keys(globalThis.Memory.creeps)).toEqual(['Alive']);

    // Tick 2 — still alive
    const removed2 = cleanupDeadCreeps();
    expect(removed2).toEqual([]);
    expect(Object.keys(globalThis.Memory.creeps)).toEqual(['Alive']);
  });

  it('migrateRoomMemory does not churn already-migrated rooms', () => {
    globalThis.Game.rooms = {
      W1N1: {} as Room,
    };

    // Tick 1 — migrate
    migrateRoomMemory();
    expect(globalThis.Memory.rooms?.W1N1?.version).toBe(1);

    // Tick 2 — migrate again (creates a new object via spread, so check value equality)
    migrateRoomMemory();
    expect(globalThis.Memory.rooms?.W1N1?.version).toBe(1);
    // The memory shape should be stable
    expect(globalThis.Memory.rooms?.W1N1).toStrictEqual({ version: 1 });
  });
});

describe('idempotence: spawn planner blocks identical failing spawns in the same tick', () => {
  beforeEach(() => {
    globalThis.Game = {
      time: 100,
      creeps: {},
      spawns: {},
    } as GameGlobal;
    globalThis.Memory = { creeps: {}, rooms: {} };
  });

  it('blocks repeated identical failing spawn attempts in a single tick', () => {
    const calls: unknown[] = [];
    const spawn = makeSpawnWithRoom(300) as StructureSpawn;

    // Make spawnCreep fail (e.g., not enough energy for the body)
    spawn.spawnCreep = (...args: unknown[]) => {
      calls.push(args);
      return -6; // ERR_NOT_ENOUGH_ENERGY
    };

    // First attempt — fails
    ensureBasicHarvesters(spawn, 2);
    expect(calls).toHaveLength(1);

    // Second attempt in same tick — should be blocked by failedSpawnAttempts
    ensureBasicHarvesters(spawn, 2);
    expect(calls).toHaveLength(1);

    // Third attempt — still blocked
    ensureBasicUpgraders(spawn, 1);
    expect(calls).toHaveLength(1);
  });

  it('allows fresh spawn attempt on the next tick after a failure', () => {
    // Use a distinct Game.time to avoid stale entries in the module-level
    // failedSpawnAttempts Map from the previous test
    globalThis.Game.time = 200;
    const calls: unknown[] = [];
    const spawn = makeSpawnWithRoom(300) as StructureSpawn;

    spawn.spawnCreep = (...args: unknown[]) => {
      calls.push(args);
      return -6;
    };

    // Tick 200 — fails
    ensureBasicHarvesters(spawn, 2);
    expect(calls).toHaveLength(1);

    // Same tick — blocked
    ensureBasicHarvesters(spawn, 2);
    expect(calls).toHaveLength(1);

    // Tick 201 — should retry
    globalThis.Game.time = 201;
    ensureBasicHarvesters(spawn, 2);
    expect(calls).toHaveLength(2);
  });
});

describe('idempotence: simulation output stability', () => {
  it('cleanupDeadCreeps produces same result on second invocation with same state', () => {
    globalThis.Game = {
      time: 1,
      creeps: {
        Harvester1: { memory: { role: 'harvester' } } as Creep,
      },
      spawns: {},
      rooms: {},
    } as GameGlobal;
    globalThis.Memory = { creeps: { Harvester1: { role: 'harvester' } }, rooms: {} };

    // Run twice with identical state
    const first = cleanupDeadCreeps();
    const second = cleanupDeadCreeps();

    expect(first).toEqual(second);
  });

  it('does not produce unbounded memory growth across repeated cleanup ticks', () => {
    globalThis.Game = {
      time: 1,
      creeps: {},
      spawns: {},
      rooms: {},
    } as GameGlobal;
    globalThis.Memory = { creeps: {}, rooms: {} };

    // Simulate 10 ticks of cleanup with no creeps
    for (let tick = 1; tick <= 10; tick += 1) {
      globalThis.Game.time = tick;
      cleanupDeadCreeps();
      migrateRoomMemory();
    }

    // Memory should not have accumulated orphaned entries
    expect(Object.keys(globalThis.Memory.creeps)).toHaveLength(0);
    expect(globalThis.Memory.rooms ?? {}).toEqual({});
  });
});
