import { describe, expect, it } from 'vitest';

import { chooseSource } from '../src/roles/harvester';

function source(id: string): Source {
  return { id, pos: { isNearTo: () => true } } as Source;
}

function creep(name: string, sourceId?: string): Creep {
  return {
    id: name,
    name,
    memory: sourceId ? { sourceId, role: 'harvester' } : { role: 'harvester' },
    pos: { isNearTo: () => true },
    store: { getFreeCapacity: () => 50 },
    harvest: () => 0,
    transfer: () => 0,
    moveTo: () => 0,
    say: () => 0,
  } as Creep;
}

function setGame(sources: Source[], creeps: Creep[]): void {
  globalThis.Game = {
    time: 1,
    creeps: Object.fromEntries(creeps.map((testCreep) => [testCreep.name, testCreep])),
    spawns: {
      Spawn1: {
        id: 'spawn1',
        name: 'Spawn1',
        spawning: null,
        pos: { isNearTo: () => true },
        room: { find: () => sources },
        structureType: STRUCTURE_SPAWN,
        spawnCreep: () => 0,
      } as unknown as StructureSpawn,
    },
  } as GameGlobal;
}

describe('chooseSource', () => {
  it('keeps a remembered source assignment when it still exists', () => {
    const sources = [source('source-a'), source('source-b')];
    const harvester = creep('Harvester1', 'source-b');
    setGame(sources, [harvester]);

    expect(chooseSource(harvester)?.id).toBe('source-b');
    expect(harvester.memory.sourceId).toBe('source-b');
  });

  it('assigns new harvesters to the least-used source', () => {
    const sources = [source('source-a'), source('source-b')];
    const existing = creep('Harvester1', 'source-a');
    const fresh = creep('Harvester2');
    setGame(sources, [existing, fresh]);

    expect(chooseSource(fresh)?.id).toBe('source-b');
    expect(fresh.memory.sourceId).toBe('source-b');
  });

  it('breaks ties deterministically using room source order', () => {
    const sources = [source('source-a'), source('source-b')];
    const fresh = creep('Harvester1');
    setGame(sources, [fresh]);

    expect(chooseSource(fresh)?.id).toBe('source-a');
  });
});
