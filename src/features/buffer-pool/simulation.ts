import {
  BufferFrame,
  BufferPolicy,
  BufferPoolAction,
  BufferPoolMetrics,
  BufferPoolMode,
  BufferPoolOperation,
  BufferPoolState,
  BufferPoolStep,
} from "./types";

const DEFAULT_CAPACITY = 4;

function createEmptyMetrics(): BufferPoolMetrics {
  return {
    logicalReads: 0,
    physicalReads: 0,
    physicalWrites: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    writebacks: 0,
  };
}

export function createInitialBufferPoolState(
  policy: BufferPolicy,
  capacity = DEFAULT_CAPACITY,
): BufferPoolState {
  return {
    policy,
    capacity,
    frames: Array.from({ length: capacity }, (_, frameIndex) => ({
      frameIndex,
      dirty: false,
      pinCount: 0,
      referenceBit: false,
      lastAccessTick: 0,
      accessCount: 0,
    })),
    lruOrder: [],
    clockHand: 0,
    accessTick: 0,
    metrics: createEmptyMetrics(),
  };
}

export function cloneBufferPoolState(state: BufferPoolState): BufferPoolState {
  return {
    ...state,
    frames: state.frames.map((frame) => ({ ...frame })),
    lruOrder: [...state.lruOrder],
    metrics: { ...state.metrics },
  };
}

export function withPolicy(
  state: BufferPoolState,
  policy: BufferPolicy,
): BufferPoolState {
  return {
    ...cloneBufferPoolState(state),
    policy,
    lruOrder: buildLruOrder(state.frames),
    clockHand: Math.min(state.clockHand, state.capacity - 1),
  };
}

function buildLruOrder(frames: BufferFrame[]) {
  return frames
    .filter((frame) => frame.pageId !== undefined)
    .sort((left, right) => left.lastAccessTick - right.lastAccessTick)
    .map((frame) => frame.frameIndex);
}

function frameByPage(state: BufferPoolState, pageId: number) {
  return state.frames.find((frame) => frame.pageId === pageId);
}

function frameByIndex(state: BufferPoolState, frameIndex: number) {
  return state.frames[frameIndex];
}

function touchFrame(state: BufferPoolState, frameIndex: number) {
  const frame = frameByIndex(state, frameIndex);
  state.accessTick += 1;
  frame.lastAccessTick = state.accessTick;
  frame.accessCount += 1;
  frame.referenceBit = true;

  state.lruOrder = state.lruOrder.filter((index) => index !== frameIndex);
  state.lruOrder.push(frameIndex);
}

function pushStep(
  steps: BufferPoolStep[],
  state: BufferPoolState,
  options: {
    operation: BufferPoolOperation;
    title: string;
    explanation: string;
    mode: BufferPoolMode;
    activePageId?: number;
    activeFrameIndex?: number;
    victimFrameIndex?: number;
    evictedPageId?: number;
    dirtyWrite?: boolean;
  },
) {
  steps.push({
    id: `${options.operation}-${steps.length + 1}`,
    operation: options.operation,
    title: options.title,
    explanation: options.explanation,
    bufferState: cloneBufferPoolState(state),
    highlights: {
      mode: options.mode,
      activePageId: options.activePageId,
      activeFrameIndex: options.activeFrameIndex,
      victimFrameIndex: options.victimFrameIndex,
      evictedPageId: options.evictedPageId,
      clockHandIndex: state.clockHand,
      dirtyWrite: options.dirtyWrite,
    },
  });
}

function loadIntoFrame(
  state: BufferPoolState,
  frameIndex: number,
  pageId: number,
  dirty: boolean,
) {
  const frame = frameByIndex(state, frameIndex);
  frame.pageId = pageId;
  frame.dirty = dirty;
  frame.pinCount = 0;
  frame.referenceBit = true;
  touchFrame(state, frameIndex);
  state.metrics.physicalReads += 1;

  if (state.policy === "clock") {
    state.clockHand = (frameIndex + 1) % state.capacity;
  }
}

function evictFrame(state: BufferPoolState, frameIndex: number) {
  const frame = frameByIndex(state, frameIndex);
  const evictedPageId = frame.pageId;
  const wasDirty = frame.dirty;

  if (wasDirty) {
    state.metrics.physicalWrites += 1;
    state.metrics.writebacks += 1;
  }

  state.metrics.evictions += 1;
  state.lruOrder = state.lruOrder.filter((index) => index !== frameIndex);
  frame.pageId = undefined;
  frame.dirty = false;
  frame.pinCount = 0;
  frame.referenceBit = false;
  frame.lastAccessTick = 0;
  frame.accessCount = 0;

  return { evictedPageId, wasDirty };
}

function findEmptyFrame(state: BufferPoolState) {
  return state.frames.find((frame) => frame.pageId === undefined);
}

function chooseLruVictim(state: BufferPoolState) {
  return state.lruOrder
    .map((frameIndex) => frameByIndex(state, frameIndex))
    .find((frame) => frame.pinCount === 0);
}

