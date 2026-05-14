export function planRoads(room: Room): void {
  const spawns = room.find(FIND_MY_SPAWNS);
  if (spawns.length === 0) return;
  const spawn = spawns[0];

  const sources = room.find(FIND_SOURCES);
  const controller = room.controller;

  // We should plan a road from spawn to each source
  for (const source of sources) {
    createRoadPath(room, spawn.pos, source.pos);
  }

  // And from spawn to controller
  if (controller) {
    createRoadPath(room, spawn.pos, controller.pos);
  }
}

function createRoadPath(room: Room, start: RoomPosition, end: RoomPosition): void {
  const path = room.findPath(start, end, {
    ignoreCreeps: true,
    swampCost: 2, // Prefer plains over swamps for roads
    plainCost: 2
  });

  for (const step of path) {
    const pos = new RoomPosition(step.x, step.y, room.name);
    // Don't build road exactly on the source/spawn/controller if it's blocking
    // Actually createConstructionSite handles existing structures and same-type sites.
    room.createConstructionSite(pos, STRUCTURE_ROAD);
  }
}
