import { chooseSource } from './harvester';

export function runMiner(creep: Creep): void {
  const source = chooseSource(creep);
  if (!source) {
    creep.say('no source');
    return;
  }

  const container = chooseSourceContainer(creep, source);
  if (container && !creep.pos.isNearTo(container)) {
    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
    return;
  }

  if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
  }
}

export function chooseSourceContainer(creep: Creep, source: Source): StructureContainer | undefined {
  const containers = creep.room.find(FIND_STRUCTURES).filter(isContainer);
  return containers.find((container) => container.pos.isNearTo(source));
}

function isContainer(structure: Structure): structure is StructureContainer {
  return structure.structureType === STRUCTURE_CONTAINER;
}