function applyReadOrUpdate(
  steps: BufferPoolStep[],
  state: BufferPoolState,
  pageId: number,
  operation: "read" | "update" | "range-scan",
) {
  state.metrics.logicalReads += 1;
  const dirtyOnLoad = operation === "update";
  const hitFrame = frameByPage(state, pageId);

  if (hitFrame) {
    state.metrics.hits += 1;
    touchFrame(state, hitFrame.frameIndex);
    if (operation === "update") {
      hitFrame.dirty = true;
    }

    pushStep(steps, state, {
      operation,
      title: `Page ${pageId} hit`,
      explanation:
        operation === "update"
          ? `page ${pageId} は buffer にあるため physical read は不要です。更新で dirty page になります。`
          : `page ${pageId} は buffer にあるため、disk I/O なしで参照できます。`,
      mode: operation === "update" ? "dirty" : "hit",
      activePageId: pageId,
      activeFrameIndex: hitFrame.frameIndex,
    });
    return;
  }

  state.metrics.misses += 1;
  pushStep(steps, state, {
    operation,
    title: `Page ${pageId} miss`,
    explanation:
      "page が buffer にないため physical read が必要です。空き frame がなければ eviction が発生します。",
    mode: "miss",
    activePageId: pageId,
  });

  const emptyFrame = findEmptyFrame(state);
  if (emptyFrame) {
    loadIntoFrame(state, emptyFrame.frameIndex, pageId, dirtyOnLoad);
    pushStep(steps, state, {
      operation,
      title: `Load page ${pageId}`,
      explanation:
        "空き frame に disk から page を読み込みます。CLOCK では読み込んだ page の reference bit を立てます。",
      mode: dirtyOnLoad ? "dirty" : "load",
      activePageId: pageId,
      activeFrameIndex: emptyFrame.frameIndex,
    });
    return;
  }

  if (state.policy === "lru") {
    applyLruReplacement(steps, state, pageId, operation, dirtyOnLoad);
    return;
  }

  applyClockReplacement(steps, state, pageId, operation, dirtyOnLoad);
}

function applyLruReplacement(
  steps: BufferPoolStep[],
  state: BufferPoolState,
  pageId: number,
  operation: "read" | "update" | "range-scan",
  dirtyOnLoad: boolean,
) {
  const victim = chooseLruVictim(state);
  if (!victim) {
    pushStep(steps, state, {
      operation,
      title: "No evictable frame",
      explanation:
        "すべての frame が pinned されているため、この操作では新しい page を読み込めません。",
      mode: "pin",
      activePageId: pageId,
    });
    return;
  }

  const victimPageId = victim.pageId;
  if (victim.dirty) {
    const { evictedPageId } = evictFrame(state, victim.frameIndex);
    pushStep(steps, state, {
      operation,
      title: `Write back dirty page ${evictedPageId}`,
      explanation:
        "LRU の victim が dirty page なので、frame を再利用する前に disk へ書き戻します。",
      mode: "writeback",
      activePageId: pageId,
      victimFrameIndex: victim.frameIndex,
      evictedPageId,
      dirtyWrite: true,
    });
  } else {
    const { evictedPageId } = evictFrame(state, victim.frameIndex);
    pushStep(steps, state, {
      operation,
      title: `Evict page ${evictedPageId}`,
      explanation:
        "LRU list の最も古い clean page を追い出し、frame を空けます。",
      mode: "evict",
      activePageId: pageId,
      victimFrameIndex: victim.frameIndex,
      evictedPageId,
    });
  }

  loadIntoFrame(state, victim.frameIndex, pageId, dirtyOnLoad);
  pushStep(steps, state, {
    operation,
    title: `Load page ${pageId}`,
    explanation: `evict した frame に page ${pageId} を読み込み、LRU list の MRU 側へ移します。`,
    mode: dirtyOnLoad ? "dirty" : "load",
    activePageId: pageId,
    activeFrameIndex: victim.frameIndex,
    evictedPageId: victimPageId,
  });
}

