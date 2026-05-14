import { describe, expect, it } from 'vitest';

import { planEarlyRoads, roadPath } from '../src/planning/roads';

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

function makeRoom({
  spawn,
  sources = [],
  controller,
  structures = [],
  constructionSites = [],
  created = [],
}: {
  spawn: StructureSpawn;
  sources?: Source[];
  controller?: StructureController;
  structures?: Structure[];
  constructionSites?: ConstructionSite[];
  created?: Array<{ x: number; y: number; structureType: string }>;
}): Room {
  const room = {
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
      created.push({ x, y, structureType });
      return 0;
    },
  } as unknown as Room;

  spawn.room = room;
  return room;
}

function makeSpawn(x = 10, y = 10): StructureSpawn {
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

describe('early road planner', () => {
  it('creates deterministic road sites from the spawn to sources and controller', () => {
    const created: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const sourceA = { id: 'source-a', pos: pos(16, 10) } as Source;
    const sourceB = { id: 'source-b', pos: pos(10, 16) } as Source;
    const controller = {
      id: 'controller',
      pos: pos(14, 14),
    } as StructureController;
    const room = makeRoom({
      spawn,
      sources: [sourceA, sourceB],
      controller,
      created,
    });

    const summary = planEarlyRoads(room, { maxNewSites: 20 });

    expect(summary).toMatchObject({ targets: 3, created: 10 });
    expect(created).toEqual([
      { x: 11, y: 10, structureType: STRUCTURE_ROAD },
      { x: 12, y: 10, structureType: STRUCTURE_ROAD },
      { x: 13, y: 10, structureType: STRUCTURE_ROAD },
      { x: 14, y: 10, structureType: STRUCTURE_ROAD },
      { x: 10, y: 11, structureType: STRUCTURE_ROAD },
      { x: 10, y: 12, structureType: STRUCTURE_ROAD },
      { x: 10, y: 13, structureType: STRUCTURE_ROAD },
      { x: 10, y: 14, structureType: STRUCTURE_ROAD },
      { x: 13, y: 11, structureType: STRUCTURE_ROAD },
      { x: 14, y: 12, structureType: STRUCTURE_ROAD },
    ]);
    expect(created).not.toContainEqual({
      x: 11,
      y: 11,
      structureType: STRUCTURE_ROAD,
    });
  });

  it('skips existing roads and construction sites instead of duplicating them', () => {
    const created: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const source = { id: 'source-a', pos: pos(16, 10) } as Source;
    const existingRoad = {
      id: 'road1',
      pos: pos(11, 10),
      structureType: STRUCTURE_ROAD,
      hits: 1000,
      hitsMax: 5000,
    } as Structure;
    const extensionSite = {
      id: 'extension-site',
      pos: pos(12, 10),
      structureType: STRUCTURE_EXTENSION,
    } as ConstructionSite;
    const room = makeRoom({
      spawn,
      sources: [source],
      structures: [existingRoad],
      constructionSites: [extensionSite],
      created,
    });

    const summary = planEarlyRoads(room, { maxNewSites: 10 });

    expect(summary).toMatchObject({ created: 2, skippedExisting: 2 });
    expect(created).toEqual([
      { x: 13, y: 10, structureType: STRUCTURE_ROAD },
      { x: 14, y: 10, structureType: STRUCTURE_ROAD },
    ]);
  });

  it('caps new road sites per planning pass', () => {
    const created: Array<{ x: number; y: number; structureType: string }> = [];
    const spawn = makeSpawn();
    const source = { id: 'source-a', pos: pos(20, 10) } as Source;
    const room = makeRoom({ spawn, sources: [source], created });

    const summary = planEarlyRoads(room, { maxNewSites: 3 });

    expect(summary.created).toBe(3);
    expect(created).toHaveLength(3);
  });

  it('keeps the first two tiles in a spawn exit corridor so diagonal extension slots remain open', () => {
    expect(roadPath(pos(10, 10), pos(16, 16)).slice(0, 3)).toEqual([
      { x: 11, y: 10, roomName: 'W1N1' },
      { x: 12, y: 10, roomName: 'W1N1' },
      { x: 13, y: 11, roomName: 'W1N1' },
    ]);
  });
});
