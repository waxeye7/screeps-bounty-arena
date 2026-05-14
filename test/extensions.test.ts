import { describe, expect, it } from 'vitest';

import { chooseExtensionConstructionPositions, planRcl2Extensions } from '../src/planning/extensions';

function pos(x: number, y: number): RoomPosition {
  return { x, y, roomName: 'W1N1', isNearTo: () => false };
}

function structure(id: string, structureType: string, x: number, y: number): Structure {
  return { id, structureType, pos: pos(x, y), hits: 1000, hitsMax: 1000 } as Structure;
}

function site(id: string, structureType: string, x: number, y: number): ConstructionSite {
  return { id, structureType, pos: pos(x, y), my: true } as ConstructionSite;
}

function source(id: string, x: number, y: number): Source {
  return { id, pos: pos(x, y) } as Source;
}

function room({
  spawn = structure('spawn1', STRUCTURE_SPAWN, 25, 25) as StructureSpawn,
  controller = { id: 'controller1', pos: pos(25, 20), level: 2 } as StructureController,
  structures = [spawn],
  constructionSites = [],
  sources = [],
  createCalls = [],
}: {
  spawn?: StructureSpawn;
  controller?: StructureController;
  structures?: Structure[];
  constructionSites?: ConstructionSite[];
  sources?: Source[];
  createCalls?: Array<[number, number, string]>;
} = {}): Room {
  const builtRoom = {
    name: 'W1N1',
    controller,
    find: (type: number) => {
      if (type === FIND_MY_SPAWNS) return [spawn];
      if (type === FIND_STRUCTURES || type === FIND_MY_STRUCTURES) return structures;
      if (type === FIND_CONSTRUCTION_SITES) return constructionSites;
      if (type === FIND_SOURCES) return sources;
      return [];
    },
    createConstructionSite: (x: number, y: number, structureType: string) => {
      createCalls.push([x, y, structureType]);
      return 0;
    },
  } as unknown as Room;
  spawn.room = builtRoom;
  return builtRoom;
}

describe('RCL 2 extension planning', () => {
  it('chooses legal extension positions near spawn without reusing occupied or source-adjacent tiles', () => {
    const spawn = structure('spawn1', STRUCTURE_SPAWN, 25, 25) as StructureSpawn;
    const plannedRoom = room({
      spawn,
      structures: [spawn, structure('road1', 'road', 23, 25)],
      constructionSites: [site('site1', STRUCTURE_EXTENSION, 27, 25)],
      sources: [source('source1', 25, 23)],
    });

    const positions = chooseExtensionConstructionPositions(plannedRoom, 5);

    expect(positions).toHaveLength(5);
    expect(positions).not.toContainEqual({ x: 23, y: 25, roomName: 'W1N1' });
    expect(positions).not.toContainEqual({ x: 27, y: 25, roomName: 'W1N1' });
    expect(positions.some((candidate) => Math.max(Math.abs(candidate.x - 25), Math.abs(candidate.y - 23)) <= 1)).toBe(false);
  });

  it('creates only the remaining RCL 2 extension construction sites and avoids duplicate spam', () => {
    const createCalls: Array<[number, number, string]> = [];
    const spawn = structure('spawn1', STRUCTURE_SPAWN, 25, 25) as StructureSpawn;
    const plannedRoom = room({
      spawn,
      createCalls,
      structures: [spawn, structure('extension1', STRUCTURE_EXTENSION, 23, 25), structure('extension2', STRUCTURE_EXTENSION, 27, 25)],
      constructionSites: [site('extensionSite1', STRUCTURE_EXTENSION, 25, 23)],
    });

    expect(planRcl2Extensions(plannedRoom)).toBe(2);
    expect(createCalls).toHaveLength(2);
    expect(createCalls.every(([, , structureType]) => structureType === STRUCTURE_EXTENSION)).toBe(true);

    createCalls.length = 0;
    const fullRoom = room({
      spawn,
      createCalls,
      structures: [
        spawn,
        structure('extension1', STRUCTURE_EXTENSION, 23, 25),
        structure('extension2', STRUCTURE_EXTENSION, 27, 25),
        structure('extension3', STRUCTURE_EXTENSION, 25, 23),
        structure('extension4', STRUCTURE_EXTENSION, 25, 27),
        structure('extension5', STRUCTURE_EXTENSION, 23, 24),
      ],
    });

    expect(planRcl2Extensions(fullRoom)).toBe(0);
    expect(createCalls).toHaveLength(0);
  });
});
