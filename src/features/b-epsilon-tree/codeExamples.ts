import { BEpsilonCodeExampleSet } from "./types";

export const bEpsilonCodeExamples: BEpsilonCodeExampleSet = {
  snippets: {
    insert: {
      python: {
        title: "Python: buffered insert",
        code: `def insert(self, key: int) -> None:
    msg = Message("insert", key)
    self.root.buffer.append(msg)

    if len(self.root.buffer) >= self.buffer_capacity:
        self.flush(self.root)`,
      },
      c: {
        title: "C: buffered insert",
        code: `void be_insert(Tree *tree, int key) {
    Message msg = make_message(MSG_INSERT, key);
    append_message(&tree->root->buffer, msg);

    if (tree->root->buffer.count >= BUFFER_CAPACITY) {
        flush_node(tree, tree->root);
    }
}`,
      },
    },
    delete: {
      python: {
        title: "Python: tombstone delete",
        code: `def delete(self, key: int) -> None:
    msg = Message("delete", key)
    self.root.buffer.append(msg)

    if len(self.root.buffer) >= self.buffer_capacity:
        self.flush(self.root)`,
      },
      c: {
        title: "C: tombstone delete",
        code: `void be_delete(Tree *tree, int key) {
    Message msg = make_message(MSG_DELETE, key);
    append_message(&tree->root->buffer, msg);

    if (tree->root->buffer.count >= BUFFER_CAPACITY) {
        flush_node(tree, tree->root);
    }
}`,
      },
    },
    flush: {
      python: {
        title: "Python: flush(node)",
        code: `def flush(self, node):
    if node.leaf:
        self.apply_messages(node)
        node.buffer.clear()
        if len(node.records) > self.leaf_capacity:
            self.split_leaf(node)
        return

    batches = group_by_child(node.buffer, node.keys)
    node.buffer.clear()
    for child, messages in batches.items():
        child.buffer.extend(messages)
        if len(child.buffer) >= self.buffer_capacity:
            self.flush(child)`,
      },
      c: {
        title: "C: flush_node(tree, node)",
        code: `void flush_node(Tree *tree, Node *node) {
    if (node->is_leaf) {
        apply_messages(node);
        clear_buffer(&node->buffer);
        if (node->record_count > LEAF_CAPACITY) split_leaf(tree, node);
        return;
    }

    Batch batches[MAX_CHILDREN];
    group_by_child(node, batches);
    clear_buffer(&node->buffer);
    move_batches_to_children(node, batches);
}`,
      },
    },
    search: {
      python: {
        title: "Python: search with buffers",
        code: `def search(self, key: int) -> bool:
    node = self.root
    while True:
        msg = newest_message(node.buffer, key)
        if msg is not None:
            return msg.kind == "insert"
        if node.leaf:
            return key in node.records
        node = choose_child(node, key)`,
      },
      c: {
        title: "C: search with buffers",
        code: `bool be_search(Node *node, int key) {
    while (node != NULL) {
        Message *msg = newest_message(&node->buffer, key);
        if (msg != NULL) return msg->type == MSG_INSERT;
        if (node->is_leaf) return contains_record(node, key);
        node = choose_child(node, key);
    }
    return false;
}`,
      },
    },
  },
  fullImplementations: {
    python: {
      title: "Python: minimal buffered tree",
      code: `class Message:
    def __init__(self, kind: str, key: int) -> None:
        self.kind = kind
        self.key = key

class Node:
    def __init__(self, keys=None, leaf=False) -> None:
        self.keys = keys or []
        self.leaf = leaf
        self.children = []
        self.records = []
        self.buffer = []

class BEpsilonTree:
    def __init__(self, root: Node, buffer_capacity: int = 3) -> None:
        self.root = root
        self.buffer_capacity = buffer_capacity

    def insert(self, key: int) -> None:
        self.root.buffer.append(Message("insert", key))
        if len(self.root.buffer) >= self.buffer_capacity:
            self.flush(self.root)

    def delete(self, key: int) -> None:
        self.root.buffer.append(Message("delete", key))
        if len(self.root.buffer) >= self.buffer_capacity:
            self.flush(self.root)

    def search(self, key: int) -> bool:
        node = self.root
        while True:
            msg = newest_message(node.buffer, key)
            if msg:
                return msg.kind == "insert"
            if node.leaf:
                return key in node.records
            node = choose_child(node, key)

    def flush(self, node: Node) -> None:
        if node.leaf:
            apply_messages(node)
            node.buffer.clear()
            if len(node.records) > self.leaf_capacity:
                self.split_leaf(node)
            return
        batches = group_by_child(node.buffer, node.keys)
        node.buffer.clear()
        for child, messages in batches.items():
            child.buffer.extend(messages)
            if len(child.buffer) >= self.buffer_capacity:
                self.flush(child)

    def split_leaf(self, node: Node) -> None:
        right = Node(leaf=True)
        split = (len(node.records) + 1) // 2
        right.records = node.records[split:]
        node.records = node.records[:split]
        insert_separator_into_parent(node, right.records[0], right)`,
    },
    c: {
      title: "C: minimal buffered tree skeleton",
      code: `typedef enum { MSG_INSERT, MSG_DELETE } MessageType;

typedef struct {
    MessageType type;
    int key;
    int sequence;
} Message;

typedef struct Node {
    bool is_leaf;
    int keys[MAX_KEYS];
    int records[MAX_RECORDS];
    Buffer buffer;
    struct Node *children[MAX_CHILDREN];
} Node;

void be_insert(Tree *tree, int key) {
    append_message(&tree->root->buffer, make_message(MSG_INSERT, key));
    if (tree->root->buffer.count >= BUFFER_CAPACITY) {
        flush_node(tree, tree->root);
    }
}

void flush_node(Tree *tree, Node *node) {
    if (node->is_leaf) {
        apply_messages(node);
        clear_buffer(&node->buffer);
        if (node->record_count > LEAF_CAPACITY) split_leaf(tree, node);
        return;
    }
    move_buffer_batches_to_children(tree, node);
}

bool be_search(Node *node, int key) {
    while (node != NULL) {
        Message *msg = newest_message(&node->buffer, key);
        if (msg != NULL) return msg->type == MSG_INSERT;
        if (node->is_leaf) return contains_record(node, key);
        node = choose_child(node, key);
    }
    return false;
}`,
    },
  },
  modeNotes: {
    "create-message":
      "Bε tree では更新を record 変更ではなく message として扱います。",
    "buffer-insert":
      "ここが通常の B-tree と大きく違う点です。更新はまず内部 buffer に溜まり、葉への書き込みは後回しになります。",
    partition:
      "separator key を使って、各 message がどの child range に属するかを決めています。",
    flush:
      "複数 message を batch として下位ノードへ移動します。これにより小さなランダム書き込みをまとめます。",
    apply:
      "葉まで届いた message を record に反映します。delete は tombstone として既存 record を取り除きます。",
    "split-leaf":
      "葉の record capacity を超えたため、葉を左右に分け、右葉の先頭 key を親 separator として追加します。",
    "split-internal":
      "内部ノードの separator が増えすぎたため、中央値を親へ昇格し、左右の中間ノードに分けます。",
    "root-split":
      "root が capacity を超えると新しい root が作られ、木の高さが 1 増えます。この時点で中間ノードが増えます。",
    "search-buffer":
      "検索では path 上の buffer を確認します。葉 record より新しい insert/delete が残っている可能性があるためです。",
    "search-leaf": "buffer に該当 message がなければ、最後に葉の record を確認します。",
    found: "insert message または葉 record により、対象 key が存在すると判断できます。",
    miss: "buffer と葉 record の両方に見つからないため miss です。",
    tombstone:
      "delete tombstone が見つかると、古い record が葉に残っていても論理的には削除済みです。",
  },
};
