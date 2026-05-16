import { LSMCodeExampleSet } from "./types";

export const lsmCodeExamples: LSMCodeExampleSet = {
  snippets: {
    put: {
      pseudo: {
        title: "Pseudo: put(key, value)",
        code: `append WAL(key, value)
memtable.put(key, value, sequence)

if memtable.is_full():
    flush_memtable()`,
      },
      python: {
        title: "Python-ish: put",
        code: `def put(self, key, value):
    record = Record(key, value, self.next_seq())
    self.wal.append(record)
    self.memtable[key] = record

    if len(self.memtable) >= self.memtable_capacity:
        self.flush()`,
      },
    },
    delete: {
      pseudo: {
        title: "Pseudo: delete(key)",
        code: `append WAL(key, TOMBSTONE)
memtable.put(key, TOMBSTONE, sequence)

# old values remain in SSTables
# compaction removes them later`,
      },
      python: {
        title: "Python-ish: delete",
        code: `def delete(self, key):
    record = Record(key, tombstone=True, seq=self.next_seq())
    self.wal.append(record)
    self.memtable[key] = record`,
      },
    },
    search: {
      pseudo: {
        title: "Pseudo: search(key)",
        code: `if key in memtable:
    return resolve(memtable[key])

for table in newest_sstable_first:
    record = table.get(key)
    if record:
        return resolve(record)

return MISS`,
      },
      python: {
        title: "Python-ish: search",
        code: `def search(self, key):
    if key in self.memtable:
        return self.resolve(self.memtable[key])

    for table in self.sstables:
        record = table.get(key)
        if record:
            return self.resolve(record)
    return None`,
      },
    },
    flush: {
      pseudo: {
        title: "Pseudo: flush_memtable()",
        code: `immutable = freeze(memtable)
memtable = new_empty_memtable()

sstable = write_sorted_file(immutable)
publish(sstable)
discard_wal_segment()`,
      },
      python: {
        title: "Python-ish: flush",
        code: `def flush(self):
    immutable = sorted(self.memtable.values(), key=lambda r: r.key)
    self.memtable = {}
    table = SSTable(immutable)
    self.sstables.insert(0, table)
    self.wal.clear()`,
      },
    },
    compact: {
      pseudo: {
        title: "Pseudo: compact()",
        code: `records = merge_sorted_sstables()
latest = keep_newest_record_per_key(records)
live = drop_tombstones(latest)

write_new_sstable(live)
delete_old_sstables()`,
      },
      python: {
        title: "Python-ish: compact",
        code: `def compact(self):
    by_key = {}
    for table in self.sstables:
        for record in table.records:
            if record.key not in by_key or record.seq > by_key[record.key].seq:
                by_key[record.key] = record
    live = [r for r in by_key.values() if not r.tombstone]
    self.sstables = [SSTable(sorted(live, key=lambda r: r.key))]`,
      },
    },
  },
  fullImplementations: {
    pseudo: {
      title: "Pseudo: minimal LSM-tree lifecycle",
      code: `write:
  WAL append -> memtable update

flush:
  freeze memtable -> write sorted SSTable -> clear WAL segment

read:
  memtable first -> newer SSTables -> older SSTables

delete:
  write tombstone -> hide older values

compaction:
  merge SSTables -> keep newest -> drop tombstones`,
    },
    python: {
      title: "Python-ish: tiny LSM structure",
      code: `class LSMTree:
    def __init__(self, capacity=3):
        self.wal = []
        self.memtable = {}
        self.sstables = []
        self.capacity = capacity
        self.sequence = 0

    def put(self, key, value):
        self.sequence += 1
        record = Record(key, value, self.sequence)
        self.wal.append(record)
        self.memtable[key] = record
        if len(self.memtable) >= self.capacity:
            self.flush()`,
    },
  },
  modeNotes: {
    wal: "WAL は memtable の内容が SSTable 化される前の唯一の永続コピーです。",
    "memtable-write": "memtable への write はメモリ上で済むため、小さなランダム書き込みを避けられます。",
    freeze: "flush 中も新しい write を受けられるよう、現在の memtable を immutable に切り替えます。",
    flush: "memtable は sorted SSTable として sequential に書き出されます。",
    "search-memtable": "検索は最新データがある memtable から始めます。",
    "search-sstable": "SSTable が増えるほど、検索時に見る候補が増えます。",
    tombstone: "tombstone は古い値を論理的に隠し、compaction で物理的に取り除かれます。",
    compact: "compaction は read amplification と space amplification を下げる一方で、write amplification を増やします。",
    "drop-obsolete": "同じ key の古い record と tombstone を落とし、compact 済み SSTable を作ります。",
    found: "最も新しい record が見つかった時点で結果を確定します。",
    miss: "memtable と SSTable のどこにも key が見つからない状態です。",
  },
};
