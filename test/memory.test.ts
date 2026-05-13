import { describe, expect, it } from 'vitest';

import { cleanupDeadCreepMemory, migrateAllRoomMemory, migrateRoomMemory } from '../src/memory';

describe('memory maintenance', () => {
  it('removes memory for creeps that no longer exist in Game.creeps', () => {
    globalThis.Game = {
      time: 1,
      creeps: {
        Harvester1: { memory: { role: 'harvester' } } as Creep,
      },
      spawns: {},
    } as GameGlobal;
    globalThis.Memory = {
      creeps: {
        Harvester1: { role: 'harvester' },
        DeadBuilder: { role: 'builder' },
      },
      rooms: {},
    };

    expect(cleanupDeadCreepMemory()).toEqual(['DeadBuilder']);
    expect(Memory.creeps).toEqual({ Harvester1: { role: 'harvester' } });
  });

  it('creates and versions room memory during migration', () => {
    globalThis.Memory = { creeps: {}, rooms: {} };

    migrateRoomMemory('W1N1');

    expect(Memory.rooms?.W1N1).toEqual({ version: 1 });
  });

  it('normalizes stale room fields without committing generated game state', () => {
    globalThis.Memory = {
      creeps: {},
      rooms: {
        W1N1: { sources: 'legacy-source-cache' as unknown as string[] },
      },
    };

    migrateRoomMemory('W1N1');

    expect(Memory.rooms?.W1N1).toEqual({ version: 1 });
  });

  it('migrates visible spawn rooms and existing memory rooms', () => {
    globalThis.Game = {
      time: 1,
      creeps: {},
      spawns: {
        Spawn1: {
          id: 'spawn1',
          name: 'Spawn1',
          spawning: null,
          pos: { isNearTo: () => true },
          room: { name: 'W1N1', find: () => [] },
          structureType: STRUCTURE_SPAWN,
          spawnCreep: () => 0,
        } as unknown as StructureSpawn,
      },
    } as GameGlobal;
    globalThis.Memory = {
      creeps: {},
      rooms: {
        W2N2: {},
      },
    };

    migrateAllRoomMemory();

    expect(Memory.rooms?.W1N1).toEqual({ version: 1 });
    expect(Memory.rooms?.W2N2).toEqual({ version: 1 });
  });
});
