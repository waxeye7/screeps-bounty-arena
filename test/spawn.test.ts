import { describe, expect, it } from 'vitest';

import { buildWorkerBody, ensureBasicBuilders, ensureBasicHarvesters, ensureBasicUpgraders, ensureEmergencyRecovery } from '../src/planning/spawn';
import { mockConstructionSite, mockGame, mockRoomFixture, mockSource } from './fixtures/rooms';

describe('buildWorkerBody', () => {
  it('keeps the minimal 200-energy worker body', () => {
    expect(buildWorkerBody(200)).toEqual([WORK, CARRY, MOVE]);
  });

  it('uses higher available energy for stronger bodies', () => {
    expect(buildWorkerBody(300)).toEqual([WORK, CARRY, MOVE, WORK]);
    expect(buildWorkerBody(400)).toEqual([WORK, CARRY, MOVE, WORK, CARRY, MOVE]);
  });

  it('falls back to the minimal valid body below 200 energy', () => {
    expect(buildWorkerBody(150)).toEqual([WORK, CARRY, MOVE]);
  });
});

describe('spawn planning', () => {

  it('detects emergency but waits when energy is below the cheapest worker body', () => {
    mockGame({ time: 999 });
    const { spawn } = mockRoomFixture({ energyAvailable: 100 });
    const isEmergency = ensureEmergencyRecovery(spawn);

    expect(isEmergency).toBe(true);
    expect(spawn.room.find(FIND_MY_SPAWNS)).toHaveLength(1);
  });

  it('detects emergency and uses available energy for recovery worker', () => {
    mockGame({ time: 999 });
    const { spawn, spawnCalls } = mockRoomFixture({ energyAvailable: 300 });
    const isEmergency = ensureEmergencyRecovery(spawn);

    expect(isEmergency).toBe(true);
    expect(spawnCalls).toHaveLength(1);
    expect(spawnCalls[0]).toEqual({ body: [WORK, CARRY, MOVE, WORK], name: 'RecoveryHarvester999', opts: { memory: { role: 'harvester' } } });
  });

  it('returns false for non-emergency scenarios', () => {
    mockGame({ time: 999, creeps: [{ name: 'Harvester1', memory: { role: 'harvester' } } as Creep] });
    const { spawn, spawnCalls } = mockRoomFixture({ energyAvailable: 300 });
    const isEmergency = ensureEmergencyRecovery(spawn);

    expect(isEmergency).toBe(false);
    expect(spawnCalls).toHaveLength(0);
  });

  it('spawns a harvester when below target', () => {
    mockGame({ time: 123 });
    const { spawn, spawnCalls } = mockRoomFixture({ energyAvailable: 400 });

    ensureBasicHarvesters(spawn, 1);

    expect(spawnCalls).toHaveLength(1);
    expect(spawnCalls[0]).toEqual({
      body: [WORK, CARRY, MOVE, WORK, CARRY, MOVE],
      name: 'Harvester123',
      opts: { memory: { role: 'harvester' } },
    });
  });

  it('does not spawn a harvester while the spawn is busy', () => {
    mockGame({ time: 124 });
    const { spawn, spawnCalls } = mockRoomFixture({ energyAvailable: 300 });
    (spawn as unknown as { spawning: unknown }).spawning = { name: 'Harvester123' };

    ensureBasicHarvesters(spawn, 1);

    expect(spawnCalls).toHaveLength(0);
  });

  it('does not spawn a harvester when room energy is below the cheapest worker body', () => {
    mockGame({ time: 125 });
    const { spawn, spawnCalls } = mockRoomFixture({ energyAvailable: 199 });

    ensureBasicHarvesters(spawn, 1);

    expect(spawnCalls).toHaveLength(0);
  });

  it('does not spawn a harvester when no sources are visible', () => {
    mockGame({ time: 126 });
    const { spawn, spawnCalls } = mockRoomFixture({ energyAvailable: 300, sources: [] });

    ensureBasicHarvesters(spawn, 1);

    expect(spawnCalls).toHaveLength(0);
  });

  it('does not spawn a harvester when the desired count is already satisfied', () => {
    mockGame({ time: 127, creeps: [{ name: 'Harvester1', memory: { role: 'harvester' } } as Creep] });
    const { spawn, spawnCalls } = mockRoomFixture({ energyAvailable: 300 });

    ensureBasicHarvesters(spawn, 1);

    expect(spawnCalls).toHaveLength(0);
  });

  it('does not repeat failed spawn attempts in the same tick', () => {
    mockGame({ time: 128 });
    // Use a spawn that returns error code -6
    const { room } = mockRoomFixture({ energyAvailable: 300 });
    const spawnCalls: unknown[] = [];
    const spawn = {
      id: 'spawn1',
      name: 'Spawn1',
      spawning: null,
      pos: { isNearTo: () => true },
      room,
      structureType: STRUCTURE_SPAWN,
      store: { getFreeCapacity: () => 300, getUsedCapacity: () => 0 },
      spawnCreep: (...args: unknown[]) => {
        spawnCalls.push(args);
        return -6;
      },
    } as unknown as StructureSpawn;

    ensureBasicHarvesters(spawn, 1);
    ensureBasicHarvesters(spawn, 1);

    expect(spawnCalls).toHaveLength(1);

    globalThis.Game.time = 129;
    ensureBasicHarvesters(spawn, 1);

    expect(spawnCalls).toHaveLength(2);
  });

  it('spawns an upgrader after basic harvester coverage exists', () => {
    mockGame({
      time: 456,
      creeps: [
        { name: 'Harvester1', memory: { role: 'harvester' } } as Creep,
        { name: 'Harvester2', memory: { role: 'harvester' } } as Creep,
        { name: 'Harvester3', memory: { role: 'harvester' } } as Creep,
      ],
    });
    const { spawn, spawnCalls } = mockRoomFixture({ energyAvailable: 200 });

    ensureBasicUpgraders(spawn, 1);

    expect(spawnCalls).toHaveLength(1);
    expect(spawnCalls[0]).toEqual({ body: [WORK, CARRY, MOVE], name: 'Upgrader456', opts: { memory: { role: 'upgrader' } } });
  });

  it('spawns a builder when construction exists after basic harvester coverage', () => {
    mockGame({
      time: 789,
      creeps: [
        { name: 'Harvester1', memory: { role: 'harvester' } } as Creep,
        { name: 'Harvester2', memory: { role: 'harvester' } } as Creep,
        { name: 'Harvester3', memory: { role: 'harvester' } } as Creep,
      ],
    });
    const site = mockConstructionSite('site1');
    const { spawn, spawnCalls } = mockRoomFixture({ energyAvailable: 200, constructionSites: [site] });

    ensureBasicBuilders(spawn, 1);

    expect(spawnCalls).toHaveLength(1);
    expect(spawnCalls[0]).toEqual({ body: [WORK, CARRY, MOVE], name: 'Builder789', opts: { memory: { role: 'builder' } } });
  });
});
