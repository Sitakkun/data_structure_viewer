import { ScenarioWatchPoints } from "../../../components/ScenarioWatchPoints";
import { PaxosState, PaxosStep } from "../types";

interface PaxosInspectorProps {
  step?: PaxosStep;
  paxosState: PaxosState;
  scenarioTitle: string;
  scenarioDescription: string;
  watchPoints?: string[];
}

function countRejected(state: PaxosState) {
  return state.proposers.reduce(
    (total, proposer) => total + proposer.rejectedBy.length,
    0,
  );
}

export function PaxosInspector({
  step,
  paxosState,
  scenarioTitle,
  scenarioDescription,
  watchPoints,
}: PaxosInspectorProps) {
  const activeProposer = step?.highlights.activeProposerId
    ? paxosState.proposers.find(
        (proposer) => proposer.id === step.highlights.activeProposerId,
      )
    : paxosState.proposers[0];

  const promiseCount = step?.metrics.promiseCount ?? activeProposer?.promises.length ?? 0;
  const acceptedCount = step?.metrics.acceptedCount ?? activeProposer?.accepts.length ?? 0;
  const rejectCount = step?.metrics.rejectCount ?? countRejected(paxosState);

  return (
    <aside className="panel panel-inspector">
      <div className="panel-header">
        <p className="eyebrow">Step Log</p>
        <h2>{step?.title ?? scenarioTitle}</h2>
        <p className="panel-copy">{step?.explanation ?? scenarioDescription}</p>
      </div>

      <ScenarioWatchPoints watchPoints={watchPoints} isVisible={!step} />

      <div className="stats-grid">
        <div className="stat-card">
          <span>Promises</span>
          <strong>
            {promiseCount} / {paxosState.quorumSize}
          </strong>
        </div>
        <div className="stat-card">
          <span>Accepted</span>
          <strong>
            {acceptedCount} / {paxosState.quorumSize}
          </strong>
        </div>
        <div className="stat-card">
          <span>Rejects</span>
          <strong>{rejectCount}</strong>
        </div>
        <div className="stat-card">
          <span>Messages</span>
          <strong>{step?.metrics.messageCount ?? paxosState.activeMessages.length}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current phase</p>
        <strong>{step?.highlights.mode ?? paxosState.phase}</strong>
        <span>
          prepare は promise を集める段階、accept request は値を accepted にする段階です。
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Chosen value</p>
        <strong>{paxosState.chosenValue ?? paxosState.learner.chosenValue ?? "-"}</strong>
        <span>
          quorum の accepted が揃った値だけが chosen です。promise だけではまだ値は決まりません。
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">Safety note</p>
        <span>
          2 つの majority quorum は必ず少なくとも 1 つの acceptor を共有します。
          その共有 acceptor が過去の accepted value を promise で伝えるため、後続 proposal は値を引き継げます。
        </span>
      </div>
    </aside>
  );
}
