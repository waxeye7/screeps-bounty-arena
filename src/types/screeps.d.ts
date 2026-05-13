declare global {
  var Game: GameGlobal;
  var Memory: MemoryGlobal;
  var WORK: BodyPartConstant;
  var CARRY: BodyPartConstant;
  var MOVE: BodyPartConstant;
  var ATTACK: BodyPartConstant;
  var RANGED_ATTACK: BodyPartConstant;
  var HEAL: BodyPartConstant;
  var ERR_NOT_IN_RANGE: -9;
  var FIND_SOURCES: 105;
  var FIND_MY_SPAWNS: 100;
  var FIND_MY_STRUCTURES: 107;
  var FIND_HOSTILE_CREEPS: 101;
  var FIND_MY_CREEPS: 102;
  var FIND_STRUCTURES: 108;
  var FIND_CONSTRUCTION_SITES: 106;
  var STRUCTURE_SPAWN: 'spawn';
  var STRUCTURE_TOWER: 'tower';
  var STRUCTURE_WALL: 'constructedWall';
  var STRUCTURE_RAMPART: 'rampart';
  var RESOURCE_ENERGY: 'energy';

  type BodyPartConstant = 'work' | 'carry' | 'move' | 'attack' | 'ranged_attack' | 'heal';
  type ResourceConstant = 'energy';
  type CreepRole = 'harvester' | 'upgrader' | 'builder';

  interface MemoryGlobal {
    creeps: Record<string, CreepMemory>;
  }

  interface CreepMemory {
    role?: CreepRole;
    sourceId?: string;
  }

  interface GameGlobal {
    creeps: Record<string, Creep>;
    spawns: Record<string, StructureSpawn>;
    time: number;
  }

  interface RoomObject {
    id: string;
    pos: RoomPosition;
  }

  interface RoomPosition {
    isNearTo(target: RoomObject): boolean;
  }

  interface Source extends RoomObject {}
  interface StructureController extends RoomObject {}

  interface BodyPartDefinition {
    type: BodyPartConstant;
    hits: number;
  }

  interface ConstructionSite extends RoomObject {
    my?: boolean;
    structureType?: string;
    progress?: number;
    total?: number;
  }

  interface Store {
    getFreeCapacity(resource?: ResourceConstant): number;
    getUsedCapacity(resource?: ResourceConstant): number;
  }

  interface Creep extends RoomObject {
    name: string;
    body?: BodyPartDefinition[];
    hits: number;
    hitsMax: number;
    memory: CreepMemory;
    room: Room;
    store: Store;
    harvest(source: Source): 0 | -9;
    transfer(target: StructureSpawn, resource: ResourceConstant): 0 | -9;
    build(target: ConstructionSite): 0 | -9;
    upgradeController(target: StructureController): 0 | -9;
    moveTo(target: RoomObject, opts?: { visualizePathStyle?: { stroke?: string } }): number;
    say(message: string): number;
  }

  interface Room {
    controller?: StructureController;
    energyAvailable?: number;
    energyCapacityAvailable?: number;
    find(type: typeof FIND_SOURCES): Source[];
    find(type: typeof FIND_MY_SPAWNS): StructureSpawn[];
    find(type: typeof FIND_MY_STRUCTURES): Structure[];
    find(type: typeof FIND_HOSTILE_CREEPS): Creep[];
    find(type: typeof FIND_MY_CREEPS): Creep[];
    find(type: typeof FIND_STRUCTURES): Structure[];
    find(type: typeof FIND_CONSTRUCTION_SITES): ConstructionSite[];
  }

  interface Structure extends RoomObject {
    structureType: string;
    hits: number;
    hitsMax: number;
  }

  interface StructureSpawn extends Structure {
    structureType: typeof STRUCTURE_SPAWN;
    name: string;
    room: Room;
    spawning: unknown;
    spawnCreep(body: BodyPartConstant[], name: string, opts?: { memory?: CreepMemory }): number;
  }

  interface StructureTower extends Structure {
    structureType: typeof STRUCTURE_TOWER;
    attack(target: Creep): number;
    heal(target: Creep): number;
    repair(target: Structure): number;
  }
}

export {};
