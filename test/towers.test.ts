import { describe, expect, it, vi } from 'vitest';

import { chooseTowerHealTarget, chooseTowerHostileTarget, chooseTowerRepairTarget, runTowerDefense } from '../src/defense/towers';

function creep(name: string, hits: number, hitsMax: number, body: BodyPartConstant[] = []): Creep {
  return {
    id: name,
    name,
    body: body.map((type) => ({ type, hits: 100 })),
    hits,
    hitsMax,
    memory: {},
    pos: { isNearTo: () => true },
    store: { getFreeCapacity: () => 50, getUsedCapacity: () => 0 },
    harvest: () => 0,
    transfer: () => 0,
    build: () => 0,
    upgradeController: () => 0,
    moveTo: () => 0,
    say: () => 0,
  } as unknown as Creep;
}

function structure(id: string, structureType: string, hits: number, hitsMax: number): Structure {
  return { id, structureType, hits, hitsMax, pos: { isNearTo: () => true } } as Structure;
}

function tower(id: string): StructureTower {
  return {
    ...structure(id, STRUCTURE_TOWER, 3000, 3000),
    attack: vi.fn(() => 0),
    heal: vi.fn(() => 0),
    repair: vi.fn(() => 0),
  } as unknown as StructureTower;
}

function room({
  hostiles = [],
  creeps = [],
  structures = [],
}: {
  hostiles?: Creep[];
  creeps?: Creep[];
  structures?: Structure[];
}): Room {
  return {
    find: (type: number) => {
      if (type === FIND_HOSTILE_CREEPS) return hostiles;
      if (type === FIND_MY_CREEPS) return creeps;
      if (type === FIND_MY_STRUCTURES) return structures;
      if (type === FIND_STRUCTURES) return structures;
      return [];
    },
  } as unknown as Room;
}

describe('tower defense', () => {
  it('prioritizes healers before ranged, melee, and unarmed hostiles', () => {
    const healer = creep('Healer', 100, 100, [HEAL]);
    const ranged = creep('Ranged', 100, 100, [RANGED_ATTACK]);
    const melee = creep('Melee', 100, 100, [ATTACK]);
    const scout = creep('Scout', 100, 100, [MOVE]);

    expect(chooseTowerHostileTarget(room({ hostiles: [scout, melee, healer, ranged] }))?.name).toBe('Healer');
  });

  it('uses lower hit ratio as a tie breaker for same-threat hostiles', () => {
    const healthy = creep('HealthyRanged', 100, 100, [RANGED_ATTACK]);
    const wounded = creep('WoundedRanged', 30, 100, [RANGED_ATTACK]);

    expect(chooseTowerHostileTarget(room({ hostiles: [healthy, wounded] }))?.name).toBe('WoundedRanged');
  });

  it('heals the most damaged friendly creep when no hostiles exist', () => {
    const lightlyDamaged = creep('LightlyDamaged', 80, 100);
    const badlyDamaged = creep('BadlyDamaged', 25, 100);

    expect(chooseTowerHealTarget(room({ creeps: [lightlyDamaged, badlyDamaged] }))?.name).toBe('BadlyDamaged');
  });

  it('repairs low non-wall structures and ignores healthy walls', () => {
    const road = structure('road1', 'road', 300, 5000);
    const healthyWall = structure('wall1', STRUCTURE_WALL, 50_000, 1_000_000);

    expect(chooseTowerRepairTarget(room({ structures: [healthyWall, road] }))?.id).toBe('road1');
  });

  it('attacks before healing or repairing', () => {
    const defenseTower = tower('tower1');
    const hostile = creep('Invader', 100, 100, [ATTACK]);
    const wounded = creep('Harvester', 40, 100);
    const road = structure('road1', 'road', 300, 5000);

    runTowerDefense(room({ hostiles: [hostile], creeps: [wounded], structures: [defenseTower, road] }));

    expect(defenseTower.attack).toHaveBeenCalledWith(hostile);
    expect(defenseTower.heal).not.toHaveBeenCalled();
    expect(defenseTower.repair).not.toHaveBeenCalled();
  });
});
