import { describe, expect, it } from 'vitest';

import { chooseEnergyDeliveryTarget, chooseHaulerPickup, runHauler } from '../src/roles/hauler';
import { chooseSourceContainer, runMiner } from '../src/roles/miner';
import { ensureContainerMiningEconomy } from '../src/planning/spawn';

function makeStore(used: number, free: number): Store {
  return {
    getFreeCapacity: () => free,
    getUsedCapacity: () => used,
  };
}

function makePos(nearIds: string[] = []): RoomPosition {
  return {
    isNearTo: (target: RoomObject) => nearIds.includes(target.id),
  };
}

function makeRoom({
  sources = [],
  structures = [],
  dropped = [],
  constructionSites = [],
}: {
  sources?: Source[];
  structures?: Structure[];
  dropped?: Resource<ResourceConstant>[];
  constructionSites?: ConstructionSite[];
} = {}): Room {
  return {
    energyAvailable: 300,
    find: (type: number) => {
      switch (type) {
        case FIND_SOURCES:
          return sources;
        case FIND_STRUCTURES:
        case FIND_MY_STRUCTURES:
          return structures;
        case FIND_DROPPED_RESOURCES:
          return dropped;
        case FIND_CONSTRUCTION_SITES:
          return constructionSites;
        default:
          return [];
      }
    },
  } as unknown as Room;
}

function makeSpawn(calls: unknown[], room: Room): StructureSpawn {
  return {
    id: 'spawn1',
    name: 'Spawn1',
    pos: makePos(),
    room,
    spawning: null,
    store: makeStore(0, 300),
    structureType: STRUCTURE_SPAWN,
    spawnCreep: (...args: unknown[]) => {
      calls.push(args);
      return 0;
    },
  } as unknown as StructureSpawn;
}

describe('container mining economy', () => {
  it('spawns miner then hauler only after basic harvester safety and source-side energy exist', () => {
    const source = { id: 'source1', pos: makePos() } as Source;
    const container = {
      id: 'container1',
      pos: makePos(['source1']),
      store: makeStore(100, 900),
      structureType: STRUCTURE_CONTAINER,
    } as StructureContainer;
    const room = makeRoom({ sources: [source], structures: [container] });
    const calls: unknown[] = [];
    const spawn = makeSpawn(calls, room);

    globalThis.Game = {
      time: 100,
      creeps: {
        Harvester1: { memory: { role: 'harvester' } } as Creep,
        Harvester2: { memory: { role: 'harvester' } } as Creep,
        Harvester3: { memory: { role: 'harvester' } } as Creep,
      },
      spawns: { Spawn1: spawn },
    } as GameGlobal;

    ensureContainerMiningEconomy(spawn);
    expect(calls[0]).toEqual([[WORK, CARRY, MOVE, WORK], 'Miner100', { memory: { role: 'miner' } }]);

    calls.length = 0;
    globalThis.Game.creeps.Miner100 = { memory: { role: 'miner' } } as Creep;
    globalThis.Game.time = 101;

    ensureContainerMiningEconomy(spawn);
    expect(calls[0]).toEqual([[WORK, CARRY, MOVE, WORK], 'Hauler101', { memory: { role: 'hauler' } }]);
  });

  it('does not start container mining when containers and dropped energy are missing', () => {
    const calls: unknown[] = [];
    const spawn = makeSpawn(calls, makeRoom({ sources: [{ id: 'source1', pos: makePos() } as Source] }));
    globalThis.Game = {
      time: 200,
      creeps: {
        Harvester1: { memory: { role: 'harvester' } } as Creep,
        Harvester2: { memory: { role: 'harvester' } } as Creep,
      },
      spawns: { Spawn1: spawn },
    } as GameGlobal;

    ensureContainerMiningEconomy(spawn);

    expect(calls).toHaveLength(0);
  });

  it('moves miners onto an existing source-adjacent container before harvesting', () => {
    const source = { id: 'source1', pos: makePos() } as Source;
    const container = {
      id: 'container1',
      pos: makePos(['source1']),
      store: makeStore(0, 2000),
      structureType: STRUCTURE_CONTAINER,
    } as StructureContainer;
    const room = makeRoom({ sources: [source], structures: [container] });
    const actions: string[] = [];
    const creep = {
      id: 'miner1',
      name: 'Miner1',
      memory: { role: 'miner' },
      pos: makePos(),
      room,
      store: makeStore(0, 50),
      harvest: () => {
        actions.push('harvest');
        return 0;
      },
      moveTo: (target: RoomObject) => {
        actions.push(`move:${target.id}`);
        return 0;
      },
      say: () => 0,
    } as unknown as Creep;
    globalThis.Game = { time: 1, creeps: { Miner1: creep }, spawns: { Spawn1: makeSpawn([], room) } } as GameGlobal;

    expect(chooseSourceContainer(creep, source)).toBe(container);
    runMiner(creep);

    expect(actions).toEqual(['move:container1']);
  });

  it('haulers prefer container energy and deliver to spawn or extensions with free capacity', () => {
    const container = {
      id: 'container1',
      pos: makePos(),
      store: makeStore(150, 850),
      structureType: STRUCTURE_CONTAINER,
    } as StructureContainer;
    const extension = {
      id: 'extension1',
      pos: makePos(),
      store: makeStore(0, 50),
      structureType: STRUCTURE_EXTENSION,
    } as StructureExtension;
    const spawn = {
      id: 'spawn1',
      name: 'Spawn1',
      pos: makePos(),
      room: undefined,
      spawning: null,
      store: makeStore(100, 200),
      structureType: STRUCTURE_SPAWN,
      spawnCreep: () => 0,
    } as unknown as StructureSpawn;
    const room = makeRoom({ structures: [extension, container, spawn] });
    spawn.room = room;
    const actions: string[] = [];
    const hauler = {
      id: 'hauler1',
      name: 'Hauler1',
      memory: { role: 'hauler' },
      pos: makePos(['container1', 'spawn1']),
      room,
      store: makeStore(0, 50),
      withdraw: (target: StructureContainer) => {
        actions.push(`withdraw:${target.id}`);
        return 0;
      },
      pickup: () => 0,
      transfer: (target: StructureSpawn | StructureExtension) => {
        actions.push(`transfer:${target.id}`);
        return 0;
      },
      moveTo: () => 0,
      say: () => 0,
    } as unknown as Creep;

    expect(chooseHaulerPickup(hauler)).toBe(container);
    runHauler(hauler);
    expect(actions).toEqual(['withdraw:container1']);

    actions.length = 0;
    hauler.store = makeStore(50, 0);
    expect(chooseEnergyDeliveryTarget(hauler)).toBe(spawn);
    runHauler(hauler);
    expect(actions).toEqual(['transfer:spawn1']);
  });
});
