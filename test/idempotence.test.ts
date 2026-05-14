import { describe, expect, it } from 'vitest';

import { loop } from '../src/main';

interface RepeatedTickFixture {
  constructionSites: ConstructionSite[];
  spawnCalls: unknown[][];
  eventLog: string[];
  runTicks: (ticks: number) => void;
}

function makePosition(x: number, y: number, roomName = 'W1N1'): RoomPosition {
  return {
    x,
    y,
    roomName,
    isNearTo: (target: RoomObject) => {
      const pos = target.pos;
      return Math.max(Math.abs(x - (pos.x ?? x)), Math.abs(y - (pos.y ?? y))) <= 1;
    },
  } as RoomPosition;
}

function makeIdleCreep(name: string, role: CreepRole, room: Room): Creep {
  return {
    name,
    room,
    memory: { role },
    store: { getFreeCapacity: () => 0, getUsedCapacity: () => 0 },
    harvest: () => 0,
    transfer: () => 0,
    upgradeController: () => 0,
    build: () => 0,
    repair: () => 0,
    moveTo: () => 0,
    say: () => 0,
  } as unknown as Creep;
}

function createRepeatedTickFixture(): RepeatedTickFixture {
  const constructionSites: ConstructionSite[] = [];
  const spawnCalls: unknown[][] = [];
  const eventLog: string[] = [];
  const roomName = 'W1N1';
  const source = { id: 'source1', pos: makePosition(20, 20, roomName) } as Source;
  const spawn = {
    id: 'spawn1',
    name: 'Spawn1',
    structureType: STRUCTURE_SPAWN,
    spawning: null,
    pos: makePosition(25, 25, roomName),
    spawnCreep: (...args: unknown[]) => {
      spawnCalls.push(args);
      eventLog.push(`spawn:${String(args[1])}`);
      return 0;
    },
  } as unknown as StructureSpawn;

  const room = {
    name: roomName,
    controller: { level: 2, pos: makePosition(25, 35, roomName) },
    energyAvailable: 300,
    find: (type: number) => {
      if (type === FIND_MY_SPAWNS) return [spawn];
      if (type === FIND_SOURCES) return [source];
      if (type === FIND_CONSTRUCTION_SITES) return constructionSites;
      if (type === FIND_STRUCTURES || type === FIND_MY_STRUCTURES) return [spawn];
      if (type === FIND_HOSTILE_CREEPS || type === FIND_DROPPED_RESOURCES) return [];
      return [];
    },
    createConstructionSite: (x: number, y: number, structureType: string) => {
      const duplicate = constructionSites.some(
        (site) => site.pos.x === x && site.pos.y === y && site.structureType === structureType,
      );
      if (duplicate) {
        eventLog.push(`duplicate-site:${structureType}:${x},${y}`);
        return -7;
      }

      constructionSites.push({
        id: `site-${constructionSites.length + 1}`,
        structureType,
        pos: makePosition(x, y, roomName),
      } as ConstructionSite);
      eventLog.push(`site:${structureType}:${x},${y}`);
      return 0;
    },
  } as unknown as Room;
  (spawn as StructureSpawn).room = room;

  const creeps: Record<string, Creep> = {
    Harvester1: makeIdleCreep('Harvester1', 'harvester', room),
    Harvester2: makeIdleCreep('Harvester2', 'harvester', room),
    Harvester3: makeIdleCreep('Harvester3', 'harvester', room),
    Upgrader1: makeIdleCreep('Upgrader1', 'upgrader', room),
    Builder1: makeIdleCreep('Builder1', 'builder', room),
    Repairer1: makeIdleCreep('Repairer1', 'repairer', room),
  };

  globalThis.Memory = {
    creeps: Object.fromEntries(Object.keys(creeps).map((name) => [name, { role: 'harvester' }])),
    rooms: {},
  } as MemoryGlobal;
  globalThis.Game = {
    time: 1,
    creeps,
    rooms: { [roomName]: room },
    spawns: { Spawn1: spawn },
  } as unknown as GameGlobal;

  return {
    constructionSites,
    spawnCalls,
    eventLog,
    runTicks: (ticks: number) => {
      for (let tick = 0; tick < ticks; tick += 1) {
        Game.time += 1;
        loop();
      }
    },
  };
}

function siteKeys(sites: ConstructionSite[]): string[] {
  return sites.map((site) => `${site.structureType}:${site.pos.x},${site.pos.y}`).sort();
}

describe('main loop repeated-tick idempotence', () => {
  it('does not create duplicate construction sites or churn stable assignments across repeated ticks', () => {
    const fixture = createRepeatedTickFixture();

    fixture.runTicks(6);
    const settledSiteKeys = siteKeys(fixture.constructionSites);
    const settledMemory = JSON.stringify(Memory);
    const settledEventCount = fixture.eventLog.length;

    fixture.runTicks(5);

    expect(siteKeys(fixture.constructionSites)).toEqual(settledSiteKeys);
    expect(new Set(settledSiteKeys).size).toBe(settledSiteKeys.length);
    expect(JSON.stringify(Memory)).toBe(settledMemory);
    expect(fixture.spawnCalls).toHaveLength(0);
    expect(fixture.eventLog.slice(settledEventCount)).toEqual([]);
  });
});
