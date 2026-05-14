import { beforeEach, describe, expect, it } from 'vitest';

import { loop } from '../src/main';
import {
  normalizeGameCreepMemory,
  cleanupDeadCreeps,
  migrateRoomMemory,
  migrateRoomMemoryRecord,
  ROOM_MEMORY_VERSION,
} from '../src/memory';
import { ensureBasicHarvesters } from '../src/planning/spawn';
import { mockCreep, mockRoomFixture } from './fixtures/rooms';

beforeEach(() => {
  globalThis.Memory = { creeps: {}, rooms: {} };
  globalThis.Game = {
    time: 1,
    creeps: {},
    spawns: {},
    rooms: {},
  } as GameGlobal;
});

describe('memory helpers', () => {
  it('removes memory entries for creeps that no longer exist', () => {
    Memory.creeps = {
      AliveHarvester: { role: 'harvester' },
      DeadBuilder: { role: 'builder' },
    };
    Game.creeps = {
      AliveHarvester: {
        name: 'AliveHarvester',
        memory: Memory.creeps.AliveHarvester,
      } as Creep,
    };

    expect(cleanupDeadCreeps()).toEqual(['DeadBuilder']);
    expect(Memory.creeps).toEqual({ AliveHarvester: { role: 'harvester' } });
  });

  it('recreates missing creep memory without throwing', () => {
    delete (Memory as Partial<MemoryGlobal>).creeps;
    Game.creeps = {
      AliveHarvester: {
        name: 'AliveHarvester',
        memory: { role: 'harvester' },
      } as Creep,
    };

    expect(cleanupDeadCreeps()).toEqual([]);
    expect(Memory.creeps).toEqual({});
  });

  it('replaces malformed creep memory with an empty record', () => {
    (Memory as unknown as { creeps: unknown }).creeps = 'stale-serialized-creeps';

    expect(cleanupDeadCreeps()).toEqual([]);
    expect(Memory.creeps).toEqual({});
  });

  it('adds a current version to an existing room memory record without dropping fields', () => {
    expect(
      migrateRoomMemoryRecord({
        version: 0,
        planner: 'early',
      } as Partial<RoomMemory>),
    ).toEqual({
      version: ROOM_MEMORY_VERSION,
      planner: 'early',
    });
  });

  it('creates versioned memory for visible rooms', () => {
    Game.rooms = {
      W1N1: {} as Room,
      W1N2: {} as Room,
    };
    Memory.rooms = { W1N1: { version: 0 } };

    migrateRoomMemory();

    expect(Memory.rooms).toEqual({
      W1N1: { version: ROOM_MEMORY_VERSION },
      W1N2: { version: ROOM_MEMORY_VERSION },
    });
  });

  it('creates room memory when the global rooms record is missing', () => {
    Game.rooms = {
      W1N1: {} as Room,
    };
    delete (Memory as Partial<MemoryGlobal>).rooms;

    expect(() => migrateRoomMemory()).not.toThrow();
    expect(Memory.rooms).toEqual({
      W1N1: { version: ROOM_MEMORY_VERSION },
    });
  });

  it('replaces malformed room memory and stale versions for visible rooms', () => {
    Game.rooms = {
      W1N1: {} as Room,
      W1N2: {} as Room,
    };
    (Memory as unknown as { rooms: unknown }).rooms = {
      W1N1: { version: 0, planner: 'early' },
      W1N2: 'stale-serialized-room',
    };

    expect(() => migrateRoomMemory()).not.toThrow();
    expect(Memory.rooms).toEqual({
      W1N1: { version: ROOM_MEMORY_VERSION, planner: 'early' },
      W1N2: { version: ROOM_MEMORY_VERSION },
    });
  });

  it('normalizes wrong role strings without crashing', () => {
    const { room } = mockRoomFixture();
    const creep = mockCreep({
      name: 'OddRole',
      room,
      memory: { role: 'scout' },
    });
    Game.creeps = { OddRole: creep };
    Memory.creeps = { OddRole: { role: 'scout' as CreepRole } };

    expect(() => normalizeGameCreepMemory()).not.toThrow();
    expect(creep.memory).toEqual({ role: 'harvester' });
    expect(Memory.creeps).toEqual({ OddRole: { role: 'harvester' } });
  });

  it('normalizes missing creep memory without crashing', () => {
    const { room } = mockRoomFixture();
    const creep = mockCreep({
      name: 'MissingMemory',
      room,
      memory: undefined,
    });
    Game.creeps = { MissingMemory: creep };

    expect(() => normalizeGameCreepMemory()).not.toThrow();
    expect(creep.memory).toEqual({ role: 'harvester' });
    expect(Memory.creeps).toEqual({ MissingMemory: { role: 'harvester' } });
  });

  it('keeps role planners from crashing on invalid creep role memory', () => {
    const { room, spawn, spawnCalls } = mockRoomFixture();
    const creep = mockCreep({
      name: 'InvalidRole',
      room,
      memory: { role: 'builderish' },
    });
    Game.creeps = { InvalidRole: creep };
    Game.spawns = { Spawn1: spawn };
    Memory.creeps = { InvalidRole: { role: 'builderish' as CreepRole } };

    expect(() => ensureBasicHarvesters(spawn, 2)).not.toThrow();
    expect(creep.memory).toEqual({ role: 'harvester' });
    expect(spawnCalls).toHaveLength(1);
  });

  it('keeps the main loop running with malformed room and creep memory', () => {
    const { room, spawn } = mockRoomFixture();
    const creep = mockCreep({
      name: 'BrokenMemory',
      room,
      memory: undefined,
    });
    Game.creeps = { BrokenMemory: creep };
    Game.spawns = { Spawn1: spawn };
    Game.rooms = { W1N1: room };
    (Memory as unknown as { creeps: unknown; rooms: unknown }).creeps = 'stale-serialized-creeps';
    (Memory as unknown as { creeps: unknown; rooms: unknown }).rooms = 'stale-serialized-rooms';

    expect(() => loop()).not.toThrow();
    expect(creep.memory.role).toBe('harvester');
    expect(Memory.rooms).toEqual({
      W1N1: { version: ROOM_MEMORY_VERSION },
    });
  });
});
