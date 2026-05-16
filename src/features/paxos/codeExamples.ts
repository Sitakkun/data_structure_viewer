import { PaxosCodeExampleSet } from "./types";

export const paxosCodeExamples: PaxosCodeExampleSet = {
  snippets: {
    propose: {
      pseudo: {
        title: "Pseudo: single proposer",
        code: `send Prepare(n) to acceptors
wait until Promise count >= majority

if any Promise has accepted value:
    value = highest accepted value

send AcceptRequest(n, value)
wait until Accepted count >= majority
mark value as chosen`,
      },
      python: {
        title: "Python-ish: propose",
        code: `def propose(n, value, acceptors):
    promises = [a.prepare(n) for a in acceptors]
    quorum = [p for p in promises if p.ok]
    if len(quorum) < majority:
        return "retry"

    value = adopt_highest_accepted(quorum, value)
    accepted = [a.accept(n, value) for a in acceptors]
    return "chosen" if count_ok(accepted) >= majority else "retry"`,
      },
    },
    "message-loss": {
      pseudo: {
        title: "Pseudo: quorum tolerates loss",
        code: `broadcast Prepare(n)
responses = collect_until_timeout()

if Promise count >= majority:
    continue to AcceptRequest
else:
    retry with higher n`,
      },
      python: {
        title: "Python-ish: ignore missing nodes",
        code: `responses = []
for acceptor in acceptors:
    response = network.try_send_prepare(acceptor, n)
    if response is not None:
        responses.append(response)

if count_promises(responses) >= majority:
    send_accept_request(n, value)`,
      },
    },
    conflict: {
      pseudo: {
        title: "Pseudo: reject lower proposal",
        code: `on Prepare(n):
    if n > promised_n:
        promised_n = n
        return Promise
    return Reject(promised_n)

on AcceptRequest(n, value):
    if n >= promised_n:
        accepted = (n, value)
        return Accepted
    return Reject(promised_n)`,
      },
      python: {
        title: "Python-ish: acceptor guard",
        code: `def prepare(self, n):
    if n > self.promised_n:
        self.promised_n = n
        return Promise(self.accepted)
    return Reject(self.promised_n)

def accept(self, n, value):
    if n >= self.promised_n:
        self.accepted = (n, value)
        return Accepted(n, value)
    return Reject(self.promised_n)`,
      },
    },
    preserve: {
      pseudo: {
        title: "Pseudo: adopt accepted value",
        code: `promises = wait_for_majority()
accepted = values_carried_by(promises)

if accepted is not empty:
    value = value with highest accepted proposal
else:
    value = own proposed value

send AcceptRequest(n, value)`,
      },
      python: {
        title: "Python-ish: preserve safety",
        code: `def choose_value(promises, own_value):
    carried = [p.accepted for p in promises if p.accepted]
    if not carried:
        return own_value
    return max(carried, key=lambda pair: pair.n).value`,
      },
    },
    recover: {
      pseudo: {
        title: "Pseudo: retry after reject",
        code: `if rejected:
    n = choose_number_higher_than_seen()
    restart Prepare(n)

never reuse an old proposal number
after a higher promise is observed`,
      },
      python: {
        title: "Python-ish: bump proposal number",
        code: `def retry_after_reject(rejects):
    highest_seen = max(r.promised_n for r in rejects)
    next_n = highest_seen + 1
    return propose(next_n, current_value)`,
      },
    },
  },
  fullImplementations: {
    pseudo: {
      title: "Pseudo: Paxos lifecycle",
      code: `Acceptor state:
  promised_n
  accepted_n, accepted_value

Phase 1:
  Proposer sends Prepare(n)
  Acceptor promises not to accept lower n
  Promise includes any previous accepted value

Phase 2:
  Proposer sends AcceptRequest(n, value)
  Acceptor accepts if n >= promised_n
  Value is chosen when accepted by majority`,
    },
    python: {
      title: "Python-ish: tiny acceptor",
      code: `class Acceptor:
    def __init__(self):
        self.promised_n = -1
        self.accepted = None

    def prepare(self, n):
        if n > self.promised_n:
            self.promised_n = n
            return ("promise", self.accepted)
        return ("reject", self.promised_n)

    def accept(self, n, value):
        if n >= self.promised_n:
            self.promised_n = n
            self.accepted = (n, value)
            return ("accepted", n, value)
        return ("reject", self.promised_n)`,
    },
  },
  modeNotes: {
    idle: "Paxos はまず proposer が proposal number を選ぶところから始まります。",
    prepare: "prepare は値を書き込む段階ではなく、より低い番号を締め出す予約です。",
    promise: "promise の quorum が取れたら accept phase に進めます。過去の accepted value があればここで伝わります。",
    "accept-request": "accept request は proposal number と値の組を acceptor に記録させる段階です。",
    accepted: "accepted が quorum に届くと learner は値を chosen と判断できます。",
    chosen: "chosen になった値は safety 上、後続 proposal でも矛盾しない形で引き継がれます。",
    reject: "reject はより大きい proposal number が既に promise されていることを示します。",
    retry: "retry では観測した番号より大きい proposal number を選び直します。",
    "adopt-value": "promise が accepted value を運んできた場合、proposer は自分の希望値よりその値を優先します。",
    "message-loss": "全ノードではなく quorum を満たせば進めるため、一部メッセージロスに耐えられます。",
  },
};
