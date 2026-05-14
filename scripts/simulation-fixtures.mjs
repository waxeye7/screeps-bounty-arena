export const simulationFixtures = {
  "fresh-room-low-energy": {
    name: "fresh-room-low-energy",
    description:
      "Fresh RCL1 room with one worker and low starting energy; verifies the colony can recover from an early economy stall.",
    seed: "fixture:fresh-room-low-energy",
    roomSeed: "fixture:fresh-room-low-energy:room",
    spawnSeed: "fixture:fresh-room-low-energy:spawn",
    spawnConfig: "conservative",
    initialRoom: {
      rcl: 1,
      controllerProgress: 0,
      energy: 80,
      energyCapacity: 300,
      creeps: 1,
      constructionProgress: 0,
    },
  },
  "spawn-recovery-no-workers": {
    name: "spawn-recovery-no-workers",
    description:
      "Recovery room with no active workers but enough emergency spawn energy; verifies simulator startup can bootstrap from zero creeps.",
    seed: "fixture:spawn-recovery-no-workers",
    roomSeed: "fixture:spawn-recovery-no-workers:room",
    spawnSeed: "fixture:spawn-recovery-no-workers:spawn",
    spawnConfig: "conservative",
    initialRoom: {
      rcl: 1,
      controllerProgress: 30,
      energy: 260,
      energyCapacity: 300,
      creeps: 0,
      constructionProgress: 0,
    },
  },
  "controller-rush-few-sources": {
    name: "controller-rush-few-sources",
    description:
      "Controller-rush setup with one source-equivalent harvest profile and two creeps; verifies early RCL progress under constrained income.",
    seed: "fixture:controller-rush-few-sources",
    roomSeed: "fixture:controller-rush-few-sources:single-source-room",
    spawnSeed: "fixture:controller-rush-few-sources:spawn",
    spawnConfig: "balanced",
    harvestMultiplier: 0.65,
    initialRoom: {
      rcl: 1,
      controllerProgress: 120,
      energy: 180,
      energyCapacity: 300,
      creeps: 2,
      constructionProgress: 20,
    },
  },
  "road-planner-site-cap": {
    name: "road-planner-site-cap",
    description:
      "RCL2 room with construction progress near capacity; verifies build progress/capacity growth remains stable around road-planning pressure.",
    seed: "fixture:road-planner-site-cap",
    roomSeed: "fixture:road-planner-site-cap:room",
    spawnSeed: "fixture:road-planner-site-cap:spawn",
    spawnConfig: "aggressive",
    initialRoom: {
      rcl: 2,
      controllerProgress: 80,
      energy: 250,
      energyCapacity: 400,
      creeps: 3,
      constructionProgress: 360,
    },
  },
};

export function listSimulationFixtures() {
  return Object.values(simulationFixtures).map(({ name, description }) => ({
    name,
    description,
  }));
}

export function getSimulationFixture(name) {
  return simulationFixtures[name];
}
