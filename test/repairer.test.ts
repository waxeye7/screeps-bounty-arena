import { describe, expect, it, vi } from 'vitest';

import { chooseRepairTarget, runRepairer } from '../src/roles/repairer';

function source(id: string): Source {
  return { id, pos: { isNearTo: () => true } } as Source;
}

function structure(id: string, structureType: string, hits: number, hitsMax: number): Structure {
  return { id, structureType, hits, hitsMax, pos: { isNearTo: () => true } } as Structure;
}

function creep({ energy = 0, room }: { energy?: number; room: Room }): Creep {
  return {
    id: 'repairer1',
    name: 'Repairer1',
    hits: 100,
    hitsMax: 100,
    memory: { role: 'repairer' },
    room,
    pos: { isNearTo: () => true },
    store: { getFreeCapacity: () => 50 - energy, getUsedCapacity: () => energy },
    harvest: vi.fn(() => 0),
    transfer: vi.fn(() => 0),
    build: vi.fn(() => 0),
    repair: vi.fn(() => 0),
    upgradeController: vi.fn(() => 0),
    moveTo: vi.fn(() => 0),
    say: vi.fn(() => 0),
  } as unknown as Creep;
}

function room({ structures = [], sources = [] }: { structures?: Structure[]; sources?: Source[] }): Room {
  return {
    find: (type: number) => {
      if (type === FIND_STRUCTURES) return structures;
      if (type === FIND_SOURCES) return sources;
      return [];
    },
  } as unknown as Room;
}

describe('repairer role', () => {
  it('prioritizes damaged roads and containers before general structures', () => {
    const extension = structure('extension1', 'extension', 100, 1000);
    const road = structure('road1', STRUCTURE_ROAD, 1400, 5000);
    const container = structure('container1', 'container', 1200, 2000);

    expect(chooseRepairTarget(room({ structures: [extension, container, road] }))?.id).toBe('road1');
  });

  it('keeps roads in the maintenance queue before same-level general repairs', () => {
    const road = structure('road1', STRUCTURE_ROAD, 3000, 5000);
    const extension = structure('extension1', STRUCTURE_EXTENSION, 600, 1000);

    expect(chooseRepairTarget(room({ structures: [extension, road] }))?.id).toBe('road1');
  });

  it('uses hit ratio as a tie breaker within the same priority', () => {
    const healthierRoad = structure('road1', STRUCTURE_ROAD, 3000, 5000);
    const weakerRoad = structure('road2', STRUCTURE_ROAD, 1000, 5000);

    expect(chooseRepairTarget(room({ structures: [healthierRoad, weakerRoad] }))?.id).toBe('road2');
  });

  it('respects configurable wall and rampart caps', () => {
    const wall = structure('wall1', STRUCTURE_WALL, 15_000, 1_000_000);
    const rampart = structure('rampart1', STRUCTURE_RAMPART, 9_000, 1_000_000);

    expect(chooseRepairTarget(room({ structures: [wall, rampart] }), { wallHitCap: 10_000, rampartHitCap: 8_000 })).toBeUndefined();
    expect(chooseRepairTarget(room({ structures: [wall, rampart] }), { wallHitCap: 20_000, rampartHitCap: 8_000 })?.id).toBe(
      'wall1',
    );
  });

  it('repairs the selected target when carrying energy', () => {
    const road = structure('road1', STRUCTURE_ROAD, 1000, 5000);
    const worker = creep({ energy: 50, room: room({ structures: [road] }) });

    runRepairer(worker);

    expect(worker.repair).toHaveBeenCalledWith(road);
    expect(worker.harvest).not.toHaveBeenCalled();
  });

  it('harvests from a source when empty', () => {
    const energySource = source('source1');
    const worker = creep({ room: room({ sources: [energySource] }) });

    runRepairer(worker);

    expect(worker.harvest).toHaveBeenCalledWith(energySource);
    expect(worker.repair).not.toHaveBeenCalled();
  });
});