function applyClockReplacement(
  steps: BufferPoolStep[],
  state: BufferPoolState,
  pageId: number,
  operation: "read" | "update" | "range-scan",
  dirtyOnLoad: boolean,
) {
  let probes = 0;
  const maxProbes = state.capacity * 3;

  while (probes < maxProbes) {
    const frame = frameByIndex(state, state.clockHand);
    const currentHand = state.clockHand;

    if (frame.pinCount > 0) {
      state.clockHand = (state.clockHand + 1) % state.capacity;
      pushStep(steps, state, {
        operation,
        title: `Skip pinned frame ${currentHand}`,
        explanation:
          "pin count が 1 以上の page は利用中なので eviction 候補から外します。",
        mode: "pin",
        activePageId: frame.pageId,
        activeFrameIndex: currentHand,
      });
      probes += 1;
      continue;
    }

    if (frame.referenceBit) {
      frame.referenceBit = false;
      state.clockHand = (state.clockHand + 1) % state.capacity;
      pushStep(steps, state, {
        operation,
        title: `Second chance for page ${frame.pageId}`,
        explanation:
          "reference bit が 1 なので、この周回では追い出さず bit を 0 にして次の frame へ進みます。",
        mode: "second-chance",
        activePageId: frame.pageId,
        activeFrameIndex: currentHand,
      });
      probes += 1;
      continue;
    }

    const targetFrameIndex = frame.frameIndex;
    if (frame.dirty) {
      const { evictedPageId } = evictFrame(state, targetFrameIndex);
      pushStep(steps, state, {
        operation,
        title: `Write back dirty page ${evictedPageId}`,
        explanation:
          "CLOCK hand が reference bit 0 の dirty page を見つけたため、writeback してから再利用します。",
        mode: "writeback",
        activePageId: pageId,
        victimFrameIndex: targetFrameIndex,
        evictedPageId,
        dirtyWrite: true,
      });
    } else {
      const { evictedPageId } = evictFrame(state, targetFrameIndex);
      pushStep(steps, state, {
        operation,
        title: `Evict page ${evictedPageId}`,
        explanation:
          "reference bit が 0 で pin されていない clean page を victim として選びます。",
        mode: "evict",
        activePageId: pageId,
        victimFrameIndex: targetFrameIndex,
        evictedPageId,
      });
    }

    loadIntoFrame(state, targetFrameIndex, pageId, dirtyOnLoad);
    pushStep(steps, state, {
      operation,
      title: `Load page ${pageId}`,
      explanation:
        "空いた frame に page を読み込み、reference bit を 1 にして clock hand を次へ進めます。",
      mode: dirtyOnLoad ? "dirty" : "load",
      activePageId: pageId,
      activeFrameIndex: targetFrameIndex,
    });
    return;
  }

  pushStep(steps, state, {
    operation,
    title: "No evictable frame",
    explanation:
      "CLOCK hand が一周以上しても evict できる frame がありません。全 page が pin されている可能性があります。",
    mode: "clock-scan",
    activePageId: pageId,
  });
}

function applyPin(
  steps: BufferPoolStep[],
  state: BufferPoolState,
  pageId: number,
  operation: "pin" | "unpin",
) {
  const frame = frameByPage(state, pageId);
  if (!frame) {
    applyReadOrUpdate(steps, state, pageId, "read");
  }

  const target = frameByPage(state, pageId);
  if (!target) {
    return;
  }

  if (operation === "pin") {
    target.pinCount += 1;
    touchFrame(state, target.frameIndex);
    pushStep(steps, state, {
      operation,
      title: `Pin page ${pageId}`,
      explanation:
        "pin count を増やします。pin された page は query が使っているため eviction できません。",
      mode: "pin",
      activePageId: pageId,
      activeFrameIndex: target.frameIndex,
    });
    return;
  }

  target.pinCount = Math.max(0, target.pinCount - 1);
  touchFrame(state, target.frameIndex);
  pushStep(steps, state, {
    operation,
    title: `Unpin page ${pageId}`,
    explanation:
      "pin count を下げます。0 になった page は再び eviction 候補に戻ります。",
    mode: "unpin",
    activePageId: pageId,
    activeFrameIndex: target.frameIndex,
  });
}

function applyCheckpoint(steps: BufferPoolStep[], state: BufferPoolState) {
  const dirtyFrames = state.frames.filter(
    (frame) => frame.pageId !== undefined && frame.dirty,
  );

  if (dirtyFrames.length === 0) {
    pushStep(steps, state, {
      operation: "checkpoint",
      title: "Checkpoint: no dirty pages",
      explanation:
        "dirty page がないため、checkpoint による physical write は発生しません。",
      mode: "checkpoint",
    });
    return;
  }

  for (const frame of dirtyFrames) {
    frame.dirty = false;
    state.metrics.physicalWrites += 1;
    state.metrics.writebacks += 1;
    pushStep(steps, state, {
      operation: "checkpoint",
      title: `Flush dirty page ${frame.pageId}`,
      explanation:
        "checkpoint は dirty page を disk に書き戻し、後続の eviction cost を下げます。",
      mode: "checkpoint",
      activePageId: frame.pageId,
      activeFrameIndex: frame.frameIndex,
      dirtyWrite: true,
    });
  }
}

export function buildBufferPoolSteps(
  baseState: BufferPoolState,
  actions: BufferPoolAction[],
): BufferPoolStep[] {
  const state = cloneBufferPoolState(baseState);
  const steps: BufferPoolStep[] = [];

  for (const action of actions) {
    if (action.operation === "checkpoint") {
      applyCheckpoint(steps, state);
      continue;
    }

    if (action.pageId === undefined) {
      continue;
    }

    if (action.operation === "read" || action.operation === "update") {
      applyReadOrUpdate(steps, state, action.pageId, action.operation);
      continue;
    }

    if (action.operation === "range-scan") {
      applyReadOrUpdate(steps, state, action.pageId, "range-scan");
      continue;
    }

    applyPin(steps, state, action.pageId, action.operation);
  }

  return steps;
}
