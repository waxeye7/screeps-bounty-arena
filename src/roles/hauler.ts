export function runHauler(creep: Creep): void {
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    const pickup = chooseHaulerPickup(creep);
    if (!pickup) {
      creep.say('no haul');
      return;
    }

    const result = isDroppedResource(pickup)
      ? creep.pickup(pickup)
      : creep.withdraw(pickup, RESOURCE_ENERGY);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(pickup, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return;
  }

  const target = chooseEnergyDeliveryTarget(creep);
  if (!target) {
    creep.say('full');
    return;
  }

  if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

export function chooseHaulerPickup(creep: Creep): StructureContainer | Resource<ResourceConstant> | undefined {
  const containers = creep.room
    .find(FIND_STRUCTURES)
    .filter(isContainer)
    .filter((container) => container.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
    .sort((a, b) => b.store.getUsedCapacity(RESOURCE_ENERGY) - a.store.getUsedCapacity(RESOURCE_ENERGY));
  if (containers[0]) return containers[0];

  return creep.room
    .find(FIND_DROPPED_RESOURCES)
    .filter((resource) => resource.resourceType === RESOURCE_ENERGY && resource.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];
}

export function chooseEnergyDeliveryTarget(creep: Creep): StructureSpawn | StructureExtension | undefined {
  const targets = creep.room
    .find(FIND_MY_STRUCTURES)
    .filter(isEnergySink)
    .filter((structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

  const spawn = targets.find((structure): structure is StructureSpawn => structure.structureType === STRUCTURE_SPAWN);
  return spawn ?? targets[0];
}

function isContainer(structure: Structure): structure is StructureContainer {
  return structure.structureType === STRUCTURE_CONTAINER;
}

function isEnergySink(structure: Structure): structure is StructureSpawn | StructureExtension {
  return structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION;
}

function isDroppedResource(target: StructureContainer | Resource<ResourceConstant>): target is Resource<ResourceConstant> {
  return 'resourceType' in target;
}
