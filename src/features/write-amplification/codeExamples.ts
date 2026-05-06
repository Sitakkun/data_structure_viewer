import { WriteAmplificationCodeExampleSet } from "./types";

export const writeAmplificationCodeExamples: WriteAmplificationCodeExampleSet = {
  snippets: {
    btree: {
      pseudo: {
        title: "Pseudo: B-tree write path",
        code: `for write in workload:
    append_to_wal(write)
    page = buffer_pool.get_leaf_page(write.key)
    page.apply(write)
    mark_dirty(page)

    if page.is_full():
        split_leaf(page)
        update_parent_separator()

checkpoint_or_eviction_writes_dirty_pages()`,
      },
      python: {
        title: "Python-ish: B-tree units",
        code: `units = 0
for i in range(count):
    units += wal_enabled
    units += 1  # dirty page write-back later
    if (i + 1) % split_every == 0:
        units += 2  # sibling + parent`,
      },
    },
    bepsilon: {
      pseudo: {
        title: "Pseudo: Bε tree write path",
        code: `for write in workload:
    append_to_wal(write)
    root.buffer.append(Message(write))

    if root.buffer.is_full():
        batches = partition_by_child(root.buffer)
        flush_batches_to_children(batches)

        if leaf.buffer.is_full():
            apply_messages_to_leaf()
            split_if_needed()`,
      },
      python: {
        title: "Python-ish: Bε units",
        code: `units = wal_enabled * count
batches = ceil(count / buffer_capacity)
units += batches      # flush to child
units += batches      # apply at leaf
units += splits * 2   # split if capacity exceeded`,
      },
    },
    lsm: {
      pseudo: {
        title: "Pseudo: LSM-tree write path",
        code: `for write in workload:
    append_to_wal(write)
    memtable.put(write.key, write.value_or_tombstone)

    if memtable.is_full():
        freeze_memtable()
        write_sorted_sstable()

    if too_many_sstables():
        compact_tables()
        discard_obsolete_versions()`,
      },
      python: {
        title: "Python-ish: LSM units",
        code: `units = wal_enabled * count
flushes = ceil(count / memtable_capacity)
units += flushes

compactions = flushes // compaction_fanout
units += compactions * compaction_fanout`,
      },
    },
  },
  notes: {
    btree:
      "B-tree はその場更新に向く一方、小さな論理更新でも page write-back や split propagation が物理書き込みになります。",
    bepsilon:
      "Bε tree は更新を message として buffer に貯め、child range ごとに batch flush することで小さなランダム更新をまとめます。",
    lsm: "LSM-tree は memtable と immutable SSTable で sequential write に寄せますが、compaction で同じデータが再書き込みされます。",
  },
};
