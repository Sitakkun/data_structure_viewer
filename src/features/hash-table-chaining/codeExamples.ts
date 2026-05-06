import { CodeExampleSet, HashStrategy } from "./types";

const chainingCodeExamples: CodeExampleSet = {
  snippets: {
    insert: {
      python: {
        title: "Python: insert(key)",
        code: `def insert(self, key: int) -> bool:
    index = abs(key) % self.bucket_count
    chain = self.buckets[index]

    for value in chain:
        if value == key:
            return False

    chain.append(key)
    return True`,
      },
      c: {
        title: "C: insert(HashTable*, int)",
        code: `bool insert(HashTable *table, int key) {
    int index = abs(key) % (int)table->bucket_count;
    Node *current = table->buckets[index];
    Node *previous = NULL;

    while (current != NULL) {
        if (current->key == key) return false;
        previous = current;
        current = current->next;
    }

    Node *node = malloc(sizeof(Node));
    node->key = key;
    node->next = NULL;

    if (previous == NULL) table->buckets[index] = node;
    else previous->next = node;
    return true;
}`,
      },
    },
    search: {
      python: {
        title: "Python: search(key)",
        code: `def search(self, key: int) -> bool:
    index = abs(key) % self.bucket_count
    chain = self.buckets[index]

    for value in chain:
        if value == key:
            return True

    return False`,
      },
      c: {
        title: "C: search(HashTable*, int)",
        code: `bool search(HashTable *table, int key) {
    int index = abs(key) % (int)table->bucket_count;
    Node *current = table->buckets[index];

    while (current != NULL) {
        if (current->key == key) return true;
        current = current->next;
    }

    return false;
}`,
      },
    },
    delete: {
      python: {
        title: "Python: delete(key)",
        code: `def delete(self, key: int) -> bool:
    index = abs(key) % self.bucket_count
    chain = self.buckets[index]

    for i, value in enumerate(chain):
        if value == key:
            del chain[i]
            return True

    return False`,
      },
      c: {
        title: "C: delete_key(HashTable*, int)",
        code: `bool delete_key(HashTable *table, int key) {
    int index = abs(key) % (int)table->bucket_count;
    Node *current = table->buckets[index];
    Node *previous = NULL;

    while (current != NULL) {
        if (current->key == key) {
            if (previous == NULL) table->buckets[index] = current->next;
            else previous->next = current->next;
            free(current);
            return true;
        }
        previous = current;
        current = current->next;
    }

    return false;
}`,
      },
    },
  },
  fullImplementations: {
    python: {
      title: "Python: minimal separate chaining hash table",
      code: `class HashTable:
    def __init__(self, bucket_count: int = 7) -> None:
        self.bucket_count = bucket_count
        self.buckets: list[list[int]] = [[] for _ in range(bucket_count)]

    def _index(self, key: int) -> int:
        return abs(key) % self.bucket_count

    def insert(self, key: int) -> bool:
        index = self._index(key)
        chain = self.buckets[index]

        for value in chain:
            if value == key:
                return False

        chain.append(key)
        return True

    def search(self, key: int) -> bool:
        index = self._index(key)
        chain = self.buckets[index]

        for value in chain:
            if value == key:
                return True

        return False

    def delete(self, key: int) -> bool:
        index = self._index(key)
        chain = self.buckets[index]

        for i, value in enumerate(chain):
            if value == key:
                del chain[i]
                return True

        return False`,
    },
    c: {
      title: "C: minimal separate chaining hash table",
      code: `#include <stdbool.h>
#include <stddef.h>
#include <stdlib.h>

typedef struct Node {
    int key;
    struct Node *next;
} Node;

typedef struct {
    size_t bucket_count;
    Node **buckets;
} HashTable;

static int index_for(HashTable *table, int key) {
    return abs(key) % (int)table->bucket_count;
}

bool insert(HashTable *table, int key) {
    int index = index_for(table, key);
    Node *current = table->buckets[index];
    Node *previous = NULL;

    while (current != NULL) {
        if (current->key == key) return false;
        previous = current;
        current = current->next;
    }

    Node *node = malloc(sizeof(Node));
    node->key = key;
    node->next = NULL;

    if (previous == NULL) table->buckets[index] = node;
    else previous->next = node;
    return true;
}

bool search(HashTable *table, int key) {
    int index = index_for(table, key);
    Node *current = table->buckets[index];

    while (current != NULL) {
        if (current->key == key) return true;
        current = current->next;
    }

    return false;
}

bool delete_key(HashTable *table, int key) {
    int index = index_for(table, key);
    Node *current = table->buckets[index];
    Node *previous = NULL;

    while (current != NULL) {
        if (current->key == key) {
            if (previous == NULL) table->buckets[index] = current->next;
            else previous->next = current->next;
            free(current);
            return true;
        }
        previous = current;
        current = current->next;
    }

    return false;
}`,
    },
  },
  modeNotes: {
    hash: "まずハッシュ値を計算して、どのバケットを見るかを 1 行で決める部分を確認します。",
    collision: "同じバケットに要素があるので、そのまま上書きせずチェーンを見る必要があります。",
    scan: "チェーンを順にたどって比較しているループ部分を読むのがポイントです。",
    insert: "重複がなければ、末尾追加またはポインタ接続で新しいノードをチェーンへ入れます。",
    found: "比較の結果が一致したので、そこで探索や削除候補の特定を終えています。",
    delete: "削除は対象ノードを見つけた後、前後のつながりだけを直す処理に注目します。",
    miss: "最後までたどって見つからなかったときは、ループを抜けて false を返します。",
    duplicate: "重複を許可しない実装では、見つけた時点で追加せず終了します。",
  },
};

