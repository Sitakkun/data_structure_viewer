import { BPlusTreeCodeExampleSet } from "./types";

export const bplusTreeCodeExamples: BPlusTreeCodeExampleSet = {
  snippets: {
    search: {
      python: {
        title: "Python: search(node, key)",
        code: `def search(node, key):
    i = 0
    while i < len(node.keys) and key >= node.keys[i]:
        i += 1

    if node.leaf:
        return key in node.keys

    return search(node.children[i], key)`,
      },
      c: {
        title: "C: bplus_search(node, key)",
        code: `bool bplus_search(Node *node, int key) {
    int i = 0;
    while (i < node->key_count && key >= node->keys[i]) i++;
    if (node->is_leaf) return contains_key(node, key);
    return bplus_search(node->children[i], key);
}`,
      },
    },
    insert: {
      python: {
        title: "Python: insert(key)",
        code: `def insert(self, key):
    root = self.root
    if len(root.keys) == self.max_keys:
        new_root = Node(leaf=False)
        new_root.children.append(root)
        self.split_child(new_root, 0)
        self.root = new_root
    self.insert_non_full(self.root, key)`,
      },
      c: {
        title: "C: bplus_insert(tree, key)",
        code: `void bplus_insert(BPlusTree *tree, int key) {
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
        title: "Python: delete(key)",
        code: `def delete(self, key):
    leaf = self.find_leaf(key)
    if key not in leaf.keys:
        return False

    leaf.keys.remove(key)
    self.refresh_separators()
    return True`,
      },
      c: {
        title: "C: bplus_delete(tree, key)",
        code: `bool bplus_delete(BPlusTree *tree, int key) {
    Node *leaf = find_leaf(tree->root, key);
    int index = find_key_index(leaf, key);
    if (index < 0) return false;

    remove_key_at(leaf, index);
    refresh_separators(tree->root);
    return true;
}`,
      },
    },
    "range-scan": {
      python: {
        title: "Python: range_scan(start, end)",
        code: `def range_scan(self, start, end):
    node = self.find_leaf(start)
    result = []

    while node is not None:
        for key in node.keys:
            if key < start:
                continue
            if key > end:
                return result
            result.append(key)
        node = node.next_leaf

    return result`,
      },
      c: {
        title: "C: bplus_range_scan(tree, start, end)",
        code: `int bplus_range_scan(BPlusTree *tree, int start, int end, int *out) {
    Node *node = find_leaf(tree->root, start);
    int count = 0;

    while (node != NULL) {
        for (int i = 0; i < node->key_count; i++) {
            int key = node->keys[i];
            if (key < start) continue;
            if (key > end) return count;
            out[count++] = key;
        }
        node = node->next_leaf;
    }

    return count;
}`,
      },
    },
  },
  fullImplementations: {
    python: {
      title: "Python: minimal B+ tree insert/search",
      code: `class Node:
    def __init__(self, leaf: bool) -> None:
        self.leaf = leaf
        self.keys: list[int] = []
        self.children: list[Node] = []
        self.next_leaf: Node | None = None

class BPlusTree:
    def split_child(self, parent: Node, index: int) -> None:
        child = parent.children[index]
        sibling = Node(leaf=child.leaf)

        if child.leaf:
            split = (len(child.keys) + 1) // 2
            sibling.keys = child.keys[split:]
            child.keys = child.keys[:split]
            sibling.next_leaf = child.next_leaf
            child.next_leaf = sibling
            parent.keys.insert(index, sibling.keys[0])
        else:
            mid = len(child.keys) // 2
            promoted = child.keys[mid]
            sibling.keys = child.keys[mid + 1 :]
            child.keys = child.keys[:mid]
            sibling.children = child.children[mid + 1 :]
            child.children = child.children[: mid + 1]
            parent.keys.insert(index, promoted)

        parent.children.insert(index + 1, sibling)`,
    },
    c: {
      title: "C: minimal B+ tree split",
      code: `void split_child(Node *parent, int index) {
    Node *child = parent->children[index];
    Node *sibling = make_node(child->is_leaf);

    if (child->is_leaf) {
        int split = (child->key_count + 1) / 2;
        move_leaf_keys(child, sibling, split);
        sibling->next_leaf = child->next_leaf;
        child->next_leaf = sibling;
        insert_parent_key(parent, index, sibling->keys[0], sibling);
    } else {
        int mid = child->key_count / 2;
        int promoted = child->keys[mid];
        move_internal_keys(child, sibling, mid);
        insert_parent_key(parent, index, promoted, sibling);
    }
}`,
    },
  },
  modeNotes: {
    scan: "内部ノードのキーは検索経路を案内するセパレータです。葉に着くまでは実データ確認をしません。",
    descend: "B+ Tree は内部ノードを経路案内だけに使い、最終的な一致確認は葉で行います。",
    "leaf-insert":
      "実データは葉にだけ入るので、挿入の確定は葉ノードで起こります。",
    "leaf-delete":
      "実データは葉にだけあるので、削除も葉で確定します。先頭キーが変わる場合は親 separator を更新します。",
    underflow:
      "削除によって葉の最小キー数を下回るため、leaf merge や separator 更新が必要です。これは次の段階で扱います。",
    "split-leaf":
      "葉ノード分割では、右側の最初のキーが親ノードの新しいセパレータになります。",
    "split-internal":
      "内部ノード分割では中央値を親へ昇格させ、内部の案内構造だけを整理します。",
    "root-split":
      "根が葉のまま満杯なら、葉を 2 つに分けて内部ノードを新しい根にします。",
    "range-start":
      "範囲走査はまず開始キーを含む葉を探します。ここまでは通常の検索と同じく内部ノードを降ります。",
    "leaf-scan":
      "開始葉に着いたら、葉のキーを左から右へ読み、開始キーより小さいものを読み飛ばします。",
    collect:
      "範囲内のキーを結果セットへ追加します。ここからは木を上り直さず、葉の中を順に読みます。",
    "chain-hop":
      "現在の葉を読み終えたので next_leaf をたどります。これが B+ Tree の範囲走査で効く部分です。",
    "range-stop":
      "終了キーを超えたので走査を止めます。葉が昇順につながっているため、以降のキーも範囲外です。",
    "range-done": "回収したキーを結果として返します。",
    found: "B+ Tree の検索成功は、必ず葉ノードで確定します。",
    miss: "葉まで降りて見つからなければ、そのキーは存在しません。",
  },
};
