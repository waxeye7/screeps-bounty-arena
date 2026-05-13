import { describe, expect, it } from 'vitest';
import { runBuilder } from '../src/roles/builder';

describe('runBuilder', () => {
  it('transfers energy to spawn when not yet carrying', () => {
    let said = '';
    const calls: unknown[] = [];

    globalThis.Game = {
      time: 123,
      creeps: {},
      spawns: {
        Spawn1: {
          id: 'spawn1',
          name: 'Spawn1',
          pos: { isNearTo: () => false },
          room: {
            find: () => [],
          },
          structureType: 'spawn' as const,
          spawning: null,
          spawnCreep: () => 0,
          transfer: () => -9,
        },
      },
    } as unknown as GameGlobal;

    const creep = {
      id: 'creep1',
      name: 'Builder1',
      memory: { role: 'builder' as const },
      store: { getFreeCapacity: () => 50 },
      harvest: () => 0,
      build: () => 0,
      transfer: () => -9,
      moveTo: () => -9,
      say: (msg: string) => { said = msg; return 0; },
    } as unknown as Creep;

    runBuilder(creep);
    expect(said).toBe('no site');
  });

  it('builds at construction site when carrying energy', () => {
    let builtTarget: unknown;

    globalThis.Game = {
      time: 456,
      creeps: {},
      spawns: {
        Spawn1: {
          id: 'spawn1',
          name: 'Spawn1',
          pos: { isNearTo: () => false },
          room: {
            find: () => [
              { id: 'site1', my: true, structureType: 'extension', progress: 0, total: 100, pos: { isNearTo: () => false } },
            ],
          },
          structureType: 'spawn' as const,
          spawning: null,
          spawnCreep: () => 0,
        },
      },
    } as unknown as GameGlobal;

    const creep = {
      id: 'creep2',
      name: 'Builder2',
      memory: { role: 'builder' as const },
      store: { getFreeCapacity: () => 0 },
      harvest: () => 0,
      build: (target: unknown) => { builtTarget = target; return -9; },
      transfer: () => 0,
      moveTo: () => -9,
      say: () => 0,
    } as unknown as Creep;

    runBuilder(creep);
    expect(builtTarget).toBeDefined();
  });
});
