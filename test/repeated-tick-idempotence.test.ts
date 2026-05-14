import { describe, expect, it } from 'vitest';

import { planRcl2Extensions } from '../src/planning/extensions';
import { planEarlyRoads } from '../src/planning/roads';
import { ensureBasicHarvesters, ensureBasicUpgraders, ensureBasicBuilders } from '../src/planning/spawn';
import { cleanupDeadCreeps, migrateRoomMemory, migrateRoomMemoryRecord } from '../src/memory';

// ── Helpers ──────────────────────────────────────────────────────────

function pos(x: number, y: number, roomName = 'W1N1'): RoomPosition {
  return { x, y, roomName, isNearTo: () => false };
}

function makeSpawn(x = 25, y = 25): StructureSpawn {
  return {
    id: 'spawn1',
    name: 'Spawn1',
    pos: pos(x, y),
    room: undefined,
    spawning: null,
    store: { getFreeCapacity: () => 300, getUsedCapacity: () => 0 },
    structureType: STRUCTURE_SPAWN,
    spawnCreep: () => 0,
  } as unknown as StructureSpawn;
}

function makeRoom(opts: {
  spawn?: StructureSpawn;
  controller?: StructureController;
  sources?: Source[];
  structures?: Structure[];
  constructionSites?: ConstructionSite[];
  createCalls?: Array<{ x: number; y: number; structureType: string }>;
  createResult?: number;
}): Room {
  const spawn = opts.spawn ?? makeSpawn();
  const controller = opts.controller ?? { id: 'ctrl', pos: pos(25, 20), level: 2 } as StructureController;

  const room = {
    name: 'W1N1',
    controller,
    find: (type: number) => {
      switch (type) {
        case FIND_MY_SPAWNS: return [spawn];
        case FIND_SOURCES: return opts.sources ?? [];
        case FIND_STRUCTURES:
        case FIND_MY_STRUCTURES: return [spawn, ...(opts.structures ?? [])];
        case FIND_CONSTRUCTION_SITES: return opts.constructionSites ?? [];
        default: return [];
      }
    },
    createConstructionSite: (x: number, y: number, structureType: string) => {
      opts.createCalls?.push({ x, y, structureType });
      return opts.createResult ?? 0;
    },
  } as unknown as Room;
  spawn.room = room;
  return room;
}

// ── Duplicate construction sites ────────────────────────────────────

describe('repeated tick idempotence: no duplicate construction sites', () => {
  it('planRcl2Extensions produces no duplicates across identical ticks', () => {
    const calls1: Array<{ x: number; y: number; structureType: string }> = [];
    const calls2: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();

    // Tick 1
    const room1 = makeRoom({ spawn, createCalls: calls1 });
    planRcl2Extensions(room1);

    // Tick 2: sites from tick 1 are now construction sites
    const sites1 = calls1.map((c, i) => ({
      id: `s1-${i}`, structureType: c.structureType, pos: pos(c.x, c.y), my: true,
    })) as ConstructionSite[];
    const room2 = makeRoom({ spawn, constructionSites: sites1, createCalls: calls2 });
    planRcl2Extensions(room2);

    for (const c1 of calls1) {
      expect(calls2).not.toContainEqual(c1);
    }
  });

  it('planEarlyRoads produces no duplicates across identical ticks', () => {
    const calls1: Array<{ x: number; y: number; structureType: string }> = [];
    const calls2: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const source = { id: 'src', pos: pos(20, 10) } as Source;

    const room1 = makeRoom({ spawn, sources: [source], createCalls: calls1 });
    planEarlyRoads(room1, { maxNewSites: 20 });

    const sites1 = calls1.map((c, i) => ({
      id: `s1-${i}`, structureType: c.structureType, pos: pos(c.x, c.y), my: true,
    })) as ConstructionSite[];
    const room2 = makeRoom({ spawn, sources: [source], constructionSites: sites1, createCalls: calls2 });
    planEarlyRoads(room2, { maxNewSites: 20 });

    for (const c1 of calls1) {
      expect(calls2).not.toContainEqual(c1);
    }
  });

  it('combined planning produces no duplicates when roads and extensions run on same tick', () => {
    const extCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const roadCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const source = { id: 'src', pos: pos(20, 10) } as Source;

    // Both plan functions share the same room state
    const allCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const room = makeRoom({
      spawn,
      sources: [source],
      createCalls: allCalls,
    });

    // Extensions first
    const extRoom = makeRoom({ spawn, sources: [source], createCalls: extCalls });
    planRcl2Extensions(extRoom);

    // Roads see extension sites as construction sites
    const extSites = extCalls.map((c, i) => ({
      id: `ext-${i}`, structureType: c.structureType, pos: pos(c.x, c.y), my: true,
    })) as ConstructionSite[];
    const roadRoom = makeRoom({
      spawn,
      sources: [source],
      constructionSites: extSites,
      createCalls: roadCalls,
    });
    planEarlyRoads(roadRoom, { maxNewSites: 20 });

    // No road should overlap with any extension position
    for (const ext of extCalls) {
      expect(roadCalls).not.toContainEqual(ext);
    }
  });
});

// ── Memory assignment churn ──────────────────────────────────────────

