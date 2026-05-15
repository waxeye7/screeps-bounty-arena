export interface RepairTargetOptions {
  wallHitCap?: number;
  rampartHitCap?: number;
}

const DEFAULT_WALL_HIT_CAP = 10_000;
const DEFAULT_RAMPART_HIT_CAP = 10_000;
const MAINTENANCE_TYPES = new Set(['road', 'container']);
const CRITICAL_REPAIR_RATIO = 0.5;
const GENERAL_REPAIR_RATIO = 0.8;

export function runRepairer(creep: Creep, options: RepairTargetOptions = {}): void {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
    const target = chooseRepairTarget(creep.room, options);
    if (!target) {
      creep.say('no repair');
      return;
    }

    if (creep.repair(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa33' } });
    }
    return;
  }

  const source = chooseSource(creep);
  if (!source) {
    creep.say('no source');
    return;
  }

  if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
  }
}

export function chooseRepairTarget(room: Room, options: RepairTargetOptions = {}): Structure | undefined {
  return room
    .find(FIND_STRUCTURES)
    .filter((structure) => isRepairable(structure, options))
    .sort(compareRepairPriority)[0];
}

function isRepairable(structure: Structure, options: RepairTargetOptions): boolean {
  if (structure.hits >= structure.hitsMax) return false;

  if (structure.structureType === STRUCTURE_WALL) {
    return structure.hits < (options.wallHitCap ?? DEFAULT_WALL_HIT_CAP);
  }

  if (structure.structureType === STRUCTURE_RAMPART) {
    return structure.hits < (options.rampartHitCap ?? DEFAULT_RAMPART_HIT_CAP);
  }

  return structure.hits / structure.hitsMax < GENERAL_REPAIR_RATIO;
}

function compareRepairPriority(left: Structure, right: Structure): number {
  return repairPriority(left) - repairPriority(right) || left.hits / left.hitsMax - right.hits / right.hitsMax;
}

function repairPriority(structure: Structure): number {
  const hitRatio = structure.hits / structure.hitsMax;

  if (MAINTENANCE_TYPES.has(structure.structureType) && hitRatio < CRITICAL_REPAIR_RATIO) {
    return 0;
  }

  if (MAINTENANCE_TYPES.has(structure.structureType)) {
    return 1;
  }

  if (structure.structureType === STRUCTURE_RAMPART || structure.structureType === STRUCTURE_WALL) {
    return 3;
  }

  return 2;
}

function chooseSource(creep: Creep): Source | undefined {
  const sources = creep.room.find(FIND_SOURCES);
  if (creep.memory?.sourceId) {
    const remembered = sources.find((source) => source.id === creep.memory.sourceId);
    if (remembered) return remembered;
  }

  const selected = sources[0];
  if (selected) {
    if (!creep.memory) creep.memory = {};
    creep.memory.sourceId = selected.id;
  }
  return selected;
}
