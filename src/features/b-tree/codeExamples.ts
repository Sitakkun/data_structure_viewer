import { BTreeCodeExampleSet } from "./types";

export const btreeCodeExamples: BTreeCodeExampleSet = {
  snippets: {
    search: {
      python: {
        title: "Python: search(node, key)",
        code: `def search(node, key):
    i = 0
    while i < len(node.keys) and key > node.keys[i]:
        i += 1

    if i < len(node.keys) and key == node.keys[i]:
        return node, i

    if node.leaf:
        return None

    return search(node.children[i], key)`,
      },
      c: {
        title: "C: btree_search(node, key)",
        code: `SearchResult btree_search(Node *node, int key) {
    int i = 0;
    while (i < node->key_count && key > node->keys[i]) i++;

    if (i < node->key_count && key == node->keys[i]) {
        return (SearchResult){ .node = node, .index = i };
    }
    if (node->is_leaf) return (SearchResult){0};

    return btree_search(node->children[i], key);
}`,
      },
    },
    insert: {
      python: {
        title: "Python: insert(key)",
        code: `def insert(self, key):
    root = self.root
    if len(root.keys) == 2 * self.t - 1:
        new_root = Node(leaf=False)
        new_root.children.append(root)
        self.split_child(new_root, 0)
        self.root = new_root
    self.insert_non_full(self.root, key)`,
      },
      c: {
        title: "C: btree_insert(tree, key)",
        code: `void btree_insert(BTree *tree, int key) {
    Node *root = tree->root;
    if (root->key_count == MAX_KEYS) {
        Node *new_root = make_node(false);
        new_root->children[0] = root;
        split_child(new_root, 0);
        tree->root = new_root;
    }
    insert_non_full(tree->root, key);
}`,
      },
    },
    delete: {
      python: {
        title: "Python: delete_leaf_key(node, key)",
        code: `def delete_leaf_key(node, key):
    i = 0
    while i < len(node.keys) and key > node.keys[i]:
        i += 1

    if i == len(node.keys) or node.keys[i] != key:
        return False
    if not node.leaf:
        raise NotImplementedError("internal delete needs rebalancing")

    node.keys.pop(i)
    return True`,
      },
      c: {
        title: "C: btree_delete_leaf_key(node, key)",
        code: `bool btree_delete_leaf_key(Node *node, int key) {
    int i = 0;
    while (i < node->key_count && key > node->keys[i]) i++;

    if (i == node->key_count || node->keys[i] != key) return false;
    if (!node->is_leaf) return false;

    for (int j = i; j < node->key_count - 1; j++) {
        node->keys[j] = node->keys[j + 1];
    }
    node->key_count--;
    return true;
}`,
      },
    },
    "range-scan": {
      python: {
        title: "Python: range_scan(node, start, end)",
        code: `def range_scan(node, start, end, out):
    i = 0
    while i < len(node.keys):
        if not node.leaf and start <= node.keys[i]:
            range_scan(node.children[i], start, end, out)

        key = node.keys[i]
        if start <= key <= end:
            out.append(key)
        if key > end:
            return
        i += 1

    if not node.leaf:
        range_scan(node.children[-1], start, end, out)`,
      },
      c: {
        title: "C: btree_range_scan(node, start, end)",
        code: `void btree_range_scan(Node *node, int start, int end, int *out, int *count) {
    for (int i = 0; i < node->key_count; i++) {
        if (!node->is_leaf && start <= node->keys[i]) {
            btree_range_scan(node->children[i], start, end, out, count);
        }

        int key = node->keys[i];
        if (start <= key && key <= end) out[(*count)++] = key;
        if (key > end) return;
    }

    if (!node->is_leaf) {
        btree_range_scan(node->children[node->key_count], start, end, out, count);
    }
}`,
      },
    },
  },
  fullImplementations: {
    python: {
      title: "Python: minimal B-tree insert/search",
      code: `class Node:
    def __init__(self, leaf: bool) -> None:
        self.leaf = leaf
        self.keys: list[int] = []
        self.children: list[Node] = []

class BTree:
    def __init__(self, t: int = 2) -> None:
        self.t = t
        self.root = Node(leaf=True)

    def split_child(self, parent: Node, index: int) -> None:
        child = parent.children[index]
        sibling = Node(leaf=child.leaf)
        mid = self.t - 1
        parent.keys.insert(index, child.keys[mid])
        sibling.keys = child.keys[self.t :]
        child.keys = child.keys[:mid]
        if not child.leaf:
            sibling.children = child.children[self.t :]
            child.children = child.children[: self.t]
        parent.children.insert(index + 1, sibling)

    def insert_non_full(self, node: Node, key: int) -> None:
        if node.leaf:
            node.keys.append(key)
            node.keys.sort()
            return
        i = len(node.keys)
        while i > 0 and key < node.keys[i - 1]:
            i -= 1
        if len(node.children[i].keys) == 2 * self.t - 1:
            self.split_child(node, i)
            if key > node.keys[i]:
                i += 1
        self.insert_non_full(node.children[i], key)`,
    },
    c: {
      title: "C: minimal B-tree insert/search",
      code: `#define T 2
#define MAX_KEYS (2 * T - 1)

typedef struct Node {
    bool is_leaf;
    int key_count;
    int keys[MAX_KEYS];
    struct Node *children[2 * T];
} Node;

void split_child(Node *parent, int index) {
    Node *child = parent->children[index];
    Node *sibling = make_node(child->is_leaf);

    sibling->key_count = T - 1;
    for (int j = 0; j < T - 1; j++) sibling->keys[j] = child->keys[j + T];
    if (!child->is_leaf) {
        for (int j = 0; j < T; j++) sibling->children[j] = child->children[j + T];
    }
    child->key_count = T - 1;
    /* parent insertion omitted for brevity */
}`,
    },
  },
  modeNotes: {
    scan: "現在ノードのキーを順に比べ、どこで止まるかで次にたどる子が決まります。",
    descend: "B ツリーは必要な部分木だけをたどるので、全体を線形には見ません。",
    insert: "葉まで降りたら、そのノード内で順序を保ったままキーを差し込みます。",
    delete:
      "葉ノードからキーを取り除きます。最小キー数を下回る場合は兄弟からの借用またはマージが必要です。",
    "internal-delete":
      "内部ノードの削除では、前後のキーとの入れ替えと再調整が必要です。今回の MVP では状態を変更しません。",
    underflow:
      "削除によって最小キー数を下回るため、借用またはマージが必要です。これは次の段階で扱います。",
    split: "満杯の子ノードは先に分割し、中央値を親に昇格させてから処理を続けます。",
    "root-split":
      "根が満杯なら最初に分割し、新しい根を作ることで高さを 1 段増やします。",
    "range-start":
      "B ツリーの範囲走査は、開始位置の近くから順序に沿ってキーを確認します。亜種では sibling pointer で隣接ノードへ進むことがあります。",
    "range-scan":
      "現在ノードのキーが範囲内か確認しています。この可視化では通常構造を順序どおりにたどります。",
    collect: "範囲内のキーを結果セットへ追加します。",
    "range-stop":
      "終了キーを超えたので走査を止めます。これ以降のキーは順序上すべて範囲外です。",
    "range-done": "回収したキーを結果として返します。",
    found: "比較中のキーと一致したので探索成功です。",
    miss: "葉まで降りて見つからなければ、そのキーは木に存在しません。",
  },
};
