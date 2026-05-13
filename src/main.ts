import { ensureBasicBuilders, ensureBasicHarvesters, ensureBasicRepairers, ensureBasicUpgraders } from './planning/spawn';
import { runBuilder } from './roles/builder';
import { runHarvester } from './roles/harvester';
import { runRepairer } from './roles/repairer';
import { runUpgrader } from './roles/upgrader';

export function loop(): void {
  cleanupDeadCreeps();

  for (const spawn of Object.values(Game.spawns)) {
    ensureBasicHarvesters(spawn);
    ensureBasicUpgraders(spawn);
    ensureBasicBuilders(spawn);
    ensureBasicRepairers(spawn);
  }

  for (const creep of Object.values(Game.creeps)) {
    switch (creep.memory.role) {
      case 'builder':
        runBuilder(creep);
        break;
      case 'upgrader':
        runUpgrader(creep);
        break;
      case 'repairer':
        runRepairer(creep);
        break;
      case 'harvester':
      default:
        runHarvester(creep);
        break;
    }
  }
}

function cleanupDeadCreeps(): void {
  for (const name of Object.keys(Memory.creeps)) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
}
