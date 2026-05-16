import { AcceptorState, PaxosMessage, PaxosState, PaxosStep } from "../types";

interface PaxosViewProps {
  paxosState: PaxosState;
  step?: PaxosStep;
}

function stateValue(value?: string | number) {
  return value ?? "-";
}

function MessageChip({ message }: { message: PaxosMessage }) {
  return (
    <span className={message.dropped ? "paxos-message is-dropped" : "paxos-message"}>
      <strong>{message.type}</strong>
      <small>
        {message.from} → {message.to}
      </small>
      <small>n={message.proposalNumber}</small>
      {message.value ? <small>v={message.value}</small> : null}
      {message.carriesAcceptedValue ? (
        <small>accepted={message.carriesAcceptedValue}</small>
      ) : null}
    </span>
  );
}

function AcceptorCard({
  acceptor,
  isActive,
}: {
  acceptor: AcceptorState;
  isActive: boolean;
}) {
  return (
    <article className={isActive ? "paxos-acceptor-card is-active" : "paxos-acceptor-card"}>
      <div className="paxos-card-header">
        <strong>{acceptor.id}</strong>
        <span>Acceptor</span>
      </div>
      <dl className="paxos-state-list">
        <div>
          <dt>promised</dt>
          <dd>{stateValue(acceptor.promisedProposal)}</dd>
        </div>
        <div>
          <dt>accepted</dt>
          <dd>
            {acceptor.acceptedProposal
              ? `n=${acceptor.acceptedProposal}, v=${acceptor.acceptedValue}`
              : "-"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function PaxosView({ paxosState, step }: PaxosViewProps) {
  const activeProposerId = step?.highlights.activeProposerId;
  const activeAcceptorIds = step?.highlights.activeAcceptorIds ?? [];

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>Single-Decree Paxos</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">Acceptors = {paxosState.acceptors.length}</span>
        <span className="formula-pill">Quorum = {paxosState.quorumSize}</span>
        <span className="formula-pill">Phase = {paxosState.phase}</span>
        <span className="formula-note">
          majority が交差するため、chosen 済みの値と矛盾する quorum は作れません。
        </span>
      </div>

      <div className="paxos-stage">
        <div className="paxos-proposer-row">
          {paxosState.proposers.map((proposer) => (
            <article
              key={proposer.id}
              className={
                proposer.id === activeProposerId
                  ? "paxos-proposer-card is-active"
                  : "paxos-proposer-card"
              }
            >
              <div className="paxos-card-header">
                <strong>{proposer.id}</strong>
                <span>Proposer</span>
              </div>
              <dl className="paxos-state-list">
                <div>
                  <dt>proposal</dt>
                  <dd>n={proposer.proposalNumber}</dd>
                </div>
                <div>
                  <dt>value</dt>
                  <dd>{proposer.proposedValue}</dd>
                </div>
                <div>
                  <dt>promises</dt>
                  <dd>{proposer.promises.join(", ") || "-"}</dd>
                </div>
                <div>
                  <dt>accepted</dt>
                  <dd>{proposer.accepts.join(", ") || "-"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <div className="paxos-message-lane">
          {paxosState.activeMessages.length ? (
            paxosState.activeMessages.map((message) => (
              <MessageChip key={message.id} message={message} />
            ))
          ) : (
            <span className="paxos-empty-message">No active messages</span>
          )}
        </div>

        <div className="paxos-acceptor-grid">
          {paxosState.acceptors.map((acceptor) => (
            <AcceptorCard
              key={acceptor.id}
              acceptor={acceptor}
              isActive={activeAcceptorIds.includes(acceptor.id)}
            />
          ))}
        </div>

        <article className={paxosState.chosenValue ? "paxos-learner-card is-chosen" : "paxos-learner-card"}>
          <div className="paxos-card-header">
            <strong>L1</strong>
            <span>Learner</span>
          </div>
          <div className="paxos-learner-content">
            <span>chosen value</span>
            <strong>{paxosState.chosenValue ?? paxosState.learner.chosenValue ?? "-"}</strong>
            <small>
              accepted counts:{" "}
              {Object.entries(paxosState.learner.acceptedCounts)
                .map(([value, count]) => `${value}:${count}`)
                .join(", ") || "-"}
            </small>
          </div>
        </article>
      </div>
    </section>
  );
}