const linearProbingCodeExamples: CodeExampleSet = {
  snippets: {
    insert: {
      python: {
        title: "Python: insert(key) with linear probing",
        code: `DELETED = object()

def insert(self, key: int) -> bool:
    start = abs(key) % self.bucket_count
    first_deleted = None

    for offset in range(self.bucket_count):
        index = (start + offset) % self.bucket_count
        slot = self.slots[index]

        if slot is None:
            target = first_deleted if first_deleted is not None else index
            self.slots[target] = key
            return True
        if slot is DELETED:
            if first_deleted is None:
                first_deleted = index
            continue
        if slot == key:
            return False

    if first_deleted is not None:
        self.slots[first_deleted] = key
        return True

    return False`,
      },
      c: {
        title: "C: insert(HashTable*, int) with linear probing",
        code: `bool insert(HashTable *table, int key) {
    int start = abs(key) % (int)table->capacity;
    int first_deleted = -1;

    for (int offset = 0; offset < (int)table->capacity; offset++) {
        int index = (start + offset) % (int)table->capacity;
        Slot *slot = &table->slots[index];

        if (slot->state == EMPTY) {
            int target = first_deleted >= 0 ? first_deleted : index;
            table->slots[target].key = key;
            table->slots[target].state = OCCUPIED;
            return true;
        }
        if (slot->state == DELETED && first_deleted < 0) first_deleted = index;
        else if (slot->state == OCCUPIED && slot->key == key) return false;
    }

    if (first_deleted >= 0) {
        table->slots[first_deleted].key = key;
        table->slots[first_deleted].state = OCCUPIED;
        return true;
    }

    return false;
}`,
      },
    },
    search: {
      python: {
        title: "Python: search(key) with linear probing",
        code: `DELETED = object()

def search(self, key: int) -> bool:
    start = abs(key) % self.bucket_count

    for offset in range(self.bucket_count):
        index = (start + offset) % self.bucket_count
        slot = self.slots[index]

        if slot is None:
            return False
        if slot is DELETED:
            continue
        if slot == key:
            return True

    return False`,
      },
      c: {
        title: "C: search(HashTable*, int) with linear probing",
        code: `bool search(HashTable *table, int key) {
    int start = abs(key) % (int)table->capacity;

    for (int offset = 0; offset < (int)table->capacity; offset++) {
        int index = (start + offset) % (int)table->capacity;
        Slot slot = table->slots[index];

        if (slot.state == EMPTY) return false;
        if (slot.state == OCCUPIED && slot.key == key) return true;
    }

    return false;
}`,
      },
    },
    delete: {
      python: {
        title: "Python: delete(key) with tombstone",
        code: `DELETED = object()

def delete(self, key: int) -> bool:
    start = abs(key) % self.bucket_count

    for offset in range(self.bucket_count):
        index = (start + offset) % self.bucket_count
        slot = self.slots[index]

        if slot is None:
            return False
        if slot is DELETED:
            continue
        if slot == key:
            self.slots[index] = DELETED
            return True

    return False`,
      },
      c: {
        title: "C: delete_key(HashTable*, int) with tombstone",
        code: `bool delete_key(HashTable *table, int key) {
    int start = abs(key) % (int)table->capacity;

    for (int offset = 0; offset < (int)table->capacity; offset++) {
        int index = (start + offset) % (int)table->capacity;
        Slot *slot = &table->slots[index];

        if (slot->state == EMPTY) return false;
        if (slot->state == OCCUPIED && slot->key == key) {
            slot->state = DELETED;
            return true;
        }
    }

    return false;
}`,
      },
    },
  },
  fullImplementations: {
    python: {
      title: "Python: minimal linear probing hash table",
      code: `DELETED = object()

class HashTable:
    def __init__(self, bucket_count: int = 7) -> None:
        self.bucket_count = bucket_count
        self.slots: list[int | None | object] = [None for _ in range(bucket_count)]

    def _index(self, key: int) -> int:
        return abs(key) % self.bucket_count

    def insert(self, key: int) -> bool:
        start = self._index(key)
        first_deleted = None

        for offset in range(self.bucket_count):
            index = (start + offset) % self.bucket_count
            slot = self.slots[index]

            if slot is None:
                target = first_deleted if first_deleted is not None else index
                self.slots[target] = key
                return True
            if slot is DELETED:
                if first_deleted is None:
                    first_deleted = index
                continue
            if slot == key:
                return False

        if first_deleted is not None:
            self.slots[first_deleted] = key
            return True

        return False

    def search(self, key: int) -> bool:
        start = self._index(key)

        for offset in range(self.bucket_count):
            index = (start + offset) % self.bucket_count
            slot = self.slots[index]

            if slot is None:
                return False
            if slot is DELETED:
                continue
            if slot == key:
                return True

        return False

    def delete(self, key: int) -> bool:
        start = self._index(key)

        for offset in range(self.bucket_count):
            index = (start + offset) % self.bucket_count
            slot = self.slots[index]

            if slot is None:
                return False
            if slot is DELETED:
                continue
            if slot == key:
                self.slots[index] = DELETED
                return True

        return False`,
    },
    c: {
      title: "C: minimal linear probing hash table",
      code: `#include <stdbool.h>
#include <stddef.h>
#include <stdlib.h>

typedef enum { EMPTY, OCCUPIED, DELETED } SlotState;

typedef struct {
    int key;
    SlotState state;
} Slot;

typedef struct {
    size_t capacity;
    Slot *slots;
} HashTable;

static int index_for(HashTable *table, int key) {
    return abs(key) % (int)table->capacity;
}

bool insert(HashTable *table, int key) {
    int start = index_for(table, key);
    int first_deleted = -1;

    for (int offset = 0; offset < (int)table->capacity; offset++) {
        int index = (start + offset) % (int)table->capacity;
        Slot *slot = &table->slots[index];

        if (slot->state == EMPTY) {
            int target = first_deleted >= 0 ? first_deleted : index;
            table->slots[target].key = key;
            table->slots[target].state = OCCUPIED;
            return true;
        }
        if (slot->state == DELETED) {
            if (first_deleted < 0) first_deleted = index;
            continue;
        }
        if (slot->key == key) return false;
    }

    if (first_deleted >= 0) {
        table->slots[first_deleted].key = key;
        table->slots[first_deleted].state = OCCUPIED;
        return true;
    }

    return false;
}

bool search(HashTable *table, int key) {
    int start = index_for(table, key);

    for (int offset = 0; offset < (int)table->capacity; offset++) {
        int index = (start + offset) % (int)table->capacity;
        Slot slot = table->slots[index];

        if (slot.state == EMPTY) return false;
        if (slot.state == OCCUPIED && slot.key == key) return true;
    }

    return false;
}

bool delete_key(HashTable *table, int key) {
    int start = index_for(table, key);

    for (int offset = 0; offset < (int)table->capacity; offset++) {
        int index = (start + offset) % (int)table->capacity;
        Slot *slot = &table->slots[index];

        if (slot->state == EMPTY) return false;
        if (slot->state == OCCUPIED && slot->key == key) {
            slot->state = DELETED;
            return true;
        }
    }

    return false;
}`,
    },
  },
  modeNotes: {
    hash: "まず開始スロットを決め、そこから右へ順に調べる流れを見ます。",
    collision: "衝突したので、線形探索法では次のスロットへ 1 つずつ進みます。",
    scan: "現在のスロットが空か tombstone か、あるいは別キーかを確認するループに注目します。",
    insert: "空きスロットまたは tombstone を見つけたら、そこへ値を配置します。",
    found: "比較の結果が一致したので、ここで探索や削除対象の特定が終わります。",
    delete: "削除では空に戻さず tombstone を置き、後ろの探索鎖を維持します。",
    miss: "空スロットに当たるか 1 周しても見つからなければ、キーは不在です。",
    duplicate: "同じキーが見つかったので、重複挿入は行いません。",
    full: "再利用可能な位置がなく、テーブルが満杯のため挿入できません。",
  },
};

export const hashTableCodeExamplesByStrategy: Record<HashStrategy, CodeExampleSet> =
  {
    chaining: chainingCodeExamples,
    "linear-probing": linearProbingCodeExamples,
  };
