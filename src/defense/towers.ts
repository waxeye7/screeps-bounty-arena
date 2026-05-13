export function runTowerDefense(room: Room): void {
  const towers = room.find(FIND_MY_STRUCTURES).filter(isTower);

  for (const tower of towers) {
    const hostile = chooseTowerHostileTarget(room);
    if (hostile) {
      tower.attack(hostile);
      continue;
    }

    const wounded = chooseTowerHealTarget(room);
    if (wounded) {
      tower.heal(wounded);
      continue;
    }

    const repairTarget = chooseTowerRepairTarget(room);
    if (repairTarget) {
      tower.repair(repairTarget);
    }
  }
}

export function chooseTowerHostileTarget(room: Room): Creep | undefined {
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  return hostiles.sort(compareHostileThreat)[0];
}

export function chooseTowerHealTarget(room: Room): Creep | undefined {
  return room
    .find(FIND_MY_CREEPS)
    .filter((creep) => creep.hits < creep.hitsMax)
    .sort((left, right) => left.hits / left.hitsMax - right.hits / right.hitsMax)[0];
}

export function chooseTowerRepairTarget(room: Room): Structure | undefined {
  return room
    .find(FIND_STRUCTURES)
    .filter((structure) => shouldTowerRepair(structure))
    .sort((left, right) => left.hits / left.hitsMax - right.hits / right.hitsMax)[0];
}

function compareHostileThreat(left: Creep, right: Creep): number {
  return threatScore(right) - threatScore(left) || left.hits / left.hitsMax - right.hits / right.hitsMax;
}

function threatScore(creep: Creep): number {
  const parts = creep.body ?? [];
  const healing = parts.filter((part) => part.type === HEAL && part.hits > 0).length;
  const ranged = parts.filter((part) => part.type === RANGED_ATTACK && part.hits > 0).length;
  const melee = parts.filter((part) => part.type === ATTACK && part.hits > 0).length;

  // Priority: hostile healers first, then ranged attackers, then melee attackers, then other invaders.
  return healing * 100 + ranged * 50 + melee * 25 + 1;
}

function shouldTowerRepair(structure: Structure): boolean {
  if (structure.hits >= structure.hitsMax) {
    return false;
  }

  if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
    return structure.hits < 10_000;
  }

  return structure.hits / structure.hitsMax < 0.8;
}

function isTower(structure: Structure): structure is StructureTower {
  return structure.structureType === STRUCTURE_TOWER;
}
