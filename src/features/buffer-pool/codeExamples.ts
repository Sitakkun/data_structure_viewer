import { BufferPoolCodeExampleSet } from "./types";

export const bufferPoolCodeExamples: BufferPoolCodeExampleSet = {
  snippets: {
    read: {
      pseudo: {
        title: "Pseudo: read_page(page_id)",
        code: `if page_id in buffer_pool:
    mark_as_recent(page_id)
    return HIT

frame = find_free_frame_or_victim()
if frame.page is dirty:
    write_page_to_disk(frame.page)

read_page_from_disk(page_id, frame)
return MISS`,
      },
      python: {
        title: "Python-ish: read page",
        code: `def read_page(self, page_id):
    frame = self.page_table.get(page_id)
    if frame:
        self.touch(frame)
        return frame

    frame = self.find_frame()
    self.replace(frame, page_id)
    return frame`,
      },
    },
    update: {
      pseudo: {
        title: "Pseudo: update_page(page_id)",
        code: `frame = read_page(page_id)
frame.page.apply_change()
frame.dirty = true

# WAL must be durable before
# this dirty page is flushed later`,
      },
      python: {
        title: "Python-ish: update page",
        code: `def update_page(self, page_id):
    frame = self.read_page(page_id)
    frame.dirty = True
    frame.reference = True
    self.touch(frame)`,
      },
    },
    "range-scan": {
      pseudo: {
        title: "Pseudo: range scan",
        code: `for page_id in scan_range:
    read_page(page_id)

# large one-time reads can push
# other pages toward eviction`,
      },
      python: {
        title: "Python-ish: range scan",
        code: `def range_scan(self, start, end):
    for page_id in range(start, end + 1):
        self.read_page(page_id)`,
      },
    },
    pin: {
      pseudo: {
        title: "Pseudo: pin page",
        code: `frame = read_page(page_id)
frame.pin_count += 1

# pinned frames cannot be evicted`,
      },
      python: {
        title: "Python-ish: pin",
        code: `def pin(self, page_id):
    frame = self.read_page(page_id)
    frame.pin_count += 1
    return frame`,
      },
    },
    unpin: {
      pseudo: {
        title: "Pseudo: unpin page",
        code: `frame.pin_count = max(0, frame.pin_count - 1)

if frame.pin_count == 0:
    frame can become an eviction candidate`,
      },
      python: {
        title: "Python-ish: unpin",
        code: `def unpin(self, page_id):
    frame = self.page_table[page_id]
    frame.pin_count = max(0, frame.pin_count - 1)`,
      },
    },
    checkpoint: {
      pseudo: {
        title: "Pseudo: checkpoint",
        code: `for frame in buffer_pool:
    if frame.dirty:
        flush_log_until(frame.page_lsn)
        write_page_to_disk(frame.page)
        frame.dirty = false`,
      },
      python: {
        title: "Python-ish: checkpoint",
        code: `def checkpoint(self):
    for frame in self.frames:
        if frame.page_id and frame.dirty:
            self.write_page(frame)
            frame.dirty = False`,
      },
    },
  },
  fullImplementations: {
    pseudo: {
      title: "Pseudo: LRU vs CLOCK replacement",
      code: `LRU victim:
  choose oldest unpinned frame in LRU list

CLOCK victim:
  while true:
    frame = frames[clock_hand]
    if frame.pinned:
      advance hand
    else if frame.reference_bit == 1:
      frame.reference_bit = 0
      advance hand
    else:
      choose this frame`,
    },
    python: {
      title: "Python-ish: CLOCK victim",
      code: `def clock_victim(self):
    while True:
        frame = self.frames[self.hand]
        self.hand = (self.hand + 1) % len(self.frames)

        if frame.pin_count > 0:
            continue
        if frame.reference:
            frame.reference = False
            continue
        return frame`,
    },
  },
  modeNotes: {
    idle: "buffer pool は disk page を frame に載せ、以後の参照を physical read なしで処理します。",
    hit: "hit では disk I/O は発生せず、LRU では MRU 側へ移動し、CLOCK では reference bit を立てます。",
    miss: "miss では physical read が必要です。空き frame がなければ replacement policy が victim を選びます。",
    load: "disk から page を読み込み、page table / recency 情報 / reference bit を更新します。",
    evict: "clean page は書き戻しなしで evict できます。",
    writeback: "dirty page は frame を再利用する前に disk へ writeback が必要です。",
    dirty: "update された page は dirty になり、checkpoint または eviction まで buffer に残ります。",
    pin: "pin count がある frame は利用中なので eviction できません。",
    unpin: "pin count が 0 になると eviction 候補に戻ります。",
    "clock-scan": "CLOCK は hand を進めながら eviction 可能な frame を探します。",
    "second-chance": "reference bit が 1 の page は second chance を得て、bit を 0 にして今回は残ります。",
    checkpoint: "checkpoint は dirty page を先に flush し、後続の eviction を軽くします。",
  },
};
