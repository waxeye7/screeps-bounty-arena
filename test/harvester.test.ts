import { describe, expect, it } from 'vitest';

import { chooseSource } from '../src/roles/harvester';
import { mockCreep, mockGame, mockRoomFixture, mockSource } from './fixtures/rooms';

describe('chooseSource', () => {
  it('keeps a remembered source assignment when it still exists', () => {
    const sources = [mockSource('source-a'), mockSource('source-b')];
    const { room, spawn } = mockRoomFixture({ sources });
    const harvester = mockCreep({ name: 'Harvester1', role: 'harvester', room });
    harvester.memory.sourceId = 'source-b';
    mockGame({ creeps: [harvester], spawns: [spawn] });

    expect(chooseSource(harvester)?.id).toBe('source-b');
    expect(harvester.memory.sourceId).toBe('source-b');
  });

  it('assigns new harvesters to the least-used source', () => {
    const sources = [mockSource('source-a'), mockSource('source-b')];
    const { room, spawn } = mockRoomFixture({ sources });
    const existing = mockCreep({ name: 'Harvester1', role: 'harvester', room });
    existing.memory.sourceId = 'source-a';
    const fresh = mockCreep({ name: 'Harvester2', role: 'harvester', room });
    mockGame({ creeps: [existing, fresh], spawns: [spawn] });

    expect(chooseSource(fresh)?.id).toBe('source-b');
    expect(fresh.memory.sourceId).toBe('source-b');
  });

  it('breaks ties deterministically using room source order', () => {
    const sources = [mockSource('source-a'), mockSource('source-b')];
    const { room, spawn } = mockRoomFixture({ sources });
    const fresh = mockCreep({ name: 'Harvester1', role: 'harvester', room });
    mockGame({ creeps: [fresh], spawns: [spawn] });

    expect(chooseSource(fresh)?.id).toBe('source-a');
  });
});
