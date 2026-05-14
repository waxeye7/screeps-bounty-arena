import { describe, expect, it } from 'vitest';

import { planRcl2Extensions } from '../src/planning/extensions';
import { planEarlyRoads, removeExpensiveRoadConstructionSites } from '../src/planning/roads';

// ── Helpers ──────────────────────────────────────────────────────────

function pos(x: number, y: number, roomName = 'W1N1'): RoomPosition {
  return {
    x,
    y,
    roomName,
    isNearTo: (target: RoomObject) =>
      Math.max(
        Math.abs(x - (target.pos.x ?? x)),
        Math.abs(y - (target.pos.y ?? y)),
      ) <= 1,
  };
}

function structure(id: string, structureType: string, x: number, y: number): Structure {
  return { id, structureType, pos: pos(x, y), hits: 1000, hitsMax: 1000 } as Structure;
}

function site(id: string, structureType: string, x: number, y: number): ConstructionSite {
  return { id, structureType, pos: pos(x, y), my: true } as ConstructionSite;
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

function makeRoom({
  spawn,
  controller,
  sources = [],
  structures = [],
  constructionSites = [],
  createResult = 0,
  createCalls,
}: {
  spawn?: StructureSpawn;
  controller?: StructureController;
  sources?: Source[];
  structures?: Structure[];
  constructionSites?: ConstructionSite[];
  createResult?: number | ((x: number, y: number, type: string) => number);
  createCalls?: Array<{ x: number; y: number; structureType: string }>;
}): Room {
  spawn ??= makeSpawn();
  controller ??= { id: 'controller1', pos: pos(25, 20), level: 2 } as StructureController;

  const room = {
    name: 'W1N1',
    controller,
    find: (type: number) => {
      switch (type) {
        case FIND_MY_SPAWNS:
          return [spawn];
        case FIND_SOURCES:
          return sources;
        case FIND_STRUCTURES:
        case FIND_MY_STRUCTURES:
          return [spawn, ...structures];
        case FIND_CONSTRUCTION_SITES:
          return constructionSites;
        default:
          return [];
      }
    },
    createConstructionSite: (x: number, y: number, structureType: string) => {
      createCalls?.push({ x, y, structureType });
      return typeof createResult === 'function' ? createResult(x, y, structureType) : createResult;
    },
  } as unknown as Room;

  spawn.room = room;
  return room;
}

// ── Extension planner: construction-site cap ─────────────────────────

describe('extension planner vs construction-site cap', () => {
  it('does not plan extensions when at the RCL 2 extension limit (5 built)', () => {
    const createCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const fiveExtensions = Array.from({ length: 5 }, (_, i) =>
      structure(`ext${i}`, STRUCTURE_EXTENSION, 23 + i, 25),
    );
    const room = makeRoom({
      spawn,
      structures: [spawn, ...fiveExtensions],
      createCalls,
    });

    expect(planRcl2Extensions(room)).toBe(0);
    expect(createCalls).toHaveLength(0);
  });

  it('does not plan extensions when all 5 slots are filled by pending construction sites', () => {
    const createCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const fivePending = Array.from({ length: 5 }, (_, i) =>
      site(`site${i}`, STRUCTURE_EXTENSION, 23 + i, 25),
    );
    const room = makeRoom({
      spawn,
      constructionSites: fivePending,
      createCalls,
    });

    expect(planRcl2Extensions(room)).toBe(0);
    expect(createCalls).toHaveLength(0);
  });

  it('handles createConstructionSite returning an error code gracefully', () => {
    const createCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    // Return ERR_FULL (-8) for all calls
    const room = makeRoom({
      spawn,
      createResult: -8,
      createCalls,
    });

    // createConstructionSite fails for every position → created = 0
    expect(planRcl2Extensions(room)).toBe(0);
    // It should still have attempted to create sites
    expect(createCalls.length).toBeGreaterThan(0);
  });

  it('does not duplicate positions that already have pending extension sites', () => {
    const createCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    // 3 built extensions + 1 pending
    const built = [
      structure('ext0', STRUCTURE_EXTENSION, 23, 25),
      structure('ext1', STRUCTURE_EXTENSION, 27, 25),
      structure('ext2', STRUCTURE_EXTENSION, 25, 23),
    ];
    const pending = site('pend0', STRUCTURE_EXTENSION, 25, 27);
    const room = makeRoom({
      spawn,
      structures: [spawn, ...built],
      constructionSites: [pending],
      createCalls,
    });

    planRcl2Extensions(room);

    // Should only create 1 more extension (5 - 3 - 1 = 1)
    expect(createCalls).toHaveLength(1);
    // The created position should NOT be the same as the pending site
    expect(createCalls[0]).not.toEqual({ x: 25, y: 27, structureType: STRUCTURE_EXTENSION });
  });
});

// ── Road planner: construction-site cap and error handling ───────────

describe('road planner vs construction-site cap', () => {
  it('respects maxNewSites=0 and creates nothing', () => {
    const createCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const source = { id: 'src', pos: pos(20, 10) } as Source;
    const room = makeRoom({
      spawn,
      sources: [source],
      createCalls,
    });

    const summary = planEarlyRoads(room, { maxNewSites: 0 });
    expect(summary.created).toBe(0);
    expect(createCalls).toHaveLength(0);
  });

  it('skips positions where createConstructionSite returns a non-zero error code', () => {
    const createCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const source = { id: 'src', pos: pos(20, 10) } as Source;
    let callIndex = 0;
    const room = makeRoom({
      spawn,
      sources: [source],
      createResult: () => {
        callIndex++;
        // Fail the first two calls, succeed the rest
        return callIndex <= 2 ? -14 : 0; // ERR_RCL_NOT_ENOUGH
      },
      createCalls,
    });

    const summary = planEarlyRoads(room, { maxNewSites: 20 });

    // Sites that failed should not count as created
    expect(summary.created).toBeLessThan(createCalls.length);
    expect(summary.created).toBeGreaterThan(0);
  });

  it('does not create road sites at positions that overlap with existing roads', () => {
    const createCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const source = { id: 'src', pos: pos(20, 10) } as Source;
    // Road already built on (11, 10)
    const existingRoad = structure('road1', STRUCTURE_ROAD, 11, 10);
    const room = makeRoom({
      spawn,
      sources: [source],
      structures: [existingRoad],
      createCalls,
    });

    planEarlyRoads(room, { maxNewSites: 20 });

    const hasDuplicate = createCalls.some((c) => c.x === 11 && c.y === 10);
    expect(hasDuplicate).toBe(false);
  });

  it('does not create road sites at positions that overlap with existing construction sites', () => {
    const createCalls: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const source = { id: 'src', pos: pos(20, 10) } as Source;
    // Already a construction site at (11, 10)
    const pendingSite = site('site1', STRUCTURE_ROAD, 11, 10);
    const room = makeRoom({
      spawn,
      sources: [source],
      constructionSites: [pendingSite],
      createCalls,
    });

    planEarlyRoads(room, { maxNewSites: 20 });

    const hasDuplicate = createCalls.some((c) => c.x === 11 && c.y === 10);
    expect(hasDuplicate).toBe(false);
  });

  it('does not plan duplicate road sites on repeated ticks', () => {
    const createCalls1: Array<{ x: number; y: number; structureType: string }> = [];
    const createCalls2: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const source = { id: 'src', pos: pos(20, 10) } as Source;

    // Tick 1: fresh room
    const room1 = makeRoom({ spawn, sources: [source], createCalls: createCalls1 });
    planEarlyRoads(room1, { maxNewSites: 20 });

    // Tick 2: room now has the sites from tick 1 as construction sites
    const tick1Sites = createCalls1.map((c, i) => site(`t1s${i}`, c.structureType, c.x, c.y));
    const room2 = makeRoom({
      spawn,
      sources: [source],
      constructionSites: tick1Sites,
      createCalls: createCalls2,
    });
    planEarlyRoads(room2, { maxNewSites: 20 });

    // No overlap between tick 1 and tick 2 created positions
    for (const c1 of createCalls1) {
      const overlap = createCalls2.some(
        (c2) => c2.x === c1.x && c2.y === c1.y,
      );
      expect(overlap).toBe(false);
    }
  });
});

// ── Expensive road cleanup ───────────────────────────────────────────

describe('expensive road construction site cleanup', () => {
  it('does not remove non-road construction sites regardless of cost', () => {
    const removed: string[] = [];
    const spawn = makeSpawn();
    const expensiveExtension = {
      id: 'exp-ext',
      pos: pos(11, 10),
      structureType: STRUCTURE_EXTENSION,
      progressTotal: 50_000,
      remove: () => { removed.push('exp-ext'); return 0; },
    } as ConstructionSite;
    const room = makeRoom({
      spawn,
      constructionSites: [expensiveExtension],
    });

    expect(removeExpensiveRoadConstructionSites(room)).toBe(0);
    expect(removed).toHaveLength(0);
  });

  it('removes only road sites with progressTotal exceeding the threshold', () => {
    const removed: string[] = [];
    const spawn = makeSpawn();
    const normalRoad = {
      id: 'normal',
      pos: pos(11, 10),
      structureType: STRUCTURE_ROAD,
      progressTotal: 300,
      remove: () => { removed.push('normal'); return 0; },
    } as ConstructionSite;
    const thresholdRoad = {
      id: 'threshold',
      pos: pos(12, 10),
      structureType: STRUCTURE_ROAD,
      progressTotal: 1500,
      remove: () => { removed.push('threshold'); return 0; },
    } as ConstructionSite;
    const expensiveRoad = {
      id: 'expensive',
      pos: pos(13, 10),
      structureType: STRUCTURE_ROAD,
      progressTotal: 5000,
      remove: () => { removed.push('expensive'); return 0; },
    } as ConstructionSite;
    const room = makeRoom({
      spawn,
      constructionSites: [normalRoad, thresholdRoad, expensiveRoad],
    });

    removeExpensiveRoadConstructionSites(room, { maxProgressTotal: 1500 });

    // Only the site with progressTotal > 1500 should be removed
    expect(removed).toEqual(['expensive']);
  });
});
