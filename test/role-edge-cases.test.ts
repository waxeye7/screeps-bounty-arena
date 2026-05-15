import { describe, expect, it } from 'vitest';

import { runBuilder } from '../src/roles/builder';
import { runHarvester } from '../src/roles/harvester';
import { runUpgrader } from '../src/roles/upgrader';
import { mockCreep, mockRoomFixture } from './fixtures/rooms';

describe('role edge cases', () => {
  it('harvester says no source and returns safely when no sources exist', () => {
    const { room, spawn } = mockRoomFixture({ sources: [] });
    const calls: string[] = [];
    const creep = mockCreep({ name: 'Harvester1', role: 'harvester', room, calls });
    globalThis.Game = { creeps: { Harvester1: creep }, spawns: { Spawn1: spawn }, time: 1 } as unknown as GameGlobal;

    expect(() => runHarvester(creep)).not.toThrow();
    expect(calls).toEqual(['Harvester1:say:no source']);
  });

  it('builder with stored energy reports no site instead of building an invalid target', () => {
    const { room, spawn } = mockRoomFixture({ constructionSites: [] });
    const calls: string[] = [];
    const creep = mockCreep({ name: 'Builder1', role: 'builder', room, energyUsed: 50, calls });
    globalThis.Game = { creeps: { Builder1: creep }, spawns: { Spawn1: spawn }, time: 1 } as unknown as GameGlobal;

    expect(() => runBuilder(creep)).not.toThrow();
    expect(calls).toEqual(['Builder1:say:no site']);
  });

  it('upgrader reports no controller when neither its room nor fallback spawn room has one', () => {
    const { room, spawn } = mockRoomFixture({ controller: undefined });
    const calls: string[] = [];
    const creep = mockCreep({ name: 'Upgrader1', role: 'upgrader', room, energyUsed: 50, calls });
    globalThis.Game = { creeps: { Upgrader1: creep }, spawns: { Spawn1: spawn }, time: 1 } as unknown as GameGlobal;

    expect(() => runUpgrader(creep)).not.toThrow();
    expect(calls).toEqual(['Upgrader1:say:no ctrl']);
  });
});

import { loop } from '../src/main';

describe('main loop edge cases', () => {
  it('does not crash when a creep has missing or corrupted memory', () => {
    const { room, spawn } = mockRoomFixture();
    
    const missingCreep = mockCreep({ name: 'MissingMemoryCreep', role: 'harvester', room });
    missingCreep.memory = undefined as any;
    
    const corruptedCreep = mockCreep({ name: 'CorruptedRoleCreep', role: 'fake-role' as any, room });

    globalThis.Game = {
      time: 1,
      spawns: { Spawn1: spawn },
      creeps: {
        MissingMemoryCreep: missingCreep,
        CorruptedRoleCreep: corruptedCreep,
      },
      rooms: { W1N1: room },
    } as unknown as GameGlobal;
    globalThis.Memory = { creeps: {}, rooms: {} };

    expect(() => loop()).not.toThrow();
  });
});
