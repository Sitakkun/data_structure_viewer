import { BloomCodeExampleSet } from "./types";

export const bloomCodeExamples: BloomCodeExampleSet = {
  snippets: {
    insert: {
      python: {
        title: "Python: add(item)",
        code: `def add(self, item: str) -> None:
    for index in self.hashes(item):
        self.bits[index] = 1`,
      },
      c: {
        title: "C: bloom_add(filter, item)",
        code: `void bloom_add(BloomFilter *filter, const char *item) {
    for (size_t i = 0; i < filter->hash_count; i++) {
        int index = filter->hashes[i](item) % filter->bit_count;
        filter->bits[index] = true;
    }
}`,
      },
    },
    query: {
      python: {
        title: "Python: contains(item)",
        code: `def contains(self, item: str) -> bool:
    for index in self.hashes(item):
        if self.bits[index] == 0:
            return False
    return True`,
      },
      c: {
        title: "C: bloom_contains(filter, item)",
        code: `bool bloom_contains(BloomFilter *filter, const char *item) {
    for (size_t i = 0; i < filter->hash_count; i++) {
        int index = filter->hashes[i](item) % filter->bit_count;
        if (!filter->bits[index]) return false;
    }
    return true;
}`,
      },
    },
  },
  fullImplementations: {
    python: {
      title: "Python: minimal Bloom filter",
      code: `class BloomFilter:
    def __init__(self, bit_count: int = 16) -> None:
        self.bits = [0] * bit_count

    def hashes(self, item: str) -> list[int]:
        h1 = 0
        h2 = 7
        for char in item:
            h1 = (h1 * 31 + ord(char)) % len(self.bits)
            h2 = (h2 * 17 + ord(char)) % len(self.bits)
        return [h1, h2]

    def add(self, item: str) -> None:
        for index in self.hashes(item):
            self.bits[index] = 1

    def contains(self, item: str) -> bool:
        return all(self.bits[index] for index in self.hashes(item))`,
    },
    c: {
      title: "C: minimal Bloom filter",
      code: `typedef struct {
    bool bits[16];
    size_t bit_count;
} BloomFilter;

void bloom_add(BloomFilter *filter, const char *item) {
    int indexes[2] = { hash1(item) % 16, hash2(item) % 16 };
    for (int i = 0; i < 2; i++) {
        filter->bits[indexes[i]] = true;
    }
}

bool bloom_contains(BloomFilter *filter, const char *item) {
    int indexes[2] = { hash1(item) % 16, hash2(item) % 16 };
    for (int i = 0; i < 2; i++) {
        if (!filter->bits[indexes[i]]) return false;
    }
    return true;
}`,
    },
  },
  modeNotes: {
    hash: "まずは各ハッシュ関数の出力位置を決めます。Bloom Filter ではここだけが操作対象です。",
    "set-bit": "挿入では該当ビットを 1 にするだけで、要素そのものや個数は区別しません。",
    "check-bit": "照会では各位置のビットを順に見て、0 があるかどうかを確認します。",
    miss: "1 つでも 0 があれば、その要素は絶対に未登録です。",
    maybe: "全部 1 でも、Bloom Filter が言えるのは「たぶん存在する」までです。",
    "false-positive":
      "全部 1 でも未登録のことがあり、その代表例が false positive です。",
  },
};