describe('repeated tick idempotence: no memory churn', () => {
  it('migrateRoomMemoryRecord produces stable output on repeated calls', () => {
    const input = { version: 1 };
    const result1 = migrateRoomMemoryRecord(input);
    const result2 = migrateRoomMemoryRecord(result1);

    expect(result1).toEqual(result2);
  });

  it('migrateRoomMemoryRecord does not accumulate extra keys on repeated migration', () => {
    const input: Partial<RoomMemory> = {};
    const result1 = migrateRoomMemoryRecord(input);
    const result2 = migrateRoomMemoryRecord(result1);
    const result3 = migrateRoomMemoryRecord(result2);

    const keys1 = Object.keys(result1).sort();
    const keys2 = Object.keys(result2).sort();
    const keys3 = Object.keys(result3).sort();

    expect(keys1).toEqual(keys2);
    expect(keys2).toEqual(keys3);
  });

  it('cleanupDeadCreeps is stable when called repeatedly with no dead creeps', () => {
    // Reset Memory
    (globalThis as Record<string, unknown>).Memory = { creeps: {} };
    const origGame = globalThis.Game;
    (globalThis as Record<string, unknown>).Game = {
      ...origGame,
      creeps: {},
      spawns: {},
      rooms: {},
      time: 100,
    };

    const result1 = cleanupDeadCreeps();
    const result2 = cleanupDeadCreeps();

    expect(result1).toEqual([]);
    expect(result2).toEqual([]);

    (globalThis as Record<string, unknown>).Game = origGame;
  });

  it('cleanupDeadCreeps removes dead creeps and becomes stable', () => {
    (globalThis as Record<string, unknown>).Memory = {
      creeps: { deadCreep1: { role: 'harvester' }, aliveCreep: { role: 'upgrader' } },
    };

    // Simulate Game.creeps only having aliveCreep
    const origGame = globalThis.Game;
    (globalThis as Record<string, unknown>).Game = {
      ...origGame,
      creeps: { aliveCreep: { name: 'aliveCreep' } },
      spawns: {},
      rooms: {},
      time: 100,
    };

    const result = cleanupDeadCreeps();
    expect(result).toEqual(['deadCreep1']);

    // Second call should be stable (no more removals)
    const result2 = cleanupDeadCreeps();
    expect(result2).toEqual([]);

    // Restore
    (globalThis as Record<string, unknown>).Game = origGame;
  });
});

// ── Spawn attempts ───────────────────────────────────────────────────

describe('repeated tick idempotence: no repeated spawn attempts', () => {
  it('ensureBasicHarvesters does not attempt spawn when already at desired count', () => {
    const spawn = makeSpawn();
    const room = makeRoom({ spawn });

    // Simulate 3 harvesters already exist
    const origGame = globalThis.Game;
    const harvesterCreeps = Object.fromEntries(
      [0, 1, 2].map((i) => [`h${i}`, { name: `h${i}`, memory: { role: 'harvester' }, room }]),
    );
    (globalThis as Record<string, unknown>).Game = {
      ...origGame,
      creeps: harvesterCreeps,
      spawns: { Spawn1: spawn },
      rooms: {},
      time: 100,
    };

    let spawnAttempts = 0;
    spawn.spawnCreep = () => { spawnAttempts++; return 0; };

    ensureBasicHarvesters(spawn, 3);

    expect(spawnAttempts).toBe(0);

    (globalThis as Record<string, unknown>).Game = origGame;
  });

  it('ensureBasicUpgraders does not attempt spawn when harvesters are below threshold', () => {
    const spawn = makeSpawn();
    const room = makeRoom({ spawn });

    const origGame = globalThis.Game;
    (globalThis as Record<string, unknown>).Game = {
      ...origGame,
      creeps: { h0: { name: 'h0', memory: { role: 'harvester' }, room } },
      spawns: { Spawn1: spawn },
      rooms: {},
      time: 100,
    };

    let spawnAttempts = 0;
    spawn.spawnCreep = () => { spawnAttempts++; return 0; };

    // Only 1 harvester, need 3 before spawning upgraders
    ensureBasicUpgraders(spawn, 1, 3);

    expect(spawnAttempts).toBe(0);

    (globalThis as Record<string, unknown>).Game = origGame;
  });

  it('ensureBasicBuilders does not spawn when no construction sites exist', () => {
    const spawn = makeSpawn();
    const room = makeRoom({ spawn });

    const origGame = globalThis.Game;
    (globalThis as Record<string, unknown>).Game = {
      ...origGame,
      creeps: {},
      spawns: { Spawn1: spawn },
      rooms: {},
      time: 100,
    };

    let spawnAttempts = 0;
    spawn.spawnCreep = () => { spawnAttempts++; return 0; };

    // No construction sites → builder should not spawn
    ensureBasicBuilders(spawn, 1, 0);

    expect(spawnAttempts).toBe(0);

    (globalThis as Record<string, unknown>).Game = origGame;
  });
});

// ── Unbounded growth prevention ──────────────────────────────────────

describe('repeated tick idempotence: no unbounded output growth', () => {
  it('road planning output is bounded by maxNewSites across repeated calls', () => {
    const spawn = makeSpawn();
    const source = { id: 'src', pos: pos(30, 10) } as Source;

    let totalCreated = 0;
    let currentSites: ConstructionSite[] = [];

    for (let tick = 0; tick < 10; tick++) {
      const calls: Array<{ x: number; y: number; structureType: string }> = [];
      const room = makeRoom({
        spawn,
        sources: [source],
        constructionSites: currentSites,
        createCalls: calls,
      });
      const summary = planEarlyRoads(room, { maxNewSites: 5 });

      totalCreated += summary.created;
      currentSites = [
        ...currentSites,
        ...calls.map((c, i) => ({
          id: `tick${tick}-s${i}`, structureType: c.structureType, pos: pos(c.x, c.y), my: true,
        })),
      ] as ConstructionSite[];
    }

    // After the first tick creates up to 5, subsequent ticks should find all positions already occupied
    // so totalCreated should equal the first tick's creation count (bounded)
    expect(totalCreated).toBeLessThanOrEqual(15); // generous upper bound; in practice roads are finite
  });
});
