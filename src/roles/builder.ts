declare const FIND_CONSTRUCTION_SITES: 106;
declare const RESOURCE_ENERGY: 'energy';
declare const ERR_NOT_IN_RANGE: -9;

export function runBuilder(creep: Creep): void {
  const site = findConstructionSite();
  if (!site) {
    creep.say('no site');
    return;
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    if (creep.build(site) === ERR_NOT_IN_RANGE) {
      creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' } });
    }
    return;
  }

  const spawn = Object.values(Game.spawns)[0];
  if (spawn && creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

function findConstructionSite(): ConstructionSite | undefined {
  const spawn = Object.values(Game.spawns)[0];
  if (!spawn) return undefined;
  const sites = spawn.room.find(FIND_CONSTRUCTION_SITES);
  return sites.find((site) => site.my) ?? sites[0];
}
