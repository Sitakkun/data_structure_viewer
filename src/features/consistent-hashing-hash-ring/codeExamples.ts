import { RingCodeExampleSet } from "./types";

export const hashRingCodeExamples: RingCodeExampleSet = {
  snippets: {
    "lookup-resource": {
      python: {
        title: "Python: lookup(resource_id)",
        code: `def lookup(self, resource_id: str) -> str | None:
    resource_hash = self.hash_value(resource_id)
    if not self.ring:
        return None

    for node_hash, node_id in self.ring:
        if node_hash >= resource_hash:
            return node_id

    return self.ring[0][1]`,
      },
      c: {
        title: "C: lookup(ring, resource_id)",
        code: `Node *lookup(HashRing *ring, const char *resource_id) {
    int resource_hash = hash_value(resource_id);
    if (ring->count == 0) return NULL;

    for (size_t i = 0; i < ring->count; i++) {
        if (ring->entries[i].hash >= resource_hash) {
            return ring->entries[i].node;
        }
    }

    return ring->entries[0].node;
}`,
      },
    },
    "add-resource": {
      python: {
        title: "Python: add_resource(resource_id)",
        code: `def add_resource(self, resource_id: str) -> None:
    if resource_id in self.resources:
        return

    owner = self.lookup(resource_id)
    self.resources[resource_id] = {
        "hash": self.hash_value(resource_id),
        "node_id": owner,
    }`,
      },
      c: {
        title: "C: add_resource(ring, resource_id)",
        code: `void add_resource(HashRing *ring, const char *resource_id) {
    if (find_resource(ring, resource_id) != NULL) return;

    Node *owner = lookup(ring, resource_id);
    ring->resources[ring->resource_count++] = (Resource){
        .id = resource_id,
        .hash = hash_value(resource_id),
        .node = owner,
    };
}`,
      },
    },
    "add-node": {
      python: {
        title: "Python: add_node(node_id)",
        code: `def add_node(self, node_id: str) -> None:
    node_hash = self.hash_value(node_id)
    self.ring.append((node_hash, node_id))
    self.ring.sort(key=lambda entry: entry[0])
    self.reassign_resources()`,
      },
      c: {
        title: "C: add_node(ring, node)",
        code: `void add_node(HashRing *ring, Node *node) {
    int node_hash = hash_value(node->id);
    ring->entries[ring->count++] = (Entry){ .hash = node_hash, .node = node };
    qsort(ring->entries, ring->count, sizeof(Entry), compare_entry);
    reassign_resources(ring);
}`,
      },
    },
    "remove-node": {
      python: {
        title: "Python: remove_node(node_id)",
        code: `def remove_node(self, node_id: str) -> None:
    self.ring = [
        entry for entry in self.ring if entry[1] != node_id
    ]
    self.reassign_resources()`,
      },
      c: {
        title: "C: remove_node(ring, node_id)",
        code: `void remove_node(HashRing *ring, const char *node_id) {
    size_t write_index = 0;

    for (size_t read_index = 0; read_index < ring->count; read_index++) {
        if (strcmp(ring->entries[read_index].node->id, node_id) != 0) {
            ring->entries[write_index++] = ring->entries[read_index];
        }
    }

    ring->count = write_index;
    reassign_resources(ring);
}`,
      },
    },
  },
  fullImplementations: {
    python: {
      title: "Python: minimal resource-aware hash ring",
      code: `class HashRing:
    def __init__(self) -> None:
        self.ring: list[tuple[int, str]] = []
        self.resources: dict[str, dict[str, str | int | None]] = {}

    def hash_value(self, value: str) -> int:
        hash_value = 0
        for char in value:
            hash_value = (hash_value * 31 + ord(char)) % 360
        return hash_value

    def lookup(self, resource_id: str) -> str | None:
        resource_hash = self.hash_value(resource_id)
        if not self.ring:
            return None
        for node_hash, node_id in self.ring:
            if node_hash >= resource_hash:
                return node_id
        return self.ring[0][1]

    def add_resource(self, resource_id: str) -> None:
        if resource_id in self.resources:
            return
        self.resources[resource_id] = {
            "hash": self.hash_value(resource_id),
            "node_id": self.lookup(resource_id),
        }

    def reassign_resources(self) -> None:
        for resource_id, resource in self.resources.items():
            resource["node_id"] = self.lookup(resource_id)`,
    },
    c: {
      title: "C: minimal resource-aware hash ring",
      code: `typedef struct {
    int hash;
    Node *node;
} Entry;

typedef struct {
    const char *id;
    int hash;
    Node *node;
} Resource;

typedef struct {
    Entry entries[32];
    size_t count;
    Resource resources[64];
    size_t resource_count;
} HashRing;

Node *lookup(HashRing *ring, const char *resource_id) {
    int resource_hash = hash_value(resource_id);
    if (ring->count == 0) return NULL;

    for (size_t i = 0; i < ring->count; i++) {
        if (ring->entries[i].hash >= resource_hash) {
            return ring->entries[i].node;
        }
    }

    return ring->entries[0].node;
}

void reassign_resources(HashRing *ring) {
    for (size_t i = 0; i < ring->resource_count; i++) {
        ring->resources[i].node = lookup(ring, ring->resources[i].id);
    }
}`,
    },
  },
  modeNotes: {
    hash: "リソースやノードをリング上の位置へ写像するところが出発点です。",
    scan: "ソート済みのリングを時計回りに見て、最初に条件を満たすノードを探します。",
    assign: "リソース位置以上で最初に見つかったノードが担当先になります。",
    resource: "登録したリソースは、その時点のリング構成にもとづいて担当ノードへ結び付きます。",
    insert: "ノード追加では、挿入位置の直前からそのノードまでの区間だけが再割り当てされます。",
    remove: "ノード削除では、そのノードの担当区間だけが次ノードへ移ります。",
    wrap: "右側に候補がないときは、リングの先頭へ巻き戻ります。",
    miss: "リング上にノードがないと担当先を決められません。",
  },
};
