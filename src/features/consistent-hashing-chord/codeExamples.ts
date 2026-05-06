import { ChordCodeExampleSet } from "./types";

export const chordCodeExamples: ChordCodeExampleSet = {
  snippets: {
    "lookup-resource": {
      python: {
        title: "Python: find_successor(key_hash)",
        code: `def find_successor(self, start: Node, key_hash: int) -> Node:
    node = start

    while not self.is_responsible(node, key_hash):
        finger = self.closest_preceding_finger(node, key_hash)
        node = finger.node if finger else node.successor

    return node`,
      },
      c: {
        title: "C: find_successor(start, key_hash)",
        code: `Node *find_successor(Chord *chord, Node *start, int key_hash) {
    Node *node = start;

    while (!is_responsible(chord, node, key_hash)) {
        Finger *finger = closest_preceding_finger(node, key_hash);
        node = finger != NULL ? finger->node : node->successor;
    }

    return node;
}`,
      },
    },
  },
  fullImplementations: {
    python: {
      title: "Python: minimal Chord lookup",
      code: `class Node:
    def __init__(self, node_id: str, node_hash: int) -> None:
        self.id = node_id
        self.hash = node_hash
        self.successor: Node | None = None
        self.predecessor: Node | None = None
        self.finger_table: list[tuple[int, Node]] = []

class Chord:
    def is_responsible(self, node: Node, key_hash: int) -> bool:
        return node.predecessor.hash < key_hash <= node.hash

    def closest_preceding_finger(self, node: Node, key_hash: int):
        for start, finger_node in reversed(node.finger_table):
            if node.hash < finger_node.hash < key_hash:
                return finger_node
        return None

    def find_successor(self, start: Node, key_hash: int) -> Node:
        node = start
        while not self.is_responsible(node, key_hash):
            finger = self.closest_preceding_finger(node, key_hash)
            node = finger if finger is not None else node.successor
        return node`,
    },
    c: {
      title: "C: minimal Chord lookup",
      code: `typedef struct Finger {
    int start;
    struct Node *node;
} Finger;

typedef struct Node {
    const char *id;
    int hash;
    struct Node *successor;
    struct Node *predecessor;
    Finger finger_table[5];
} Node;

Node *closest_preceding_finger(Node *node, int key_hash) {
    for (int i = 4; i >= 0; i--) {
        if (is_between(node->finger_table[i].node->hash, node->hash, key_hash)) {
            return node->finger_table[i].node;
        }
    }
    return NULL;
}

Node *find_successor(Node *start, int key_hash) {
    Node *node = start;
    while (!is_responsible(node, key_hash)) {
        Node *finger = closest_preceding_finger(node, key_hash);
        node = finger != NULL ? finger : node->successor;
    }
    return node;
}`,
    },
  },
  modeNotes: {
    hash: "まずはリソースをリング上の位置へ写像し、探索ターゲットを決めます。",
    scan: "現在ノードの finger table を上から見て、ターゲット直前まで最も遠く進める候補を探します。",
    hop: "選ばれた finger を使って大きくジャンプし、対数的に距離を縮めます。",
    wrap: "リング末尾側から先頭側へ回り込むのも、Chord では通常の探索経路です。",
    responsible: "現在ノードが担当区間に入ったので、もうこれ以上ジャンプする必要はありません。",
    assign: "最終的な担当ノードが確定しました。lookup path を見れば、どの finger が使われたか追えます。",
    miss: "ノードがない場合は finger table も構築できず、探索も実行できません。",
  },
};
