import { beforeEach, describe, expect, it } from 'vitest';

import { cleanupDeadCreeps, migrateRoomMemory, migrateRoomMemoryRecord, ROOM_MEMORY_VERSION } from '../src/memory';

beforeEach(() => {
  globalThis.Memory = { creeps: {}, rooms: {} };
  globalThis.Game = { time: 1, creeps: {}, spawns: {}, rooms: {} } as GameGlobal;
});

describe('memory helpers', () => {
  it('removes memory entries for creeps that no longer exist', () => {
    Memory.creeps = {
      AliveHarvester: { role: 'harvester' },
      DeadBuilder: { role: 'builder' },
    };
    Game.creeps = {
      AliveHarvester: { name: 'AliveHarvester', memory: Memory.creeps.AliveHarvester } as Creep,
    };

    expect(cleanupDeadCreeps()).toEqual(['DeadBuilder']);
    expect(Memory.creeps).toEqual({ AliveHarvester: { role: 'harvester' } });
  });

  it('recreates missing creep memory without throwing', () => {
    delete (Memory as Partial<MemoryGlobal>).creeps;
    Game.creeps = {
      AliveHarvester: { name: 'AliveHarvester', memory: { role: 'harvester' } } as Creep,
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
    expect(migrateRoomMemoryRecord({ version: 0, planner: 'early' } as Partial<RoomMemory>)).toEqual({
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

  it('handles missing or primitive Memory.rooms gracefully', () => {
    Game.rooms = { W1N1: {} as Room };
    (Memory as any).rooms = 'corrupted-string';

    expect(() => migrateRoomMemory()).not.toThrow();
    expect(Memory.rooms).toEqual({
      W1N1: { version: ROOM_MEMORY_VERSION },
    });
  });

  it('preserves other fields when bumping stale migration version', () => {
    const existingMemory = { version: 0, customData: 'test' };
    const migrated = migrateRoomMemoryRecord(existingMemory as Partial<RoomMemory>);
    
    expect(migrated).toEqual({
      version: ROOM_MEMORY_VERSION,
      customData: 'test',
    });
  });
});
