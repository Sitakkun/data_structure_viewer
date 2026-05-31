import { ExternalSortCodeExampleSet } from "./types";

export const externalSortCodeExamples: ExternalSortCodeExampleSet = {
  stageNotes: {
    input:
      "record count、run size、buffer count から initial run 数と merge fan-in を計算します。",
    "run-generation":
      "memory に乗る chunk ごとに sort し、sorted run として disk に書き戻します。",
    "merge-pass":
      "B 個の buffer があると、通常は B-1 本の input run と 1 本の output run を同時に扱います。",
  },
  snippets: {
    input: {
      pseudo: {
        title: "plan_external_sort(records, run_size, buffers)",
        code: `initial_runs = ceil(records / run_size)
fan_in = buffers - 1
merge_passes = ceil_log(initial_runs, fan_in)
total_passes = 1 + merge_passes
io_pages = 2 * records * total_passes`,
      },
      python: {
        title: "estimate_sort_cost(records, run_size, buffers)",
        code: `def estimate_sort_cost(records, run_size, buffers):
    runs = math.ceil(records / run_size)
    fan_in = max(2, buffers - 1)
    merge_passes = 0
    while runs > 1:
        runs = math.ceil(runs / fan_in)
        merge_passes += 1
    return 2 * records * (1 + merge_passes)`,
      },
    },
    "run-generation": {
      pseudo: {
        title: "run generation",
        code: `for chunk in scan_relation(run_size):
  pages = read(chunk)
  sorted_pages = sort_in_memory(pages)
  write_run(sorted_pages)`,
      },
      python: {
        title: "generate_runs(pages, run_size)",
        code: `def generate_runs(pages, run_size):
    runs = []
    for start in range(0, len(pages), run_size):
        chunk = pages[start:start + run_size]
        runs.append(sorted(chunk))
    return runs`,
      },
    },
    "merge-pass": {
      pseudo: {
        title: "k-way merge pass",
        code: `for group in chunks(runs, fan_in):
  heap = open_input_buffers(group)
  output = []
  while heap is not empty:
    output.append(pop_smallest(heap))
    refill_input_buffer_if_needed(heap)
  write_run(output)`,
      },
      python: {
        title: "merge_pass(runs, fan_in)",
        code: `def merge_pass(runs, fan_in):
    outputs = []
    for i in range(0, len(runs), fan_in):
        group = runs[i:i + fan_in]
        outputs.append(list(heapq.merge(*group)))
    return outputs`,
      },
    },
  },
  fullImplementations: {
    pseudo: {
      title: "external merge sort outline",
      code: `runs = []
for chunk in relation.pages(run_size):
  runs.append(sort_in_memory(chunk))

while len(runs) > 1:
  next_runs = []
  for group in chunks(runs, buffers - 1):
    next_runs.append(k_way_merge(group))
  runs = next_runs

return runs[0]`,
    },
    python: {
      title: "external_merge_sort(pages, run_size, buffers)",
      code: `def external_merge_sort(pages, run_size, buffers):
    fan_in = max(2, buffers - 1)
    runs = [
        sorted(pages[i:i + run_size])
        for i in range(0, len(pages), run_size)
    ]

    while len(runs) > 1:
        runs = [
            list(heapq.merge(*runs[i:i + fan_in]))
            for i in range(0, len(runs), fan_in)
        ]

    return runs[0] if runs else []`,
    },
  },
};
