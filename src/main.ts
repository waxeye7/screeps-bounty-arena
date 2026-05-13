import { ensureBasicHarvesters, ensureBasicUpgraders } from './planning/spawn';
import { runHarvester } from './roles/harvester';
import { runUpgrader } from './roles/upgrader';

export function loop(): void {
  cleanupDeadCreeps();

  for (const spawn of Object.values(Game.spawns)) {
    ensureBasicHarvesters(spawn);
    ensureBasicUpgraders(spawn);
  }

  for (const creep of Object.values(Game.creeps)) {
    switch (creep.memory.role) {
      case 'upgrader':
        runUpgrader(creep);
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
